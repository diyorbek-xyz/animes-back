/** @format */

const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const LoginModel = require('../models/login');
const { verifyToken, permit } = require('../middlewares/login');
const upload = require('../middlewares/upload');
const response = require('../utils/response');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');

const router = Router();

router.get('/signup', (req, res) => res.render('users/signup', { layout: 'login' }));
router.get('/login', (req, res) => res.render('users/login', { layout: 'login' }));

router.get('/accounts', verifyToken, permit('admin', 'creator'), async (req, res) => {
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

router.post('/signup', async (req, res) => {
	const { username, password, role, first_name, last_name } = req.body;
	const hashed = await bcrypt.hash(password, 10);
	const exist = await LoginModel.findOne({ username: username.toLowerCase() });

	if (!exist) {
		const user = await LoginModel.create({ username: username.toLowerCase(), password: hashed, role, first_name, last_name });

		if (req.query.create) {
			response({ redirect: '/accounts', req, res, data: user });
		} else {
			const token = jwt.sign({ id: user._id, role: user.role }, process.env.SECRET);
			res.cookie('token', token);
			response({ redirect: '/me', req, res, data: { token, user } });
		}
	} else {
		res.status(409).json({ message: 'This username already taken' }).redirect('/signup');
	}
});
router.post('/login', async (req, res) => {
	const { username, password } = req.body;

	const user = await LoginModel.findOne({ username: username.toLowerCase() });
	if (!user) return res.status(404).json({ message: 'User Not Found' });

	const match = await bcrypt.compare(password, user.password);
	if (!match) return res.status(401).json({ message: 'Wrong passwod' });

	const token = jwt.sign({ id: user._id, role: user.role }, process.env.SECRET);

	res.cookie('token', token);
	response({ redirect: '/account', req, res, data: { token, user } });
});

router.get('/logout', (req, res) => {
	res.clearCookie('token');
	response({ redirect: '/login', req, res });
});

router.get('/account', verifyToken, async (req, res) => {
	const user = await LoginModel.findById(req.user.id).select('-password -__v -role -_id').lean();

	response({ req, res, render: 'users/dashboard', data: user, name: 'dashboard' });
});

router.put(
	'/account',
	verifyToken,
	upload.fields([
		{ name: 'avatar', maxCount: 1 },
		{ name: 'banner', maxCount: 1 },
	]),
	async (req, res) => {
		const props = req.body;
		const avatar = req.files?.avatar?.[0]?.path;
		const banner = req.files?.banner?.[0]?.path;
		const newDir = path.join('uploads', 'users', props.username);
		const newBanner = banner && path.join(newDir, 'banner.png');
		const newAvatar = avatar && path.join(newDir, 'avatar.png');

		await fs.mkdir(newDir, { recursive: true });

		if (banner) {
			await sharp(banner)
				.resize({
					height: 480,
					fit: 'cover',
					position: 'center',
				})
				.toFormat('png', { compression: 'hevc', compressionLevel: 5, quality: 85, alphaQuality: 80, preset: 'drawing' })
				.toFile(newBanner)
				.then(async () => await fs.unlink(banner));
		}
		if (avatar) {
			await sharp(avatar)
				.resize({
					height: 480,
					fit: 'cover',
					position: 'center',
				})
				.toFormat('png', { compression: 'hevc', compressionLevel: 5, quality: 85, alphaQuality: 80, preset: 'drawing' })
				.toFile(newAvatar)
				.then(async () => await fs.unlink(avatar));
		}
		const id = req.query.id ?? req.user.id;

		const user = await LoginModel.findByIdAndUpdate(id, { avatar: newAvatar, banner: newBanner, ...props }, { new: true })
			.select('-password -__v -role')
			.lean();

		response({ req, res, data: user, redirect: `/accounts?id=${id}` });
		if (!user) return res.status(404).json({ message: 'User Not Found' });
	}
);

router.delete('/account', verifyToken, permit('admin', 'creator'), async (req, res) => {
	try {
		if (req.query.id !== req.user.id) {
			const data = await LoginModel.findById(req.query.id);

			if (data.avatar) await fs.unlink(data.avatar);
			if (data.banner) await fs.unlink(data.banner);

			await LoginModel.findByIdAndDelete(req.query.id);
			return response({ req, res, redirect: '/accounts' });
		}
		return response({ req, res, data: { message: 'You can not delete yourself' }, redirect: '/accounts' });
	} catch (err) {
		res.status(404).json({ message: 'Error', err });
	}
});

module.exports = router;
