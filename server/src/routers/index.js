import express from 'express';

import dataRouter from './dataRouter';

const rootRouter = express.Router();

rootRouter.use('/data', dataRouter);

export default rootRouter;