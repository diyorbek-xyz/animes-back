import { NextFunction, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import chalk from 'chalk';

async function addPoster(req: Request, res: Response, next: NextFunction) {
	try {
		console.log(chalk.blue('Poster adding...'));
		const poster = req.uploads?.poster;
		if (!poster) return next();

		const newDir = path.join('uploads', 'animes', req.body.name ?? req.body.anime ?? '', req.body.season?.toString() ?? '');
		const newPoster = path.join(newDir, 'poster.png');
		fs.mkdirSync(newDir, { recursive: true });

		const metadata = `<x:xmpmeta xmlns:x="adobe:ns:meta/">
							<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
								<rdf:Description xmlns:dc="http://purl.org/dc/elements/1.1/">
									<dc:anime>${req.body.name ?? req.body.anime}</dc:anime>
									<dc:creator>Diyorbek</dc:creator>
									<dc:telegram>@diyorbek-xyz</dc:telegram>
									<dc:website>https://amediatv.uz</dc:website>
								</rdf:Description>
							</rdf:RDF>
						</x:xmpmeta>`;

		console.info(chalk.blue('Starting poster compression!'));

		await sharp(poster)
			.resize({
				width: 854,
				height: 480,
				fit: 'cover',
				position: 'center',
			})
			.withXmp(metadata)
			.toFormat('png', { compression: 'hevc', compressionLevel: 5, quality: 85, alphaQuality: 80, preset: 'drawing' })
			.toFile(newPoster)
			.then(() => console.info(chalk.yellow('Poster compression completed!')));

		fs.unlinkSync(poster);

		req.data = { poster: newPoster };
		next();
	} catch (err) {
		res.send(err);
		console.log(err);

		if (req.uploads?.poster) {
			fs.unlinkSync(req.uploads?.poster);
		}
	}
}
export default addPoster;
