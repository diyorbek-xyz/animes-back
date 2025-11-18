import { Request, Response, Router } from 'express';
import { AccountFiles, VerifyToken } from '../types';
import upload from '../middlewares/upload';
import sharp from 'sharp';
import fs from 'fs';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import path from 'path';
import verifyToken, { permit } from '../middlewares/login';
import LoginModel from '../models/login';
import { response } from '../utils/response';

const SECRET = process.env.SECRET ?? '5588';
const auth = Router();

auth.get('/signup', (req: Request, res: Response) => res.render('users/signup', { layout: 'login' }));
auth.get('/login', (req: Request, res: Response) => res.render('users/login', { layout: 'login' }));

auth.get('/accounts', verifyToken, permit('admin', 'creator'), async (req: Request, res: Response) => {
	try {
		if (req.query.id) {
			const data = await LoginModel.findById(req.query.id).select('-password -__v').lean();
			response({ req, res, render: 'users/account', name: 'account', data: data });
		} else {
			const data = await LoginModel.find().lean();
			response({ req, res, render: 'users/accounts', name: 'accounts', data: data });
		}
	} catch (err) {
		res.status(404).json({ message: 'Error', err });
	}
});

auth.post('/signup', async (req: Request, res: Response) => {
	const { username, password, role, first_name, last_name } = req.body;
	const hashed = await bcrypt.hash(password, 10);
	const exist = await LoginModel.findOne({ username: username.toLowerCase() });

	if (!exist) {
		const user = await LoginModel.create({ username: username.toLowerCase(), password: hashed, role, first_name, last_name });

		if (req.query.create) {
			response({ redirect: '/accounts', req, res, data: user });
		} else {
			const token = jwt.sign({ id: user._id, role: user.role }, SECRET);
			res.cookie('token', token);
			response({ redirect: '/me', req, res, data: { token, user } });
		}
	} else {
		res.status(409).json({ message: 'This username already taken' }).redirect('/signup');
	}
});
auth.post('/login', async (req: Request, res: Response) => {
	const { username, password } = req.body;
	const user = await LoginModel.findOne({ username: username.toLowerCase() });
	if (!user) return res.status(404).json({ message: 'User Not Found' });

	const match = await bcrypt.compare(password, user.password);
	if (!match) return res.status(401).json({ message: 'Wrong passwod' });

	const token = jwt.sign({ id: user._id, role: user.role, username: user.username }, SECRET);

	res.cookie('token', token);
	response({ redirect: '/account', req, res, data: { token, user } });
});

auth.get('/logout', (req: Request, res: Response) => {
	res.clearCookie('token');
	response({ redirect: '/login', req, res });
});

auth.get('/account', verifyToken, async (req: Request & VerifyToken, res: Response) => {
	const user = await LoginModel.findById(req.user?.id).select('-password -__v -role -_id').lean();

	response({ req, res, render: 'users/dashboard', data: user, name: 'dashboard' });
});

auth.put(
	'/account',
	verifyToken,
	upload.fields([
		{ name: 'avatar', maxCount: 1 },
		{ name: 'banner', maxCount: 1 },
	]),
	async (req: Request & VerifyToken & AccountFiles, res: Response) => {
		const props = req.body;
		const avatar = req.files?.avatar?.at(0)?.path;
		const banner = req.files?.banner?.at(0)?.path;
		const newDir = path.join('uploads', 'users', props.username);
		const newBanner = banner && path.join(newDir, 'banner.png');
		const newAvatar = avatar && path.join(newDir, 'avatar.png');

		fs.mkdirSync(newDir, { recursive: true });

		if (newBanner) {
			await sharp(banner)
				.resize({
					height: 480,
					fit: 'cover',
					position: 'center',
				})
				.toFormat('png', { compression: 'hevc', compressionLevel: 5, quality: 85, alphaQuality: 80, preset: 'drawing' })
				.toFile(newBanner)
				.then(async () => fs.unlinkSync(banner));
		}
		if (newAvatar) {
			await sharp(avatar)
				.resize({
					height: 480,
					fit: 'cover',
					position: 'center',
				})
				.toFormat('png', { compression: 'hevc', compressionLevel: 5, quality: 85, alphaQuality: 80, preset: 'drawing' })
				.toFile(newAvatar)
				.then(async () => fs.unlinkSync(avatar));
		}
		const id = req.query.id ?? req.user?.id;

		const user = await LoginModel.findByIdAndUpdate(id, { avatar: newAvatar, banner: newBanner, ...props }, { new: true })
			.select('-password -__v -role')
			.lean();

		response({ req, res, data: user, redirect: `/accounts?id=${id}` });
		if (!user) return res.status(404).json({ message: 'User Not Found' });
	}
);

auth.delete('/account', verifyToken, permit('admin', 'creator'), async (req: Request & VerifyToken, res: Response) => {
	try {
		if (req.query.id !== req.user?.id) {
			const data = await LoginModel.findById(req.query.id);

			if (data?.avatar) fs.unlinkSync(data.avatar);
			if (data?.banner) fs.unlinkSync(data.banner);

			await LoginModel.findByIdAndDelete(req.query.id);
			return response({ req, res, redirect: '/accounts' });
		}
		return response({ req, res, data: { message: 'You can not delete yourself' }, redirect: '/accounts' });
	} catch (err) {
		res.status(404).json({ message: 'Error', err });
	}
});
export default auth;
