import mongoose, { CallbackError, model, models, Schema } from 'mongoose';

const AnimeSchema = new Schema(
	{
		name: { type: String, required: true },
		poster: { type: String, required: true },
		studio: String,
		seasons: [{ type: mongoose.Types.ObjectId, ref: 'season' }],
		episodes: [{ type: mongoose.Types.ObjectId, ref: 'episode' }],
		totalSeasons: { type: Number, required: true },
		totalEpisodes: { type: Number, required: true },
	},
	{ timestamps: true, versionKey: false },
);
const SeasonSchema = new Schema(
	{
		anime: { type: mongoose.Types.ObjectId, ref: 'anime', required: true },
		poster: { type: String, required: true },
		title: { type: String, required: true },
		season: { type: Number, required: true },
		episodes: [{ type: mongoose.Types.ObjectId, ref: 'episode' }],
		totalEpisodes: { type: Number },
	},
	{ timestamps: true, versionKey: false },
);
const EpisodeSchema = new Schema(
	{
		anime: { type: mongoose.Types.ObjectId, ref: 'anime', required: true },
		season: { type: mongoose.Types.ObjectId, ref: 'season', required: true },
		title: { type: String, required: true },
		episode: { type: Number, required: true },
		video: { type: String, required: true },
		previews: { type: String, required: true },
		download: { type: String, required: true },
	},
	{ timestamps: true, versionKey: false },
);

SeasonSchema.pre('save', function (next) {
	const doc = this as any;
	if (doc) {
		doc.totalEpisodes = doc.episodes.length ?? 0;
	}
	next();
});
SeasonSchema.post('save', async (doc, next) => {
	console.log('SEASON CHANGE', doc);
	try {
		const anime = await mongoose.model('anime').findByIdAndUpdate(doc.anime, { $addToSet: { seasons: doc._id } });
		for (const episode of doc.episodes) {
			await mongoose.model('episode').findByIdAndUpdate(episode, { $addToSet: { season: doc._id, anime: anime._id } });
		}
		next();
	} catch (err) {
		next(err as CallbackError);
	}
});
AnimeSchema.pre('save', function (next) {
	const doc = this as any;
	if (doc) {
		doc.totalEpisodes = doc.episodes.length ?? 0;
		doc.totalSeasons = doc.seasons.length ?? 0;
	}
	next();
});
AnimeSchema.post('save', async (doc, next) => {
	console.log('ANIME CHANGE', doc);
	try {
		for (const season of doc.seasons) {
			await mongoose.model('season').findByIdAndUpdate(season, { $addToSet: { anime: doc._id } });
		}
		for (const episode of doc.episodes) {
			await mongoose.model('episode').findByIdAndUpdate(episode, { $addToSet: { anime: doc._id } });
		}

		next();
	} catch (err) {
		next(err as CallbackError);
	}
});
EpisodeSchema.post('save', async (doc, next) => {
	console.log('EPISODE CHANGE', doc);
	try {
		await mongoose.model('anime').findByIdAndUpdate(doc.anime, { $addToSet: { episodes: doc._id } });
		await mongoose.model('season').findByIdAndUpdate(doc.season, { $addToSet: { episodes: doc._id } });
		next();
	} catch (err) {
		next(err as CallbackError);
	}
});
const AnimeModel = models.anime || model('anime', AnimeSchema);
const SeasonModel = models.season || model('season', SeasonSchema);
const EpisodeModel = models.episode || model('episode', EpisodeSchema);

export { AnimeModel, SeasonModel, EpisodeModel };
