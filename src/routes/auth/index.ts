import { Router } from 'express';
import { login } from './login';
import { register } from './register';
import account from './auth';

const authRoutes = Router();

authRoutes.use('/auth', login);
authRoutes.use('/auth', register);
authRoutes.use('/', account);

export { authRoutes };
