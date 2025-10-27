require('dotenv').config();
const { default: chalk } = require('chalk');
const { default: mongoose } = require('mongoose');
const { engine, create } = require('express-handlebars');
const methodOverride = require('method-override');

const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();
const hbs = create({
	compilerOptions: { noEscape: true },
	helpers: {
		eq: (a, b) => a == b,
		neq: (a, b) => a !== b,
		json: (context) => JSON.stringify(context, null, 2),
	},
});

const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URL;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(methodOverride('_method'));

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.set('views', './views');

app.get('/', (req, res) => res.render('index'));

app.use('/', require('./src/routes/login'));
app.use('/api/animes', require('./src/routes/anime'));
app.use(
	'/uploads',
	express.static('uploads', {
		setHeaders: (res, path) => {
			if (path.endsWith('.vtt')) res.setHeader('Content-Type', 'text/vtt');
		},
	}),
);
app.use(express.static(path.join(process.cwd(), 'public')));
mongoose
	.connect(MONGO_URL)
	.then(() => {
		console.clear();
		console.log(chalk.blue('Databazaga Ulandi'));
		app.listen(PORT, '0.0.0.0', (e) => {
			console.log(chalk.greenBright('Server ishladi ') + chalk.hex('#00d9ff')(`http://localhost:${PORT}`));
			console.log(chalk.bold(chalk.green('Hammasi Joyida!')));
		});
	})
	.catch((err) => {
		console.clear();
		console.log(chalk.yellow('IDIOT!: ') + chalk.red(err));
	});
