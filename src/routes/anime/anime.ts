import { Router, Request, Response } from 'express';
import chalk from 'chalk';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { verifyToken } from '@/middlewares/verify_access';
import { AnimeModel, EpisodeModel, SeasonModel } from '@/models/anime';
import upload from '@/middlewares/upload';
import sortFiles from '@/middlewares/sort_files';
import addPoster from '@/middlewares/add_poster';
import HttpError from '@/utils/error';

const animeRoute = Router();

animeRoute.get('/', verifyToken, async (req: Request, res: Response) => {
	
	try {
		if (req.query.anime) {
			const anime = await AnimeModel.findOne({ anime: req.query.anime }).populate('seasons').lean();
			res.json(anime);
		} else {
			const data = await AnimeModel.find().populate('seasons', 'poster title season').lean();
			res.json(data);
		}
	} catch (error) {
		res.send(error);
	}
});
animeRoute.delete('/', verifyToken, async (req: Request, res: Response) => {
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
		res.send(error);
	}
});
animeRoute.post('/', upload.fields([{ name: 'poster', maxCount: 1 }]), sortFiles, addPoster, async (req: Request, res: Response) => {
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
		res.send(error);
	}
});

export { animeRoute };
