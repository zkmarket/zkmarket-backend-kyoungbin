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
const bytecode = fs.readFileSync(path.join(Config.homePath, 'src/test/DataTradeContract/bytecode'), 'utf-8')

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
    web3, deployCall, '10000000', 
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

const cmDelIdx = 0
const oldCmBal = BigInt('10000000000').toString(16)

const penc = new Encryption.publicKeyEncryption()
const senc = new Encryption.symmetricKeyEncryption(delegateServerKey.sk)
const ENAServerNew = senc.Enc(oldCmBal)

const newOpen = math.randomFieldElement().toString(16)
const [newpCT, newR, newK] = penc.AzerothEnc(
    auditorKey.pk.pkEnc,
    delegateServerKey.pk,
    ...[newOpen, '00', delegateServerKey.pk.ena],
)
const sn = mimc7.hash(
    acceptTradeSnarkInputs.cm_del_azeroth, 
    delegateServerKey.sk
);


const zklayKey = {
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

const ciphertexts = {
    oldsCT: {
        r : "0",
        ct: "0"
    },
    newsCT: ENAServerNew,
    newpCT: newpCT,
}

const opens = {
    oldOpen: acceptTradeSnarkInputs.o_del,
    newOpen: newOpen,
};

const balance = {
    pocket: {
        privBal  : '00',
        pubInBal : '00',
        pubOutBal: '00',
    },
    oldCmBal: oldCmBal,
};

const aux = {
    newR: newR,
    newK: newK,
};

const commitments = {
    oldCm: acceptTradeSnarkInputs.cm_del_azeroth,
    newCm: mimc7.hash(newOpen, '00', delegateServerKey.pk.ena),
};

const oldRt = decStrToHex(await contracts.contractMethod.getRootTop().call());
const intermediateHashes = await contracts.instance.methods.getMerklePath(cmDelIdx.toString()).call();

const mtData = mtree(oldRt, decArrToHexArr(intermediateHashes), cmDelIdx);
console.log("mtData : ", mtData)

let tmp = acceptTradeSnarkInputs.cm_del_azeroth
for(let i=0 ;i<32 ;i++){
    tmp = mimc7.hash(tmp, intermediateHashes[i])
}

console.log('calc root : ', tmp, )
console.log("cm_azeroth_del : ", acceptTradeSnarkInputs.cm_del_azeroth)
console.log('cm_azeroth_peer:  ', acceptTradeSnarkInputs.cm_peer_azeroth, '\n', mimc7.hash( acceptTradeSnarkInputs.cm_peer_azeroth), '\n\n\n')

const zkTransferInput = new snarks.zkTransferInput(
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

const zklayContractInput = zkTransferInput.toSnarkVerifyFormat(
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







