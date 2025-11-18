import { Request, Response, Router } from 'express';
import { Anime, AnimeFiles, Episode, ProcessFiles, Season } from '../types';
import verifyToken from '../middlewares/login';
import { response } from '../utils/response';
import { AnimeModel, EpisodeModel, SeasonModel } from '../models/anime';
import HttpError from '../utils/error';
import chalk from 'chalk';
import upload from '../middlewares/upload';
import processVideo from '../middlewares/process_video';
import mongoose from 'mongoose';

const router = Router();

// BUG: ANIME --> --> --> --> --> --> --> --> --> --> --> --> --> --> --> -->

router.get('/', verifyToken, async (req: Request, res: Response) => {
	try {
		if (req.query.anime) {
			const anime = await AnimeModel.findOne({ anime: req.query.anime }).populate('seasons').lean();
			res.json(anime);
		} else {
			const data = await AnimeModel.find().populate('seasons',"poster title season").lean();
			response({ req, res, data, render: 'animes/anime', name: 'anime' });
		}
	} catch (err) {
		if (err instanceof HttpError) {
			console.error(chalk.red(err.message));
			res.json({ error: err.message }).status(err.status);
		} else {
			console.error(chalk.red(err));
			res.json({ error: err }).status(500);
		}
	}
});
router.delete('/', verifyToken, async (req: Request, res: Response) => {
	try {
		const id = req.query.id ?? req.body.id;
		console.log(id);

		await AnimeModel.findByIdAndDelete(id);
		res.json({ message: 'Succesfully deleted: ' + id });
	} catch (err) {
		if (err instanceof HttpError) {
			console.error(chalk.red(err.message));
			res.json({ error: err.message }).status(err.status);
		} else {
			console.error(chalk.red(err));
			res.json({ error: err }).status(500);
		}
	}
});

router.post('/', upload.fields([{ name: 'poster', maxCount: 1 }]), async (req: Request & AnimeFiles, res: Response) => {
	const session = await mongoose.startSession();
	session.startTransaction();
	try {
		console.log(chalk.blue('Starting create anime...'));

		const data = req.body as Anime;
		const poster = req.files?.poster?.[0].path;

		if (!data) throw new HttpError(400, 'Request body is empty');
		const exist = await AnimeModel.findOne({ name: data.name });
		if (!!exist) throw new HttpError(400, 'This anime already exist');

		const anime = await AnimeModel.create({ ...data, poster });

		if (data.seasons) {
			await Promise.all(data.seasons.map((season) => SeasonModel.findByIdAndUpdate(season._id, { $set: { anime: anime._id } }, { session })));
		}
		await session.commitTransaction();
		session.endSession();
		res.json({ message: 'Succesfully Created', data: anime });
		console.log(chalk.yellow('Finished create anime.'));
	} catch (err) {
		await session.abortTransaction();
		session.endSession();
		if (err instanceof HttpError) {
			console.error(chalk.red(err.message));
			res.json({ error: err.message }).status(err.status);
		} else {
			console.error(chalk.red(err));
			res.json({ error: err }).status(500);
		}
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
	} catch (err) {
		if (err instanceof HttpError) {
			console.error(chalk.red(err.message));
			res.json({ error: err.message }).status(err.status);
		} else {
			console.error(chalk.red(err));
			res.json({ error: err }).status(500);
		}
	}
});
router.delete('/season', verifyToken, async (req: Request, res: Response) => {
	try {
		const id = req.query.id ?? req.body.id;
		console.log(id);

		await SeasonModel.findByIdAndDelete(id);
		res.json({ message: 'Succesfully deleted: ' + id });
	} catch (err) {
		if (err instanceof HttpError) {
			console.error(chalk.red(err.message));
			res.json({ error: err.message }).status(err.status);
		} else {
			console.error(chalk.red(err));
			res.json({ error: err }).status(500);
		}
	}
});
router.post('/season', upload.fields([{ name: 'poster', maxCount: 1 }]), async (req: Request & AnimeFiles, res: Response, d) => {
	const session = await mongoose.startSession();
	session.startTransaction();
	try {
		const data = req.body as Season;
		const poster = req.files?.poster?.[0].path;
		let exist = await SeasonModel.findOne({ season: data.season });
		if (!!exist) throw new HttpError(400, 'This season already exist');

		const season = await SeasonModel.create({ ...data, poster });

		console.log(season);

		await AnimeModel.findByIdAndUpdate(season.anime, { $push: { seasons: season._id } });
		if (data.episodes) {
			console.log('ITS FALSE BRO');

			await Promise.all(data.episodes.map((episode) => EpisodeModel.findByIdAndUpdate(episode._id, { $set: { season: season._id } })));
		}
		console.log('ITS GOOD BRO');
		await session.commitTransaction();
		session.endSession();
		res.json({ message: 'Succesfully Created', data: season });
	} catch (err) {
		await session.abortTransaction();
		session.endSession();
		if (err instanceof HttpError) {
			console.error(chalk.red(err.message));
			res.json({ error: err.message }).status(err.status);
		} else {
			console.error(chalk.red(err));
			res.json({ error: err }).status(500);
		}
	}
});

// NOTE: SEASON --> --> --> --> --> --> --> --> --> --> --> --> --> --> --> -->

// BUG: EPISODE --> --> --> --> --> --> --> --> --> --> --> --> --> --> --> -->

router.post('/episode', upload.fields([{ name: 'file', maxCount: 1 }]), processVideo, async (req: Request & ProcessFiles, res: Response) => {
	const session = await mongoose.startSession();
	session.startTransaction();
	try {
		if (!req.data) throw new HttpError(400, 'Error processing video');
		const data = req.body as Episode;
		const exist = await EpisodeModel.findOne({ episode: data.episode });
		if (!!exist) throw new HttpError(400, 'This episode already exist');

		const episode = await EpisodeModel.create({
			...data,
			video: req.data.video,
			previews: req.data.previews,
			download: req.data.download,
		});
		await AnimeModel.findByIdAndUpdate(episode.anime, { $push: { episodes: episode[0]._id } }, { session });
		await SeasonModel.findByIdAndUpdate(episode.season, { $push: { episodes: episode[0]._id } }, { session });

		await session.commitTransaction();
		session.endSession();
		res.json({ message: 'Succesfully Created', data: episode });
	} catch (err) {
		await session.abortTransaction();
		session.endSession();
		if (err instanceof HttpError) {
			console.error(chalk.red(err.message));
			res.json({ error: err.message }).status(err.status);
		} else {
			console.error(chalk.red(err));
			res.json({ error: err }).status(500);
		}
	}
});

// NOTE: EPSIDE --> --> --> --> --> --> --> --> --> --> --> --> --> --> --> -->

export default router;
