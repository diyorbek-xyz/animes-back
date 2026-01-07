import { Router, Request, Response } from 'express';
import chalk from 'chalk';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { verifyToken } from '@/middlewares/verify_access';
import { AnimeModel, SeasonModel } from '@/models/anime';
import upload from '@/middlewares/upload';
import sortFiles from '@/middlewares/sort_files';
import addPoster from '@/middlewares/add_poster';
import HttpError from '@/utils/error';
import { Season } from '@/types';

const seasonRoute = Router();

seasonRoute.get('/season', async (req: Request, res: Response) => {
	try {
		if (req.query.season) {
			const season = await SeasonModel.findOne({ season: req.query.season }).populate('anime', 'name').populate('episodes').lean();
			res.json(season);
		} else {
			const anime = await AnimeModel.find().lean();
			const season = await SeasonModel.find().populate('anime', 'name').populate('episodes').lean();
			res.json({ data: { anime, season } });
		}
	} catch (error) {
		res.send(error);
	}
});
seasonRoute.delete('/season', verifyToken, async (req: Request, res: Response) => {
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
		await session.abortTransaction();
		session.endSession();
		res.send(error);
	}
});
seasonRoute.post('/season', upload.fields([{ name: 'poster', maxCount: 1 }]), sortFiles, addPoster, async (req: Request, res: Response, d) => {
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
		await session.abortTransaction();
		session.endSession();
		res.send(error);
	}
});

export { seasonRoute };
