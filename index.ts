import cookieParser from 'cookie-parser';
import { Request, Response } from 'express';
import path from 'path';
import cors from 'cors';
import chalk from 'chalk';
import mongoose from 'mongoose';
import methodOverride from 'method-override';
import express from 'express';
import { create } from 'express-handlebars';
import dotenv from 'dotenv';
import anime from './src/routes/anime';
import auth from './src/routes/auth';
import collections from './src/routes/collections';
import formatDate from './src/utils/formatDate';
dotenv.config();

const app = express();
const hbs = create({
	compilerOptions: { noEscape: true },
	helpers: {
		eq: (a: any, b: any) => a == b,
		neq: (a: any, b: any) => a !== b,
		json: (context: any) => JSON.stringify(context, null, 2),
		date: (context: Date) => formatDate(context),
	},
});

const PORT = Number(process.env.PORT) ?? 3000;
const MONGO_URL = process.env.MONGO_URL ?? '';

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.use(cookieParser());

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.set('views', './views');

app.get('/', (req: Request, res: Response) => res.render('index'));

app.use('/', auth);
app.use('/collection/', collections);
app.use('/api/anime/', anime);
app.use(
	'/uploads',
	express.static('uploads', {
		setHeaders: (res: Response, path: any) => {
			if (path.endsWith('.vtt')) res.setHeader('Content-Type', 'text/vtt');
		},
	})
);
app.use(express.static(path.join(process.cwd(), 'public')));
mongoose
	.connect(MONGO_URL)
	.then(() => {
		console.clear();
		console.log(chalk.blue('Databazaga Ulandi'));
		app.listen(PORT, '0.0.0.0', (e: any) => {
			console.log(chalk.greenBright('Server ishladi ') + chalk.hex('#00d9ff')(`http://localhost:${PORT}`));
			console.log(chalk.bold(chalk.green('Hammasi Joyida!')));
		});
	})
	.catch((err: any) => {
		console.clear();
		console.log(chalk.yellow('IDIOT!: ') + chalk.red(err));
	});
