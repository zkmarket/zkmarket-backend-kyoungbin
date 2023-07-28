import express from 'express';
import { getContentListController, getImgController } from '../controllers/contentRouterController';


const contentRouter = express.Router();

// contentRouter.post('/publish',)

contentRouter.get('/list', getContentListController)

contentRouter.get('/img/:imgName', getImgController)

export default contentRouter;