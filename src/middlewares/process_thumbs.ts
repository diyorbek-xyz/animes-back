import ffmpeg from 'fluent-ffmpeg';
import sharp from 'sharp';
import fs from 'fs-extra';
import path from 'path';

// ------------------- Step 4: Run everything -------------------
export default async function processPreviews(inputVideo: string, outputDir: string) {
	const framesDir = path.join(outputDir, 'frames');
	const spriteWidth = 160;
	const spriteHeight = 90;
	const thumbnailsPerRow = 5;
	const secondsPerThumb = 3;

	fs.ensureDirSync(framesDir);
	fs.ensureDirSync(outputDir);

	// ------------------- Step 1: Extract frames -------------------
	async function extractFrames() {
		return new Promise<void>((resolve, reject) => {
			ffmpeg(inputVideo)
				.output(path.join(framesDir, 'thumb-%04d.jpg'))
				.outputOptions([`-vf fps=1/${secondsPerThumb},scale=${spriteWidth}:${spriteHeight}`])
				.on('end', () => resolve())
				.on('error', reject)
				.run();
		});
	}
	// ------------------- Step 2: Make sprite sheet -------------------
	async function makeSprite() {
		const files = (await fs.readdir(framesDir)).filter((f) => f.endsWith('.jpg')).sort();

		const rows = Math.ceil(files.length / thumbnailsPerRow);
		const sprite = sharp({
			create: {
				width: thumbnailsPerRow * spriteWidth,
				height: rows * spriteHeight,
				channels: 3,
				background: { r: 0, g: 0, b: 0 },
			},
		});

		const composites = files.map((file, i) => {
			const x = (i % thumbnailsPerRow) * spriteWidth;
			const y = Math.floor(i / thumbnailsPerRow) * spriteHeight;
			return { input: path.join(framesDir, file), left: x, top: y };
		});

		await sprite.composite(composites).toFile(path.join(outputDir, 'sprite.jpg'));

		return files.length;
	}
	// ------------------- Step 3: Generate VTT -------------------
	function generateVTT(frameCount: number) {
		let vtt = 'WEBVTT\n\n';
		for (let i = 0; i < frameCount; i++) {
			const startSec = i * secondsPerThumb;
			const endSec = (i + 1) * secondsPerThumb;

			const row = Math.floor(i / thumbnailsPerRow);
			const col = i % thumbnailsPerRow;
			const x = col * spriteWidth;
			const y = row * spriteHeight;

			const startTime = new Date(startSec * 1000).toISOString().substr(11, 12);
			const endTime = new Date(endSec * 1000).toISOString().substr(11, 12);

			vtt += `${startTime} --> ${endTime}\n`;
			vtt += `sprite.jpg#xywh=${x},${y},${spriteWidth},${spriteHeight}\n\n`;
		}

		fs.writeFileSync(path.join(outputDir, 'sprite.vtt'), vtt, 'utf8');
		console.log('✅ Sprite sheet and VTT ready!');
		return path.join(outputDir, 'sprite.vtt');
	}

	console.log('Extracting frames...');
	await extractFrames();

	console.log('Making sprite sheet...');
	const count = await makeSprite();

	console.log('Generating VTT...');
	generateVTT(count);
}
