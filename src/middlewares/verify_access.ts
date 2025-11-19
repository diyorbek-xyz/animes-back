import { Request, Response } from 'express';
import { User } from '../types';
import jwt from 'jsonwebtoken';
import LoginModel from '../models/login';
import { response } from '../utils/response';

const SECRET = process.env.SECRET ?? '5588';

const verifyToken = async (req: Request, res: Response, next: Function) => {
	const token = req.cookies.token ?? req.headers.authorization?.split(' ')[1];
	if (!token) return response({ req, res, data: 'Token required', redirect: '/login' });

	try {
		const user = jwt.verify(token, SECRET) as User;

		const data = await LoginModel.find({ _id: user.id });
		if (!data[0]) return res.status(401).json({ error: 'User Not Found' });

		req.user = user;
		next();
	} catch (err) {
		res.status(401).json({ error: 'Token invalid' });
	}
};

const permit = (...allowedRoles: string[]) => {
	return (req: Request, res: Response, next: Function) => {
		if (!req.user) return res.json({ error: 'User not authenticated' }).status(401);
		if (!allowedRoles.includes(req.user.role)) return res.json({ error: 'Access denied' }).status(403);
		next();
	};
};

export { verifyToken, permit };
