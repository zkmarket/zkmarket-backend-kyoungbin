import _ from "lodash";

import RegistDataSnarkInputs from "../snarks/inputs/registDataInputs";
import AcceptTradeSnarkInputs from "../snarks/inputs/acceptTradeInputs";
import  GenTradeSnarkInputs  from "../snarks/inputs/genTradeInputs";
import LibSnark from "../snarks/libsnark";
import Encryption from "../crypto/encryption";
import mimc from "../crypto/mimc";
import math from "../utils/math";
import Curve from "../crypto/curve";
import types, {hexToInt} from "../utils/types";


console.log('=================== REGIST DATA SNARK INPUTS ===================')

const mimc7 = new mimc.MiMC7();
const registDataSnarkInputs = new RegistDataSnarkInputs();

registDataSnarkInputs.uploadDataFromFilePath("./src/test/test.txt");

const addr_del = math.randomFieldElement().toString(16);
const sk_enc_cons = math.randomFieldElement().toString(16);
const pk_enc_cons = Curve.basePointMul(types.hexToInt(sk_enc_cons)).toString(16)

const sk_enc_peer = math.randomFieldElement().toString(16);
const pk_enc_peer = Curve.basePointMul(types.hexToInt(sk_enc_peer)).toString(16)

const r_cm = math.randomFieldElement().toString(16);
const pk_own_azeroth = math.randomFieldElement().toString(16);
const pk_enc_azeroth = math.randomFieldElement().toString(16);
const addr_peer      = mimc7.hash(pk_own_azeroth, pk_enc_azeroth);

const k_ena = math.randomFieldElement().toString(16);
const symEnc = new Encryption.symmetricKeyEncryption(k_ena);

const fee_peer = '10000'
const fee_del  = '1000'

let beforeBalance = BigInt(4000000) + BigInt(hexToInt(fee_del)) + BigInt(hexToInt(fee_peer))
let afterBalance  = BigInt(4000000) 

const ENA = symEnc.Enc(beforeBalance.toString(16))
const ENA_= symEnc.Enc(afterBalance.toString(16))

console.log("ENA : ", ENA, hexToInt(symEnc.Dec(ENA)), (BigInt(fee_del) + BigInt(fee_peer)).toString(10))
console.log("ENA_ : ", ENA_, hexToInt(symEnc.Dec(ENA_)))

// process.exit(0)

console.log("pk_own_azeroth : ", pk_own_azeroth);
console.log("pk_enc_azeroth : ", pk_enc_azeroth);
console.log("addr           : ", addr_peer);


registDataSnarkInputs.uploadAddrPeer(addr_peer);

registDataSnarkInputs.encryptData();

registDataSnarkInputs.makeSnarkInput();


console.log('=================== REGIST DATA SNARK PROVER ===================')

// const registDataProver = new LibSnark("RegistData");

// registDataProver.uploadInputAndRunProof(registDataSnarkInputs.toSnarkInputFormat(), '_' + registDataSnarkInputs.gethCt());

console.log('=================== GEN TRADE SNARK INPUTS ===================')

const genTradeSnarkInputs = new GenTradeSnarkInputs(
    pk_enc_peer,
    addr_peer,
    pk_enc_cons,
    addr_del,
    ENA,
    ENA_,
    k_ena,
    registDataSnarkInputs.gethK(),
    fee_peer,
    fee_del
)

console.log(genTradeSnarkInputs.toSnarkInputFormat())

console.log('=================== GEN TRADE SNARK PROVER ===================')

const genTradeProver = new LibSnark("GenTrade");
genTradeProver.uploadInputAndRunProof(genTradeSnarkInputs.toSnarkInputFormat(), '_' + genTradeSnarkInputs.gethk());

console.log('=================== ACCEPT TRADE SNARK INPUTS ===================')


const acceptTradeSnarkInputs = new AcceptTradeSnarkInputs(
    addr_del,
    addr_peer,
    pk_enc_cons,
    registDataSnarkInputs.getEncKey(),
    r_cm,
    fee_peer,
    fee_del
)

console.log("=================== ACCEPT TRADE SNARK PROVER ===================")
const acceptTradeProver = new LibSnark('AcceptTrade');

console.log(acceptTradeSnarkInputs.toSnarkInputFormat())

acceptTradeProver.uploadInputAndRunProof(acceptTradeSnarkInputs.toSnarkInputFormat(), '_' + acceptTradeSnarkInputs.gethk());