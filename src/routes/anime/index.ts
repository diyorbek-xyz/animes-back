import { Router } from 'express';
import { animeRoute } from './anime';
import { seasonRoute } from './season';
import { episodeRoute } from './episode';

const animeRoutes = Router();

animeRoutes.use('/', animeRoute);
animeRoutes.use('/', seasonRoute);
animeRoutes.use('/', episodeRoute);

export { animeRoutes };
