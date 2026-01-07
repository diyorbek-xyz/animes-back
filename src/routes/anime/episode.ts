import { Router, Request, Response, NextFunction } from 'express';
import chalk from 'chalk';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { verifyToken } from '@/middlewares/verify_access';
import { AnimeModel, EpisodeModel, SeasonModel } from '@/models/anime';
import upload from '@/middlewares/upload';
import sortFiles from '@/middlewares/sort_files';
import HttpError from '@/utils/error';
import { Episode } from '@/types';
import processVideo from '@/middlewares/process_video';

const episodeRoute = Router();

episodeRoute.get('/episode', async (req: Request, res: Response) => {
	try {
		if (req.query.season) {
			const episode = await EpisodeModel.findOne({ season: req.query.season }).populate('anime', 'name').populate('episodes').lean();
			res.json(episode);
		} else {
			const anime = await AnimeModel.find().lean();
			const season = await SeasonModel.find().lean();
			const episode = await EpisodeModel.find().populate('anime', 'name').populate('season', 'title poster season').lean();
			res.json({ data: { anime, season, episode } });
		}
	} catch (error) {
		res.send(error);
	}
});
episodeRoute.post(
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
			await session.abortTransaction();
			session.endSession();
			res.send(error);
		}
	},
	processVideo,
);
episodeRoute.delete('/episode', verifyToken, async (req: Request, res: Response) => {
	const session = await mongoose.startSession();
	session.startTransaction();
	try {
		const id = req.query.id ?? req.body.id;

		const episode = await EpisodeModel.findByIdAndDelete(id);

		const episodeDir = path.join('uploads', 'Episode_Datas', episode.title.split(' ').join('_'));

		if (fs.existsSync(episodeDir)) {
			fs.rm(episodeDir, { recursive: true, force: true }, (err) => {
				if (err) throw new Error(err as any);
				else console.log(chalk.greenBright('Yeeted successfully 💨'));
			});
		}

		await session.commitTransaction();
		session.endSession();
		res.json({ message: 'Succesfully deleted: ' + id });
	} catch (error) {
		await session.abortTransaction();
		session.endSession();
		res.json(error);
	}
});

export { episodeRoute };
