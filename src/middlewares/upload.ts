import { Request } from 'express';
import multer from 'multer';
import path from 'path';


const storage = multer.diskStorage({
	destination: 'uploads/',
	filename: (req: Request, file: any, cb: any) => cb(null, crypto.randomUUID() + path.extname(file.originalname)),
});

const upload = multer({ storage });

export default upload;
