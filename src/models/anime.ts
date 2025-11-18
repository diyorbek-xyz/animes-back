import mongoose, { model, models, Schema } from 'mongoose';

const AnimeSchema = new Schema(
	{
		name: { type: String, required: true },
		poster: { type: String, required: true },
		studio: String,
		seasons: [{ type: mongoose.Types.ObjectId, ref: 'season' }],
		episodes: [{ type: mongoose.Types.ObjectId, ref: 'episode' }],
	},
	{ timestamps: true, versionKey: false }
);
const SeasonSchema = new Schema(
	{
		anime: { type: mongoose.Types.ObjectId, ref: 'anime', required: true },
		poster: { type: String, required: true },
		title: { type: String, required: true },
		season: { type: Number, required: true },
		episodes: [{ type: mongoose.Types.ObjectId, ref: 'episode' }],
	},
	{ timestamps: true, versionKey: false }
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
	{ timestamps: true, versionKey: false }
);
const AnimeModel = models.anime || model('anime', AnimeSchema);
const SeasonModel = models.season || model('season', SeasonSchema);
const EpisodeModel = models.episode || model('episode', EpisodeSchema);

export { AnimeModel, SeasonModel, EpisodeModel };
