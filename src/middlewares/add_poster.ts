/** @format */

import { NextFunction, Request, Response } from 'express';
import { AnimeFiles, ProcessFiles } from '../types';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import chalk from 'chalk';

async function addPoster(req: Request & AnimeFiles & ProcessFiles, res: Response, next: NextFunction) {
	try {
		console.log(chalk.blue('Poster adding...'));
		const file = req.files?.poster?.at(0);
		if (!file) return res.status(400).json({ message: 'Poster not found' });

		const newDir = path.join('uploads', 'animes', req.body.name, req.body.season.toString());
		const poster = path.join(newDir, 'poster.png');
		fs.mkdirSync(newDir, { recursive: true });

		const metadata = `<x:xmpmeta xmlns:x="adobe:ns:meta/">
							<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
								<rdf:Description xmlns:dc="http://purl.org/dc/elements/1.1/">
									<dc:anime>${req.body.name}</dc:anime>
									<dc:creator>Diyorbek</dc:creator>
									<dc:telegram>@diyorbek-xyz</dc:telegram>
									<dc:website>https://amediatv.uz</dc:website>
								</rdf:Description>
							</rdf:RDF>
						</x:xmpmeta>`;

		console.info(chalk.blue('Starting poster compression!'));
		await sharp(file.path)
			.resize({
				width: 854,
				height: 480,
				fit: 'cover',
				position: 'center',
			})
			.withXmp(metadata)
			.toFormat('png', { compression: 'hevc', compressionLevel: 5, quality: 85, alphaQuality: 80, preset: 'drawing' })
			.toFile(poster)
			.then(() => console.info(chalk.yellow('Poster compression completed!')));

		fs.unlinkSync(file.path);

		req.data = { poster };
		next();
	} catch (err) {
		res.json(err);

		if (req.files?.poster?.at(0)?.path) {
			fs.unlinkSync(req.files.poster[0].path);
		}
	}
}
export default addPoster;
