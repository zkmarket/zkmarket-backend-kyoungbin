import _ from 'lodash'
import { deploy, ganacheDeploy } from "./deploy";
import tradeContract from "./contract";
import Config from "../config";
import wallet from "../wallet";
import Ganache from "./ganahce";
import { hexToInt,addPrefixHex } from "../utils/types";
import contractKeys from '../contractKeys';
import UserKey from '../wallet/keyStruct';

// const contractAddress = await ganacheDeploy();
// console.log(contractAddress)
// const trade = new tradeContract(Config.testProvider, contractAddress);
const trade = new tradeContract(Config.testProvider, contractKeys.CONTRACT_ADDRESS);


// console.log("register auditor : \t\t\t", 
//     _.get(
//         await trade.azerothRegisterAuditor(wallet.auditorKey.pk.pkEnc)
//         , 'status'
//     )
// )

// console.log("register azeroth delegate Server : \t", 
//     _.get(
//         await trade.azerothRegisterUser(
//             wallet.delegateServerKey.pk.ena,
//             wallet.pkOwn,
//             wallet.pkEnc,
//             Ganache.getAddress(Config.DELEGATE_SERVER_IDX),
//             Ganache.getPrivateKey(Config.DELEGATE_SERVER_IDX)
//         ),
//         'status'
//     )
// )

// export const writerKeys = UserKey.keyGen();
// console.log("register azeroth TEST writer : \t\t", 
//     _.get(
//         await trade.azerothRegisterUser(
//             writerKeys.pk.ena,
//             writerKeys.pk.pkOwn,
//             writerKeys.pk.pkEnc,
//             Ganache.getAddress(Config.WRITER_IDX),
//             Ganache.getPrivateKey(Config.WRITER_IDX)
//         ),
//         'status'
//     )
// )

// console.log("register zkMarket delegate Server : \t", 
//         _.get(
//             await trade.zkMarketRegisterUser(
//                 wallet.delegateServerKey.pk.ena,
//                 wallet.pkOwn,
//                 wallet.pkEnc,
//                 Ganache.getAddress(Config.DELEGATE_SERVER_IDX),
//                 Ganache.getPrivateKey(Config.DELEGATE_SERVER_IDX)
//             ),
//             'status'
//         )
// )

// console.log("register zkMarket TEST writer : \t", 
//         _.get(
//             await trade.zkMarketRegisterUser(
//                 writerKeys.pk.ena,
//                 writerKeys.pk.pkOwn,
//                 writerKeys.pk.pkEnc,
//                 Ganache.getAddress(Config.WRITER_IDX),
//                 Ganache.getPrivateKey(Config.WRITER_IDX)
//             ),
//             'status'
//         )
// )

export const writerKeys = new UserKey(
    UserKey.recoverFromUserSk(contractKeys.WRITER_SK),
    contractKeys.WRITER_SK
);

export default {
    tradeContract : trade
}
