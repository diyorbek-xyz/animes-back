import { NextFunction, Request, Response } from 'express';

export default async function sortFiles(req: Request, res: Response, next: NextFunction) {
	let poster;
	let video;
	let avatar;
	let banner;
	if (req.files?.poster?.[0]) {
		poster = req.files?.poster?.[0].path;
	}
	if (req.files?.avatar?.[0]) {
		avatar = req.files?.avatar?.[0].path;
	}
	if (req.files?.banner?.[0]) {
		banner = req.files?.banner?.[0].path;
	}
	if (req.files?.video?.[0]) {
		video = req.files?.video?.[0].path;
	}
	req.uploads = { poster, avatar, banner, video };
	next();
}
