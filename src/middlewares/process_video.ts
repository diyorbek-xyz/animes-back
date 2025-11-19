import { NextFunction, Request, Response } from 'express';
import { NewEpisode } from '../types';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import processPreviews from './process_thumbs';
import { AnimeModel, SeasonModel } from '../models/anime';

function ensureDir(dir: string) {
	if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function processVideo(req: Request, res: Response, next: NextFunction) {
	try {
		if (!req.paths) return;
		const inputPath = req.paths.input;
		const outputDir = req.paths.output;

		console.log(chalk.blue('Starting process video...'));
		ensureDir(outputDir);
		ensureDir(path.join(outputDir, 'datas'));

		const hasAudio = await new Promise((resolve) => {
			ffmpeg.ffprobe(inputPath, (err, data) => {
				const audio = data.streams.some((s) => s.codec_type === 'audio');
				resolve(audio);
			});
		});
		const varStreamMap = hasAudio ? 'v:0,a:0 v:1,a:1 v:2,a:2' : 'v:0 v:1 v:2';

		await new Promise((resolve, reject) => {
			ffmpeg(inputPath)
				.outputOptions([
					'-filter_complex',
					'[0:v]split=3[v360][v720][v1080];' + '[v360]scale=-2:360[v360out];' + '[v720]scale=-2:720[v720out];' + '[v1080]scale=-2:1080[v1080out]',

					'-map [v360out]',
					'-map 0:a?',
					'-c:v:0 libx264',
					'-b:v:0 800k',
					'-c:a:0 aac',
					'-b:a:0 96k',

					'-map [v720out]',
					'-map 0:a?',
					'-c:v:1 libx264',
					'-b:v:1 2500k',
					'-c:a:1 aac',
					'-b:a:1 128k',

					'-map [v1080out]',
					'-map 0:a?',
					'-c:v:2 libx264',
					'-b:v:2 5000k',
					'-c:a:2 aac',
					'-b:a:2 192k',

					'-hls_time 5',
					'-hls_list_size 0',
					'-hls_flags independent_segments',
					'-master_pl_name master.m3u8',
					'-var_stream_map',
					varStreamMap,

					`-hls_segment_filename ${outputDir}/datas/data%v_%02d.bruh`,
					'-hls_base_url datas/',
				])
				.output(`${outputDir}/%v.m3u8`)
				.on('start', () => console.log('Making video resolutions...'))
				.on('progress', (progress) => progress.percent && console.log(chalk.green('Processing: ' + progress.percent?.toFixed(2) + '% done')))
				.on('error', (err) => (console.error(chalk.red('FFmpeg Error: ' + err.message)), res.status(500).json({ error: 'FFmpeg Error: ' + err.message }), reject(err)))
				.on('end', () => (console.log(chalk.yellow('Making video resolutions finished.')), resolve(`${outputDir}/master.m3u8`)))
				.run();
		});

		await processPreviews(inputPath, outputDir);
		if (fs.existsSync(inputPath) && req.paths?.download) {
			fs.renameSync(inputPath, req.paths.download);
		}
		console.log(chalk.green('Process video ended'));
		return;
	} catch (err) {
		if (req.paths?.output && fs.existsSync(req.paths.output)) {
			await fs.rm(req.paths.output, { recursive: true, force: true }, (err) => {
				if (err) console.log(err);
				else console.log(chalk.greenBright('Yeeted successfully 💨'));
			});
		}
		if (req.paths?.input && fs.existsSync(req.paths.input)) {
			await fs.rm(req.paths.input, { recursive: true, force: true }, (err) => {
				if (err) console.log(err);
				else console.log(chalk.greenBright('Yeeted successfully 💨'));
			});
		}
		console.error(err);
		res.json(err);
	}
}
export default processVideo;
