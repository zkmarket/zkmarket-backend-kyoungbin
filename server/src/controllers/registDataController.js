import _ from 'lodash'
import fs from 'fs'
import snarks from "../snarks";
import contracts from "../contracts";
import db from "../db";
import { getContractFormatProof, registDataInputJsonToContractFormat } from "../contracts/utils";
import Config, { dbPath } from "../config";
import { recoverAddr } from '../wallet/keyStruct';
import { hexToInt } from '../utils/types';
/**
 * 
 * body : {
 *  "data"      <-- utf8 데이터
 *  "pk_own"
 *  "sk_enc"
 *  "title"
 *  "desc"
 *  "author"
 * }
 */

// 1. proof 생성 
// 2. tx전송 
// 3. db에 저장
const registDataController = async (req, res) => {
    try {
        console.log(req.body)
        const addr = recoverAddr(req.body.pk_own, getPkEncX(req.body.pk_enc)); 
        console.log("addr : ", addr);
        const isRegistered = await contracts.tradeContract.isRegisteredUser(hexToInt(addr).toString())
        console.log(isRegistered);

        if(!isRegistered) {
            const registUserReceipt = await contracts.tradeContract.registUser(
                hexToInt(req.body.pk_own).toString(),
                hexToInt(getPkEncX(req.body.pk_enc)).toString(),
                req.body.eoa
            )
            console.log(registUserReceipt)
            if(!_.get(registUserReceipt, 'status')) return res.send(false);
        }

        const snarkInput = new snarks.registDataInput();

        snarkInput.uploadDataFromStr(req.body.data);

        snarkInput.uploadPkOwn(req.body.pk_own);

        snarkInput.encryptData();

        snarkInput.makeSnarkInput();

        console.log(snarkInput.toSnarkInputFormat());

        snarks.registDataProver.uploadInputAndRunProof(snarkInput.toSnarkInputFormat(),'_'+snarkInput.gethCt());

        const contractFormatProof = getContractFormatProof(snarkInput.gethCt(), snarks.registDataProver.CircuitType)
        const contractFormatInputs= registDataInputJsonToContractFormat(JSON.parse(snarkInput.toSnarkVerifyFormat()));

        const receipt = await contracts.tradeContract.registData(
            contractFormatProof,
            contractFormatInputs,
        )

        console.log(receipt);
        
        console.log(req.body);
        
        db.data.insertData(
            req.body.title,
            req.body.desc,
            req.body.author,
            req.body.pk_own,
            req.body.sk_enc,
            req.body.eoa,
            snarkInput.gethK(),
            snarkInput.gethCt(),
            snarkInput.getIdData(),
            snarkInput.getEncKey(),
            dbPath + 'data/' + snarkInput.gethCt() + '.json',
        )

        let registerDataJson =  _.merge(
            {
                "ct_data" : JSON.parse(snarkInput.getsCtData()),
                'enc_key' : snarkInput.getEncKey(),
                'h_ct'  : snarkInput.gethCt(),
                'h_data'  : snarkInput.getIdData(),
                'data_path' : dbPath  + 'data/' + snarkInput.gethCt() + '.json',
                'h_k'   : snarkInput.gethK(),
            }, 
        req.body)

        fs.writeFileSync(dbPath + 'data/' + snarkInput.gethCt() + '.json', JSON.stringify(registerDataJson));

        res.send(true);
    } catch (error) {
        console.log(error);
        res.send(false);
    }
    
}

const getPkEncX = (pk_enc) => {
    return JSON.parse(pk_enc)['x'];
}

export default registDataController;