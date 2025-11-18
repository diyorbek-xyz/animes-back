import chalk from 'chalk';
import HttpError from './error';
import fs from 'fs';

export async function CleanAfterError({ req, res, session, error, file }: { req: any; res: any; error: any; session?: any; file?: any }) {
	if (file) {
		fs.unlinkSync(file);
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
