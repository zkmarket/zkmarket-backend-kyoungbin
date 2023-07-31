/**
 * 
 * init contract and auditor/delegateServer
 */
import fs from 'fs'
import _ from 'lodash'
import Config from "./config";
import Ganache from './contracts/ganahce';
import UserKey from "./wallet/keyStruct";
import tradeContract from "./contracts/contract";
import { ganacheDeploy } from "./contracts/deploy";

const delegateServerKey = UserKey.keyGen();
const auditorKey = UserKey.keyGen();
const writerKey = UserKey.keyGen();

const contractAddress = await ganacheDeploy()
const trade = new tradeContract(Config.testProvider, contractAddress);

console.log("register auditor : \t\t\t", 
    _.get(
        await trade.azerothRegisterAuditor(auditorKey.pk.pkEnc)
        , 'status'
    )
)

console.log("register azeroth delegate Server : \t", 
    _.get(
        await trade.azerothRegisterUser(
            delegateServerKey.pk.ena,
            delegateServerKey.pk.pkOwn,
            delegateServerKey.pk.pkEnc,
            Ganache.getAddress(Config.DELEGATE_SERVER_IDX),
            Ganache.getPrivateKey(Config.DELEGATE_SERVER_IDX)
        ),
        'status'
    )
)

console.log("register azeroth TEST writer : \t\t", 
    _.get(
        await trade.azerothRegisterUser(
            writerKey.pk.ena,
            writerKey.pk.pkOwn,
            writerKey.pk.pkEnc,
            Ganache.getAddress(Config.WRITER_IDX),
            Ganache.getPrivateKey(Config.WRITER_IDX)
        ),
        'status'
    )
)

console.log("register zkMarket delegate Server : \t", 
        _.get(
            await trade.zkMarketRegisterUser(
                delegateServerKey.pk.ena,
                delegateServerKey.pk.pkOwn,
                delegateServerKey.pk.pkEnc,
                Ganache.getAddress(Config.DELEGATE_SERVER_IDX),
                Ganache.getPrivateKey(Config.DELEGATE_SERVER_IDX)
            ),
            'status'
        )
)

console.log("register zkMarket TEST writer : \t", 
        _.get(
            await trade.zkMarketRegisterUser(
                writerKey.pk.ena,
                writerKey.pk.pkOwn,
                writerKey.pk.pkEnc,
                Ganache.getAddress(Config.WRITER_IDX),
                Ganache.getPrivateKey(Config.WRITER_IDX)
            ),
            'status'
        )
)

const text = `const KEY = {
    CONTRACT_ADDRESS : "${contractAddress}",
    DELEGATE_SERVER_SK : "${delegateServerKey.sk}",
    AUDITOR_SK : "${auditorKey.sk}",
    WRITER_SK : "${writerKey.sk}",
}
export default KEY;`

fs.writeFileSync('./src/contractKeys.js', text, 'utf8')