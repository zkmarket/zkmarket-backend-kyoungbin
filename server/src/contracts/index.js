import _ from 'lodash'
import { deploy, ganacheDeploy } from "./deploy";
import tradeContract from "./contract";
import Config from "../config";
import wallet from "../wallet";
import Ganache from "./ganahce";
import { hexToInt,addPrefixHex } from "../utils/types";

const contractAddress = await ganacheDeploy();
console.log(contractAddress)
const trade = new tradeContract(Config.testProvider, contractAddress);

console.log("register auditor : ", 
    _.get(
        await trade.azerothRegisterAuditor(wallet.auditorKey.pk.pkEnc)
        , 'status'
        )
)

console.log("register azeroth delegate Server : ", 
    _.get(
        await trade.azerothRegisterUser(
            wallet.delegateServerKey.pk.ena,
            wallet.pkOwn,
            wallet.pkEnc,
            Ganache.getAddress(Config.DELEGATE_SERVER_IDX),
            Ganache.getPrivateKey(Config.DELEGATE_SERVER_IDX)
        ),
        'status'
    )
)

console.log("register zkMarket delegate Server : ", 
        _.get(
            await trade.zkMarketRegisterUser(
                wallet.delegateServerKey.pk.ena,
                wallet.pkOwn,
                wallet.pkEnc,
                Ganache.getAddress(Config.DELEGATE_SERVER_IDX),
                Ganache.getPrivateKey(Config.DELEGATE_SERVER_IDX)
            ),
            'status'
        )
)

export default {
    tradeContract : trade
}
