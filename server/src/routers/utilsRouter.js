import express from 'express';

import { getContractAddressController, getExampleGenTradeParamsController, getNotesController } from '../controllers/utilsController';

const utilsRouter = express.Router();

utilsRouter.get('/contractAddress', getContractAddressController);

utilsRouter.get('/exampleGenTradeParams', getExampleGenTradeParamsController);

utilsRouter.get('/getNotes/:sk_enc', getNotesController);

export default utilsRouter;
