import chalk from 'chalk';
import Ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';

export async function generateThumbnailsAndVTT(inputVideo: string, outputDir: string) {
	console.info(chalk.blue('Making previews...'));
	const previewsDir = path.join(outputDir, 'previews');
	fs.mkdirSync(previewsDir, { recursive: true });

	return new Promise((resolve, reject) => {
		Ffmpeg(inputVideo)
			.output(path.join(previewsDir, 'thumb-%04d.jpg'))
			.outputOptions(['-vf', 'fps=1/5,scale=-2:120'])
			.output(path.join(outputDir, 'previews.vtt'))
			.outputOptions(['-f', 'webvtt'])
			.on('start', (cmd) => console.log('Running:', cmd))
			.on('end', () => {
				console.info('Making previews finished.');
				resolve(path.join(outputDir, 'previews.vtt'));
			})
			.on('error', (err) => {
				console.error('Error:', err);
				reject(err);
			})
			.run();
	});
}
