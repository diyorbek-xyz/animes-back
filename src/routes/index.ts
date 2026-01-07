import { Router } from 'express';
import { authRoutes } from './auth';
import { collectionsRoutes } from './collections';
import { animeRoutes } from './anime';

const routes = Router();

routes.use('/', authRoutes);
routes.use('/api/anime/', animeRoutes);

routes.use('/collection/', collectionsRoutes);

export { routes };
