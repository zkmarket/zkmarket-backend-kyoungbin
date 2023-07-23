/**
 * TEST scenario of data trade 
 * 
 * 1. deploy contract 되어있다고 치고...
 * 2. register delegate server to Contract (azeroth, zkmarket)
 * 3. register Writer to Contract (azeroth, zkmarket)
 * 4. register Reader to Contract (azeroth, zkmarket)
 * 5. Reader zktransfer to he's own ENA (setENA to test)
 * 6. register Data from Writer
 * 7. Reader genTrade 
 * 8. server AcceptTrade
 * 9. Reader get Data
 */

import fs from 'fs'
import _ from 'lodash'
import Web3 from 'web3'
import path from 'path'
import Config from '../config'
import tradeContract from "../contracts/contract"
import Ganache from '../contracts/ganahce'
import sendTransaction from './sendTransaction'
import UserKey from '../wallet/keyStruct'
import types, { addPrefixAndPadHex, addPrefixHex, decStrToHex } from '../utils/types'
import Encryption from '../crypto/encryption'
import snarks from '../snarks'
import { getContractFormatProof, getContractFormatVk } from '../contracts/utils'
import math from '../utils/math'
import mimc from '../crypto/mimc'
import mtree from '../contracts/mtree'
import { decArrToHexArr } from './zkTransfer'

const ZERO_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000'
const auditorKey = UserKey.keyGen(); const auditorIdx = 3;

console.log(' =================== DEPLOY CONTRACT ===================')

const web3 = new Web3(Config.testProvider)
const mimc7 = new mimc.MiMC7();

const testParameter = JSON.parse(
    fs.readFileSync(
        path.join(Config.homePath, 'src/test/testParameter.json'),
        'utf-8'
    )
)
const abi = JSON.parse(
    fs.readFileSync(
        path.join(Config.homePath, 'src/test/DataTradeContract/abi.json'),
        'utf-8'
    )
)
const bytecode = fs.readFileSync(
    path.join(Config.homePath, 'src/test/DataTradeContract/bytecode'), 
    'utf-8'
)

const args = [
    testParameter.vk_registData,
    testParameter.vk_genTrade,
    testParameter.vk_acceptTrade,
    32, 
    getContractFormatVk('ZKlay'), 
    // testParameter.vk,
    testParameter.vk_nft, 
    web3.utils.toHex((0.00 * web3.utils.unitMap.ether)), 
    Ganache.getAddress(4)
];

const deployCall = new web3.eth.Contract(abi).deploy({
    data: bytecode,
    arguments: args,
});
let receipt = await sendTransaction(
    web3, deployCall, '10000000' , 
    Ganache.getAddress(auditorIdx), 
    Ganache.getPrivateKey(auditorIdx)
);

console.log('deploy contract : ', receipt.status)

const contractAddress = receipt.contractAddress;

const contracts =  new tradeContract(Config.testProvider, contractAddress)



console.log('\n =================== REGISTER AUDITOR ===================')

receipt = await sendTransaction(
    web3,
    contracts.instance.methods.registerAuditor(
        [
            '0x' + auditorKey.pk.pkEnc.x.toString(16),
            '0x' + auditorKey.pk.pkEnc.y.toString(16)
        ]
    ),
    '10000000',
    Ganache.getAddress(auditorIdx),
    Ganache.getPrivateKey(auditorIdx)
)
console.log("register auditor : ", receipt.status)

console.log( '\n =================== REGISTER ENTITYS IN AZEROTH CONTRACT ===================' )

const delegateServerKey = UserKey.keyGen(); const delegateServerIdx = 0;
const writerKey = UserKey.keyGen();         const writerIdx = 1;
const readerKey = UserKey.keyGen();         const readerIdx = 2;

const azerothRegisterUser = async (addr, pkOwn, pkEnc, idx) => {
    const receipt = await sendTransaction(
        web3,
        contracts.instance.methods.registerUser(
            addPrefixHex(addr), 
            addPrefixHex(pkOwn), 
            [
                '0x' + pkEnc.x.toString(16), 
                '0x' + pkEnc.y.toString(16)
            ]
        ),
        '10000000',
        Ganache.getAddress(idx),
        Ganache.getPrivateKey(idx)
    )
    return receipt
}

console.log("register delegate server in Azeroth : ", (await azerothRegisterUser(delegateServerKey.pk.ena, delegateServerKey.pk.pkOwn, delegateServerKey.pk.pkEnc, delegateServerIdx)).status)
console.log("register writer in Azeroth : ", (await azerothRegisterUser(writerKey.pk.ena, writerKey.pk.pkOwn, writerKey.pk.pkEnc, writerIdx)).status)
console.log("register reader in Azeroth : ", (await azerothRegisterUser(readerKey.pk.ena, readerKey.pk.pkOwn, readerKey.pk.pkEnc, readerIdx)).status)




console.log( '\n =================== REGISTER ENTITYS IN ZKMARKET CONTRACT ===================' )

const zkMarketRegisterUser = async (pkOwn, pkEnc, eoa) => {
    const receipt = await sendTransaction(
        web3,
        contracts.instance.methods.registUserByDelegator(
            addPrefixHex(pkOwn),
            addPrefixHex(pkEnc.x.toString(16)),
            eoa
        ),
        '10000000',
        Ganache.getAddress(0),
        Ganache.getPrivateKey(0)
    )
    return receipt
}

console.log("register delegate server in ZKMarket : ", (await zkMarketRegisterUser(delegateServerKey.pk.pkOwn, delegateServerKey.pk.pkEnc, Ganache.getAddress(delegateServerIdx))).status)
console.log("register writer in ZKMarket : ", (await zkMarketRegisterUser(writerKey.pk.pkOwn, writerKey.pk.pkEnc, Ganache.getAddress(writerIdx))).status)
console.log("register reader in ZKMarket : ", (await zkMarketRegisterUser(readerKey.pk.pkOwn, readerKey.pk.pkEnc, Ganache.getAddress(readerIdx))).status)


console.log("writer's ENA : ", (await contracts.instance.methods.getCiphertext(ZERO_TOKEN_ADDRESS, addPrefixHex(writerKey.pk.ena)).call()))

console.log('\n =================== SET USER ENA VALUE ===================')

console.log('before Reader Balance : ', await web3.eth.getBalance(Ganache.getAddress(readerIdx)))

const ENAbalance = '0x' + BigInt('100000000000').toString(16)

const ReaderEnaEnc = new Encryption.symmetricKeyEncryption(readerKey.sk)
const ENA = ReaderEnaEnc.Enc(ENAbalance)
const ENA_= ReaderEnaEnc.Enc('0x00')
// console.log("Reader's ENA : ", ENA, addPrefixHex(ReaderEnaEnc.Dec(ENA)) )

receipt = await sendTransaction(
    web3,
    new web3.eth.Contract(abi, contractAddress).methods.setENA(
        ZERO_TOKEN_ADDRESS,
        addPrefixAndPadHex(readerKey.pk.ena),
        addPrefixAndPadHex(ENA.r),
        addPrefixAndPadHex(ENA.ct),
    ),
    '100000000',
    Ganache.getAddress(readerIdx),
    Ganache.getPrivateKey(readerIdx),
    ENAbalance
)

console.log('after Reader Balance : ', await web3.eth.getBalance(Ganache.getAddress(readerIdx)))
console.log("writer's ENA : ", (await contracts.instance.methods.getCiphertext(ZERO_TOKEN_ADDRESS, addPrefixHex(readerKey.pk.ena)).call()))


console.log('\n =================== REGISTER DATA =================== ')

const registDataSnarkInputs = new snarks.registDataInput();

registDataSnarkInputs.uploadDataFromFilePath("./src/test/test.txt");

registDataSnarkInputs.uploadAddrPeer(writerKey.pk.ena);

registDataSnarkInputs.encryptData();

registDataSnarkInputs.makeSnarkInput();

// await snarks.registDataProver.uploadInputAndRunProof(registDataSnarkInputs.toSnarkInputFormat(), '_' + registDataSnarkInputs.gethCt());

// receipt = await contracts.registData(
//     getContractFormatProof(registDataSnarkInputs.gethCt(), snarks.registDataProver.CircuitType),
//     registDataSnarkInputs.toSnarkVerifyFormat(),
//     Ganache.getAddress(writerIdx),
//     Ganache.getPrivateKey(writerIdx)
// )

// console.log("register data : ", receipt.status)




console.log('\n =================== GEN TRADE =================== ')

const genTradeSnarkInputs = new snarks.genTradeInput(
    writerKey.pk.pkEnc.x.toString(16),
    writerKey.pk.ena,
    readerKey.pk.pkEnc.x.toString(16),
    delegateServerKey.pk.ena,
    ENA,
    ENA_,
    readerKey.sk,
    registDataSnarkInputs.gethK(),
    BigInt('90000000000').toString(16),
    BigInt('10000000000').toString(16)
)

snarks.genTradeProver.uploadInputAndRunProof(genTradeSnarkInputs.toSnarkInputFormat(), '_' + genTradeSnarkInputs.gethk());

receipt = await sendTransaction(
    web3,
    contracts.instance.methods.orderData(
        getContractFormatProof(genTradeSnarkInputs.gethk(), snarks.genTradeProver.CircuitType),
        genTradeSnarkInputs.toSnarkVerifyFormat(),
        ZERO_TOKEN_ADDRESS
    ),
    '100000000',
    Ganache.getAddress(readerIdx),
    Ganache.getPrivateKey(readerIdx)
)
console.log("reader gen trade : ", receipt.status, "contract Balance : ", await web3.eth.getBalance(contractAddress))


const parseTxLog = (receipt) => {
    let tmp = []
    let logs = _.get(receipt, 'logs') ?? receipt
    console.log(logs[0].data)
    for(let i=0; i<logs.length; i++){
        tmp.push(parseData(logs[i].data))
    }
    return tmp
}

const parseData = (data) => {
    let tmp = []
    for(let i=0; i<Number.parseInt(data.length/64); i++){
        tmp.push(data.slice(2+64*i, 2+64*(i+1)))
    }
    return tmp
}

const getEoaAddrFromReceipt = (receipt) => {
    try {
        const logs = parseTxLog(receipt)[0][0];
        for(let i=0; i<logs.length; i++){
            if(logs[i] != '0'){
                return logs.slice(i);
            }
        }
        return logs;
    } catch (error) {
        console.log(error)
        return undefined
    }
}

await web3.eth.getTransactionReceipt(_.get(receipt, 'transactionHash'), (err, txReceipt) => {
    if(err){
        console.log(err);
        process.exit(1);
    }

    const logs = parseTxLog(txReceipt)[0]
    console.log('logs : ', logs[0].slice(24))
    try {
        const penc = new Encryption.publicKeyEncryption()
        const [pk_enc_cons, r_cm, fee_peer, fee_del, h_k] = penc.Dec(
            new Encryption.pCT(
                logs[1],
                logs[2],
                logs.slice(3)
            ),
            writerKey.sk
        )
        console.log('msg : ', pk_enc_cons, r_cm, fee_peer, fee_del, h_k)
        console.log("addr : ", getEoaAddrFromReceipt(receipt))
    } catch (error) {
        console.log(error)
    }
})

console.log(
    [
        genTradeSnarkInputs.pk_enc_cons,
        genTradeSnarkInputs.r_cm,
        genTradeSnarkInputs.fee_peer,
        genTradeSnarkInputs.fee_del,
        genTradeSnarkInputs.h_k
    ]
)
process.exit(0)

console.log('\n =================== ACCEPT TRADE =================== ')

const r_cm = genTradeSnarkInputs.r_cm;
const acceptTradeSnarkInputs = new snarks.acceptTradeInput(
    delegateServerKey.pk.ena,
    writerKey.pk.ena,
    readerKey.pk.pkEnc.x.toString(16),
    registDataSnarkInputs.getEncKey(),
    r_cm,
    BigInt('90000000000').toString(16),
    BigInt('10000000000').toString(16)
)

snarks.acceptTradeProver.uploadInputAndRunProof(acceptTradeSnarkInputs.toSnarkInputFormat(), '_' + acceptTradeSnarkInputs.gethk());

console.log('accepTrade Inputs : ', acceptTradeSnarkInputs.toSnarkVerifyFormat())
console.log('gas : ',
    await contracts.instance.methods.acceptOrder(
        getContractFormatProof(acceptTradeSnarkInputs.gethk(), snarks.acceptTradeProver.CircuitType),
        acceptTradeSnarkInputs.toSnarkVerifyFormat()
    ).estimateGas()
)

receipt = await sendTransaction(
    web3,
    contracts.instance.methods.acceptOrder(
        getContractFormatProof(acceptTradeSnarkInputs.gethk(), snarks.acceptTradeProver.CircuitType),
        acceptTradeSnarkInputs.toSnarkVerifyFormat()
    ),
    '100000000',
    Ganache.getAddress(delegateServerIdx),
    Ganache.getPrivateKey(delegateServerIdx)
)
console.log(receipt)



console.log("=================== SERVER ZKTRANSFER TO OWN ACCOUNT ===================")
console.log(" DELEGATE SERVER TRANSFER CM TO OWN ENA ")

let cmDelIdx = 0
let oldCmBal = BigInt('10000000000').toString(16)

let penc = new Encryption.publicKeyEncryption()
let senc = new Encryption.symmetricKeyEncryption(delegateServerKey.sk)
let ENAServerNew = senc.Enc(oldCmBal)

let newOpen = math.randomFieldElement().toString(16)
let [newpCT, newR, newK] = penc.AzerothEnc(
    auditorKey.pk.pkEnc,
    delegateServerKey.pk,
    ...[newOpen, '00', delegateServerKey.pk.ena],
)
let sn = mimc7.hash(
    acceptTradeSnarkInputs.cm_del_azeroth, 
    delegateServerKey.sk
);


let zklayKey = {
    auditor : {
        pk : auditorKey.pk.pkEnc,
    },
    sender : {
        pk : delegateServerKey.pk,
        sk : delegateServerKey.sk,
    },
    receiver : {
        pk : delegateServerKey.pk,
    }
}

let ciphertexts = {
    oldsCT: {
        r : "0",
        ct: "0"
    },
    newsCT: ENAServerNew,
    newpCT: newpCT,
}

let opens = {
    oldOpen: acceptTradeSnarkInputs.o_del,
    newOpen: newOpen,
};

let balance = {
    pocket: {
        privBal  : '00',
        pubInBal : '00',
        pubOutBal: '00',
    },
    oldCmBal: oldCmBal,
};

let aux = {
    newR: newR,
    newK: newK,
};

let commitments = {
    oldCm: acceptTradeSnarkInputs.cm_del_azeroth,
    newCm: mimc7.hash(newOpen, '00', delegateServerKey.pk.ena),
};

let oldRt = decStrToHex(await contracts.contractMethod.getRootTop().call());
let intermediateHashes = await contracts.instance.methods.getMerklePath(cmDelIdx.toString()).call();

let mtData = mtree(oldRt, decArrToHexArr(intermediateHashes), cmDelIdx);
console.log("mtData : ", mtData)

let tmp = acceptTradeSnarkInputs.cm_del_azeroth
for(let i=0 ;i<32 ;i++){
    tmp = mimc7.hash(tmp, intermediateHashes[i])
}

console.log('calc root : ', tmp, )
console.log("cm_azeroth_del : ", acceptTradeSnarkInputs.cm_del_azeroth)
console.log('cm_azeroth_peer:  ', acceptTradeSnarkInputs.cm_peer_azeroth, '\n', mimc7.hash( acceptTradeSnarkInputs.cm_peer_azeroth), '\n\n\n')

let zkTransferInput = new snarks.zkTransferInput(
    zklayKey,
    ciphertexts,
    mtData,
    sn,
    commitments,
    opens,
    balance,
    aux,
)

console.log(zkTransferInput.toSnarkInputFormat())

snarks.zkTransferProver.uploadInputAndRunProof(zkTransferInput.toSnarkInputFormat(), '_' + zkTransferInput.commitments.oldCm);

let zklayContractInput = zkTransferInput.toSnarkVerifyFormat(
    Ganache.getAddress(delegateServerIdx),
    ZERO_TOKEN_ADDRESS
)
// console.log([1,2].length)
console.log(zklayContractInput, zklayContractInput[1].length, testParameter.vk.length)
console.log(...zklayContractInput)
receipt = await sendTransaction(
    web3,
    contracts.instance.methods.zkTransfer(
        ... zklayContractInput
    ),
    '100000000',
    Ganache.getAddress(delegateServerIdx),
    Ganache.getPrivateKey(delegateServerIdx)
)



console.log('\n =================== WRITER ZKTRANSFER TEST =================== ')
console.log(' WRITER SEND CM TO OWN EOA ')

cmDelIdx = 1
oldCmBal = BigInt('90000000000').toString(16)

senc = new Encryption.symmetricKeyEncryption(writerKey.sk)
let ENAWriterNew = senc.Enc('0x00')

newOpen = math.randomFieldElement().toString(16)
const [newpCT_, newR_, newK_] = penc.AzerothEnc(
    auditorKey.pk.pkEnc,
    writerKey.pk,
    ...[newOpen, '00', writerKey.pk.ena],
)

newpCT = newpCT_
newR   = newR_
newK   = newK_

sn = mimc7.hash(
    acceptTradeSnarkInputs.cm_peer_azeroth,
    writerKey.sk
)

zklayKey = {
    auditor : {
        pk : auditorKey.pk.pkEnc,
    },
    sender : {
        pk : writerKey.pk,
        sk : writerKey.sk,
    },
    receiver : {
        pk : writerKey.pk,
    }
}

ciphertexts = {
    oldsCT: {
        r : "0",
        ct: "0"
    },
    newsCT : ENAWriterNew,
    newpCT: newpCT,
}

opens = {
    oldOpen: acceptTradeSnarkInputs.o_peer,
    newOpen: newOpen,
}


balance = {
    pocket : {
        privBal  : '00',
        pubInBal : '00',
        pubOutBal: oldCmBal,
    },
    oldCmBal : oldCmBal,
}

aux = {
    newR: newR,
    newK: newK,
}

commitments = {
    oldCm : acceptTradeSnarkInputs.cm_peer_azeroth,
    newCm : mimc7.hash(newOpen, '00', writerKey.pk.ena),
}

oldRt = decStrToHex(await contracts.contractMethod.getRootTop().call());
intermediateHashes = await contracts.instance.methods.getMerklePath(cmDelIdx.toString()).call();

mtData = mtree(oldRt, decArrToHexArr(intermediateHashes), cmDelIdx);

zkTransferInput = new snarks.zkTransferInput(
    zklayKey,
    ciphertexts,
    mtData,
    sn,
    commitments,
    opens,
    balance,
    aux,
)

snarks.zkTransferProver.uploadInputAndRunProof(
    zkTransferInput.toSnarkInputFormat(), 
    '_' + zkTransferInput.commitments.oldCm
)

zklayContractInput = zkTransferInput.toSnarkVerifyFormat(
    Ganache.getAddress(writerIdx),
    ZERO_TOKEN_ADDRESS
)

console.log("before balance : ", await web3.eth.getBalance(Ganache.getAddress(writerIdx)))

receipt = await sendTransaction(
    web3,
    contracts.instance.methods.zkTransfer(
        ... zklayContractInput
    ),
    '900000000',
    Ganache.getAddress(writerIdx),
    Ganache.getPrivateKey(writerIdx)
)

console.log("after balance : ", await web3.eth.getBalance(Ganache.getAddress(writerIdx)))