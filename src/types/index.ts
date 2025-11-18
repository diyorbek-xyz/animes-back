interface Anime {
	_id?: any;
	name: string;
	poster: string;
	studio: string;
	seasons?: Season[];
}
interface Season {
	_id?: any;
	title: string;
	season: number;
	episodes?: Episode[];
}

interface Episode {
	_id?: any;
	title: string;
	episode: number;
	video: string;
	previews: string;
	download: string;
}

interface Login {
	first_name: string;
	last_name: string;
	username: string;
	password: string;
	role: string;
	premium: boolean;
	avatar: string;
	banner: string;
}
interface ProcessFiles {
	data?: {
		poster?: string;
		video?: string;
		previews?: string;
		download?: string;
	};
}
interface VerifyToken {
	user?: {
		id: string;
		role: 'user' | 'admin' | 'creator';
	};
}
interface AnimeFiles {
	files?: {
		poster?: Express.Multer.File[];
		video?: Express.Multer.File[];
	};
}
interface AccountFiles {
	files?: {
		avatar?: Express.Multer.File[];
		banner?: Express.Multer.File[];
	};
}
interface User {
	id: string;
	role: 'user' | 'admin' | 'creator';
	username: string;
	first_name: string;
}

interface NewEpisode extends Episode {
	anime: string;
	season: string;
}
export type { NewEpisode };
export type { User, Anime, Episode, AnimeFiles, Season, Login, ProcessFiles, VerifyToken, AccountFiles };
