import express from 'express';

import { getContractAddressController, getExampleGenTradeParamsController } from '../controllers/utilsController';

const utilsRouter = express.Router();

utilsRouter.get('/contractAddress', getContractAddressController);

utilsRouter.get('/exampleGenTradeParams', getExampleGenTradeParamsController);

export default utilsRouter;
