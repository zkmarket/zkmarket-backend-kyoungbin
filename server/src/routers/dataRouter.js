import express from 'express';

import registDataController from '../controllers/registDataController';
import { uploadController, uploadMiddleware } from '../controllers/imageUplodaController';

const dataRouter = express.Router();

dataRouter.post('/register', uploadMiddleware.single('image'), registDataController)

dataRouter.post('/uploadImg', uploadMiddleware.single('image'), uploadController)

export default dataRouter;