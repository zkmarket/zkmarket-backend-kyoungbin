import _ from 'lodash'
import fs from 'fs'
import snarks from "../snarks";
import contracts from "../contracts";
import db from "../db";
import { getContractFormatProof, registDataInputJsonToContractFormat } from "../contracts/utils";
import Config, { dbPath } from "../config";
import { recoverAddr } from '../wallet/keyStruct';
import types, { hexToInt } from '../utils/types';
import web3 from '../contracts';
/**
 * 
 * body : {
 *  "data"      <-- utf8 데이터     proof
 *  "addr_peer" <-- azerothENA 주소 proof
 * 
 *  "pk_own"    <-- register User / DB에 저장
 *  "pk_enc"    <-- register User / DB에 저장
 *  "eoa"       <-- 판매자 ETH 주소
 * 
 *  "sk_enc"    <-- DB에 저장해야함.
 *  "title"     <-- DB에 저장해야함.
 *  "desc"      <-- DB에 저장해야함.
 *  "author"    <-- DB에 저장해야함.
 *  "image"     <-- 처리 되있음
 * }
 */

// 1. proof 생성 
// 2. tx전송 
// 3. db에 저장
const registDataController = async (req, res) => {
    try {
        console.log("req.bod : ", req.body)
        
        const isRegistered = await contracts.tradeContract.isRegisteredUser(types.addPrefixAndPadHex(req.body.addr_peer))
        if(!isRegistered) {
            try {
                const registUserReceipt = await contracts.tradeContract.zkMarketRegisterUser(
                    req.body.addr_peer,
                    req.body.pk_own,
                    JSON.parse(req.body.pk_enc),
                    req.body.eoa
                )
                console.log(registUserReceipt)
                if(!_.get(registUserReceipt, 'status')) return res.send(false);
            } catch (error) {
                console.log(error)
                return res.send(false);
            }
        }

        const snarkInput = new snarks.registDataInput();

        snarkInput.uploadDataFromStr(req.body.data);

        snarkInput.uploadAddrPeer(req.body.addr_peer);

        snarkInput.encryptData();

        snarkInput.makeSnarkInput();

        await snarks.registDataProver.uploadInputAndRunProof(snarkInput.toSnarkInputFormat(),'_'+snarkInput.gethK());

        const contractFormatProof = getContractFormatProof(snarkInput.gethK(), snarks.registDataProver.CircuitType)
        const contractFormatInputs= snarkInput.toSnarkVerifyFormat();
        console.log("")
        
        try {
            await sendRegisterDataTx(contractFormatProof, contractFormatInputs)
        } catch (error) {
            console.log(error)
            return res.send(false);
        }
        
        console.log(req.body, hexToInt(req.body.eoa).toString(16).toLocaleLowerCase());
        
        let pkEnc = JSON.parse(req.body.pk_enc);
        db.data.insertData(
            req.body.title,
            req.body.desc,
            req.body.author,
            req.body.pk_own,
            req.body.sk_enc,
            _.get(pkEnc, 'x'),
            req.body.addr_peer,
            hexToInt(req.body.eoa).toString(16).toLocaleLowerCase(),
            snarkInput.gethK(),
            snarkInput.gethCt(),
            web3.tradeContract.utils.toWei( req.body.fee ),
            snarkInput.getEncKey(),
            dbPath + 'data/' + snarkInput.gethK() + '.json',
            req.body.filename ?? ''
        )

        let registerDataJson =  _.merge(
            {   
                "text" : req.body.data,
                "ct_data" : JSON.parse(snarkInput.getsCtData()),
                'enc_key' : snarkInput.getEncKey(),
                'h_ct'  : snarkInput.gethCt(),
                'data_path' : dbPath  + 'data/' + snarkInput.gethK() + '.json',
                'h_k'   : snarkInput.gethK(),
            }, 
        req.body)

        fs.writeFileSync(dbPath + 'data/' + snarkInput.gethK().toLocaleLowerCase() + '.json', JSON.stringify(registerDataJson));

        res.send(true);
    } catch (error) {
        console.log(error);
        res.send(false);
    }
    
}

const sendRegisterDataTx = async (proof, inputs) =>{
    try {
        const receipt = await contracts.tradeContract.registData(
            proof,
            inputs,
        )
        return _.get(receipt, 'status');
    } catch (error) {
        return undefined;
    }
} 

const getPkEncX = (pk_enc) => {
    return JSON.parse(pk_enc)['x'];
}

const parseReq = (req) => {

}

export default registDataController;