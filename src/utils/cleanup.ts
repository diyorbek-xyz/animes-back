import chalk from 'chalk';
import HttpError from './error';
import fs from 'fs';

export async function CleanAfterError({ req, res, session, error, file, file_type = 'file' }: { req: any; res: any; error: any; session?: any; file?: any; file_type?: 'dir' | 'file' }) {
	if (fs.existsSync(file)) {
		if (file_type == 'dir') {
			await fs.rm(file, { recursive: true, force: true }, (err) => {
				if (err) console.log(err);
				else console.log(chalk.greenBright('Yeeted successfully 💨'));
			});
		}
		if (file_type == 'file') {
			fs.unlinkSync(file);
		}
	}
	if (session) {
		await session.abortTransaction();
		session.endSession();
	}
	if (error instanceof HttpError) {
		console.error(chalk.red(error.message));
		res.json({ error: error.message }).status(error.status);
	} else {
		console.error(chalk.red(error));
		res.json({ error }).status(500);
	}
}
