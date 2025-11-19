import { Request, Response, Router } from 'express';
import { AnimeModel, EpisodeModel, SeasonModel } from '../models/anime';
import LoginModel from '../models/login';

const router = Router();

router.get('/animes', async (req: Request, res: Response) => {
	const data = await AnimeModel.find().lean();
	res.render('collections/animes', { data });
});

router.get('/seasons', async (req: Request, res: Response) => {
	const data = await SeasonModel.find().lean();
	res.render('collections/seasons', { data });
});

router.get('/episodes', async (req: Request, res: Response) => {
	const data = await EpisodeModel.find().lean();
	res.render('collections/episodes', { data });
});

router.get('/accounts', async (req: Request, res: Response) => {
	const data = await LoginModel.find().populate('').lean();
	console.log(data);
	res.render('collections/accounts', { data });
});

export default router;
