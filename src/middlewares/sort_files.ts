import { NextFunction } from 'express';
import { AnimeFiles, ProcessFiles } from '../types';

export default async function sortFiles(req: Request & AnimeFiles & ProcessFiles, res: Response, next: NextFunction) {}
