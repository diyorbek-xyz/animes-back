/// <reference types="express" />
import type { Request } from 'express';

declare module 'express-serve-static-core' {
	interface Request {
		user?: {
			id: string;
			role: 'user' | 'admin' | 'creator';
		};
		files?: {
			poster?: Express.Multer.File[];
			video?: Express.Multer.File[];
			avatar?: Express.Multer.File[];
			banner?: Express.Multer.File[];
			[key: string]: Express.Multer.File[];
		};
		uploads?: {
			poster?: string;
			video?: string;
			avatar?: string;
			banner?: string;
			[key: string]: any;
		};
		data?: {
			poster?: string;
			video?: string;
			avatar?: string;
			banner?: string;
			[key: string]: any;
		};
		paths?: {
			input: string;
			output: string;
			download: string;
			video: string;
			previews: string;
		};
	}
}
