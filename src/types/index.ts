interface Anime {
	_id?: any;
	name: string;
	poster: string;
	studio: string;
	seasons?: Season[];
	episodes?: Episode[];
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
	anime: any;
	season: any;
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
export type { User, Anime, Episode, Season, Login };
