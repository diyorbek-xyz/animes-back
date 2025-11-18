import { Request, Response } from 'express';

function response({ req, res, render, name, layout = 'main', data = {}, redirect }: { req: Request; res: Response; render?: string; name?: string; layout?: string; data?: any; redirect?: string }) {
	if (req.xhr || req.headers.accept?.includes('application/json')) {
		res.json(data);
	} else if (redirect) {
		res.redirect(redirect);
	} else {
		// @ts-ignore
		res.render(render, { layout, [name]: data, user: req.user });
	}
}

export { response };
