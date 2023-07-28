import express from 'express';

import dataRouter from './dataRouter';
import utilsRouter from './utilsRouter';
import contentRouter from './contentRouter';

const rootRouter = express.Router();

rootRouter.use('/data', dataRouter);

rootRouter.use('/utils', utilsRouter);

rootRouter.use('/content', contentRouter);

export default rootRouter;