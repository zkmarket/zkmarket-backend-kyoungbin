import express from 'express';

import { getContractAddressController } from '../controllers/utilsController';

const utilsRouter = express.Router();

utilsRouter.get('/contractAddress', getContractAddressController);

export default utilsRouter;
