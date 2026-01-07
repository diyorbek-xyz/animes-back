import { Request, Response, Router } from 'express';
import upload from '../../middlewares/upload';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { verifyToken, permit } from '../../middlewares/verify_access';
import LoginModel from '../../models/account';
import sortFiles from '../../middlewares/sort_files';
import chalk from 'chalk';
import mongoose from 'mongoose';

const account = Router();

account.get('/accounts', verifyToken, permit('admin', 'creator'), async (req: Request, res: Response) => {
	try {
		let data;
		if (req.query.id) data = await LoginModel.findById(req.query.id).select('-password -__v').lean();
		else data = await LoginModel.find().lean();
		res.json({ data });
	} catch (err) {
		res.status(404).json({ message: 'Error', err });
	}
});
account.get('/account', verifyToken, async (req: Request, res: Response) => {
	const user = await LoginModel.findById(req.user?.id).select('-password -__v -role -_id').lean();
	res.json({ data: user });
});
account.delete('/account', verifyToken, permit('admin', 'creator'), async (req: Request, res: Response) => {
	const session = await mongoose.startSession();
	session.startTransaction();
	try {
		if (req.query.id !== req.user?.id) {
			const account = await LoginModel.findByIdAndDelete(req.query.id, { session });
			console.log(account);

			const accountDir = path.join('uploads', 'users', account.username);

			if (fs.existsSync(accountDir)) {
				fs.rm(accountDir, { recursive: true, force: true }, (err) => {
					if (err) throw new Error(err as any);
					else console.log(chalk.greenBright('Yeeted successfully 💨'));
				});
			}

			await session.commitTransaction();
			session.endSession();
			return res.json({ message: 'Successfully deleted account' });
		}

		await session.abortTransaction();
		session.endSession();
		return res.json({ message: 'You can not delete yourself' });
	} catch (err) {
		await session.abortTransaction();
		session.endSession();
		res.status(404).json({ message: 'Error', err });
	}
});
account.put(
	'/account',
	verifyToken,
	upload.fields([
		{ name: 'avatar', maxCount: 1 },
		{ name: 'banner', maxCount: 1 },
	]),
	sortFiles,
	async (req: Request, res: Response) => {
		const props = req.body;
		const avatar = req.uploads?.avatar;
		const banner = req.uploads?.banner;
		const newDir = path.join('uploads', 'users', props.username);
		const newBanner = banner && path.join(newDir, 'banner.png');
		const newAvatar = avatar && path.join(newDir, 'avatar.png');
		console.log('ffffff');

		fs.mkdirSync(newDir, { recursive: true });

		if (newBanner) {
			await sharp(banner)
				.resize({ width: 854, height: 480, fit: 'cover', position: 'center' })
				.toFormat('png', { compression: 'hevc', compressionLevel: 5, quality: 85, alphaQuality: 80, preset: 'drawing' })
				.toFile(newBanner)
				.then(() => fs.unlinkSync(banner));
		}
		if (newAvatar) {
			await sharp(avatar)
				.resize({ width: 480, height: 480, fit: 'cover', position: 'center' })
				.toFormat('png', { compression: 'hevc', compressionLevel: 5, quality: 85, alphaQuality: 80, preset: 'drawing' })
				.toFile(newAvatar)
				.then(() => fs.unlinkSync(avatar));
		}
		const id = req.query.id ?? req.user?.id;

		const user = await LoginModel.findByIdAndUpdate(id, { avatar: newAvatar, banner: newBanner, ...props }, { new: true })
			.select('-password -__v')
			.lean();

		res.json({ data: user });
		if (!user) return res.status(404).json({ message: 'User Not Found' });
	},
);
export default account;
