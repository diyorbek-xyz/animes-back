import { Request, Response, Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import AuthModel from '../../models/account';

const SECRET = process.env.SECRET ?? '5588';
const register = Router();

register.get('/register', (req: Request, res: Response) => res.render('users/register', { layout: 'login' }));

register.post('/register', async (req: Request, res: Response) => {
	const { username, password, role, firstname, lastname } = req.body;
	const hashed = await bcrypt.hash(password, 10);
	const exist = await AuthModel.findOne({ username: username.toLowerCase() });

	if (!exist) {
		const user = await AuthModel.create({ username: username.toLowerCase(), password: hashed, role, firstname, lastname });

		if (req.query.create) {
			res.json({ data: user });
		} else {
			const token = jwt.sign({ id: user._id, role: user.role, username: user.username }, SECRET);
			res.cookie('token', token);
			res.json({ data: { token, user } });
		}
	} else {
		res.status(409).json({ message: 'This username already taken' }).redirect('/register');
	}
});

register.post('/check/username', async (req: Request, res: Response) => {
	try {
		const body = await req.body;
		const exist = await AuthModel.findOne({ username: body.username });
		if (exist) return res.json({ message: 'This username is not available', available: false });

		const type = /^[a-zA-Z0-9._]+$/.test(body.username);

		if (!type) return res.json({ message: 'Username can only contain letters, numbers, dots, and underscores.', available: false });
		return res.json({ message: 'This username is available', available: true });
	} catch (error) {
		console.error(error);
		return res.json({ message: error });
	}
});

export { register };
