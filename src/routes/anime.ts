import { Router, Request, Response, NextFunction } from 'express';
import { Anime, Episode, Season } from '../types';
import { verifyToken } from '../middlewares/verify_access';
import { response } from '../utils/response';
import { AnimeModel, EpisodeModel, SeasonModel } from '../models/anime';
import HttpError from '../utils/error';
import chalk from 'chalk';
import upload from '../middlewares/upload';
import processVideo from '../middlewares/process_video';
import mongoose from 'mongoose';
import fs from 'fs';
import addPoster from '../middlewares/add_poster';
import { CleanAfterError } from '../utils/cleanup';
import sortFiles from '../middlewares/sort_files';
import path from 'path';

const router = Router();

// BUG: ANIME --> --> --> --> --> --> --> --> --> --> --> --> --> --> --> -->

router.get('/', verifyToken, async (req: Request, res: Response) => {
	try {
		if (req.query.anime) {
			const anime = await AnimeModel.findOne({ anime: req.query.anime }).populate('seasons').lean();
			res.json(anime);
		} else {
			const data = await AnimeModel.find().populate('seasons', 'poster title season').lean();
			response({ req, res, data, render: 'animes/anime', name: 'anime' });
		}
	} catch (error) {
		await CleanAfterError({ error, req, res });
	}
});
router.delete('/', verifyToken, async (req: Request, res: Response) => {
	const session = await mongoose.startSession();
	session.startTransaction();
	try {
		const id = req.query.id ?? req.body.id;

		const anime = await AnimeModel.findByIdAndDelete(id, { session });

		const animeDir = path.join('uploads', 'Posters', anime.name.split(' ').join('_'));

		if (fs.existsSync(animeDir)) {
			await fs.rm(animeDir, { recursive: true, force: true }, (err) => {
				if (err) throw new Error(err as any);
				else console.log(chalk.greenBright('Yeeted successfully 💨'));
			});
		}

		await session.commitTransaction();
		session.endSession();
		res.json({ message: 'Succesfully deleted: ' + id });
	} catch (error) {
		await CleanAfterError({ error, req, res, session });
	}
});

router.post('/', upload.fields([{ name: 'poster', maxCount: 1 }]), sortFiles, addPoster, async (req: Request, res: Response) => {
	const session = await mongoose.startSession();
	session.startTransaction();
	try {
		console.log(chalk.blue('Starting create anime...'));

		const data = req.body;

		if (!data) throw new HttpError(400, 'Request body is empty');
		const exist = await AnimeModel.findOne({ name: data.name });
		if (!!exist) throw new HttpError(400, 'This anime already exist');

		const anime = await AnimeModel.create([{ ...data, poster: req.data?.poster, totalSeasons: data.seasons?.length ?? 0, totalEpisodes: data.episodes?.length ?? 0 }], { session });

		if (data.seasons) {
			for (const season of data.seasons) {
				await SeasonModel.findByIdAndUpdate(season, { $set: { anime: anime[0]._id } }, { session });
				if (data.episodes) {
					for (const episode of data.episodes) {
						await EpisodeModel.findByIdAndUpdate(episode, { $set: { season: season._id } }, { session });
					}
				}
			}
		}
		await session.commitTransaction();
		session.endSession();
		res.json({ message: 'Succesfully Created', data: anime });
		console.log(chalk.yellow('Finished create anime.'));
	} catch (error) {
		console.error(error);

		await CleanAfterError({ error, req, res, session, file: req.data?.poster });
	}
});
// NOTE: ANIME --> --> --> --> --> --> --> --> --> --> --> --> --> --> --> -->

// BUG: SEASON --> --> --> --> --> --> --> --> --> --> --> --> --> --> --> -->
router.get('/season', async (req: Request, res: Response) => {
	try {
		if (req.query.season) {
			const season = await SeasonModel.findOne({ season: req.query.season }).populate('anime', 'name').populate('episodes').lean();
			res.json(season);
		} else {
			const anime = await AnimeModel.find().lean();
			const season = await SeasonModel.find().populate('anime', 'name').populate('episodes').lean();
			response({ req, res, data: { anime: anime, season: season }, render: 'animes/season', name: 'season' });
		}
	} catch (error) {
		await CleanAfterError({ error, req, res });
	}
});
router.delete('/season', verifyToken, async (req: Request, res: Response) => {
	const session = await mongoose.startSession();
	session.startTransaction();
	try {
		const id = req.query.id ?? req.body.id;

		const season = await SeasonModel.findByIdAndDelete(id, { session });

		const seasonDir = path.join('uploads', 'Posters', season.title.split(' ').join('_'));

		if (fs.existsSync(seasonDir)) {
			await fs.rm(seasonDir, { recursive: true, force: true }, (err) => {
				if (err) throw new Error(err as any);
				else console.log(chalk.greenBright('Yeeted successfully 💨'));
			});
		}

		await session.commitTransaction();
		session.endSession();
		res.json({ message: 'Succesfully deleted: ' + id });
	} catch (error) {
		await CleanAfterError({ error, req, res, session });
	}
});
router.post('/season', upload.fields([{ name: 'poster', maxCount: 1 }]), sortFiles, addPoster, async (req: Request, res: Response, d) => {
	const session = await mongoose.startSession();
	session.startTransaction();
	try {
		const data = req.body as Season;
		const poster = req.data?.poster;
		let exist = await SeasonModel.findOne({ season: data.season });
		if (!!exist) throw new HttpError(400, 'This season already exist');

		const season = await SeasonModel.create([{ ...data, poster }], { session });

		await session.commitTransaction();
		session.endSession();
		res.json({ message: 'Succesfully Created', data: season });
	} catch (error) {
		await CleanAfterError({ error, req, res, session });
	}
});

// NOTE: SEASON --> --> --> --> --> --> --> --> --> --> --> --> --> --> --> -->

// BUG: EPISODE --> --> --> --> --> --> --> --> --> --> --> --> --> --> --> -->
router.get('/episode', async (req: Request, res: Response) => {
	try {
		if (req.query.season) {
			const episode = await EpisodeModel.findOne({ season: req.query.season }).populate('anime', 'name').populate('episodes').lean();
			res.json(episode);
		} else {
			const anime = await AnimeModel.find().lean();
			const season = await SeasonModel.find().lean();
			const episode = await EpisodeModel.find().populate('anime', 'name').populate('season', 'title poster season').lean();
			response({ req, res, data: { anime, season, episode }, render: 'animes/episode', name: 'data' });
		}
	} catch (error) {
		await CleanAfterError({ error, req, res });
	}
});
router.post(
	'/episode',
	upload.fields([{ name: 'video', maxCount: 1 }]),
	sortFiles,
	async (req: Request, res: Response, next: NextFunction) => {
		const session = await mongoose.startSession();
		session.startTransaction();
		try {
			const data = req.body as Episode;
			const exist = await EpisodeModel.findOne({ episode: data.episode });
			if (!!exist) throw new HttpError(400, 'This episode already exist');
			const inputPath = req.uploads?.video;
			if (!inputPath) return console.error('Input video not found.');

			const outputPath = path.join('uploads', 'Episode_Datas', data.title.split(' ').join('_'));
			const downloadPath = path.join(outputPath, 'download_' + req.body.episode.toString() + path.extname(inputPath));
			const videoPath = path.join(outputPath, 'master.m3u8');
			const previewsPath = path.join(outputPath, 'sprite.vtt');

			console.log(chalk.blue('Starting create anime...'));

			const episode = await EpisodeModel.create(
				[
					{
						...data,
						video: videoPath,
						previews: previewsPath,
						download: downloadPath,
					},
				],
				{ session },
			);
			console.log(chalk.yellow('Finished create anime...'));

			await session.commitTransaction();
			session.endSession();
			res.json({ message: 'Succesfully Created', data: episode });

			req.paths = { output: outputPath, download: downloadPath, video: videoPath, previews: previewsPath, input: inputPath };
			next();
		} catch (error) {
			await CleanAfterError({ error, req, res, session });
		}
	},
	processVideo,
);
router.delete('/episode', verifyToken, async (req: Request, res: Response) => {
	const session = await mongoose.startSession();
	session.startTransaction();
	try {
		const id = req.query.id ?? req.body.id;

		const episode = await EpisodeModel.findByIdAndDelete(id);

		const episodeDir = path.join('uploads', 'Episode_Datas', episode.title.split(' ').join('_'));

		if (fs.existsSync(episodeDir)) {
			await fs.rm(episodeDir, { recursive: true, force: true }, (err) => {
				if (err) throw new Error(err as any);
				else console.log(chalk.greenBright('Yeeted successfully 💨'));
			});
		}

		await session.commitTransaction();
		session.endSession();
		res.json({ message: 'Succesfully deleted: ' + id });
	} catch (error) {
		await CleanAfterError({ error, req, res, session });
	}
});
// NOTE: EPSIDE --> --> --> --> --> --> --> --> --> --> --> --> --> --> --> -->

export default router;
