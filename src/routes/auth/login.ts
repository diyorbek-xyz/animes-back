import { Request, Response, Router } from 'express';
import AuthModel from '../../models/auth';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const login = Router();
const SECRET = process.env.SECRET ?? '5588';

login.get('/login', (req: Request, res: Response) => res.render('users/login', { layout: 'login' }));
login.post('/login', async (req: Request, res: Response) => {
	const { username, password } = req.body;
	const user = await AuthModel.findOne({ username: username.toLowerCase() });
	if (!user) return res.status(404).json({ message: 'User Not Found' });

	const match = await bcrypt.compare(password, user.password);
	if (!match) return res.status(401).json({ message: 'Wrong passwod' });

	const token = jwt.sign({ id: user._id, role: user.role, username: user.username }, SECRET);

	res.cookie('token', token);
	res.json({ data: { token, user } });
});
login.get('/logout', (req: Request, res: Response) => {
	res.clearCookie('token');
	res.json("logged out");
});
export { login };
