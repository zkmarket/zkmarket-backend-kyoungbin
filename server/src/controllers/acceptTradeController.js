

/**
 * 
 * txHash -> log 확인
 * 누군지 알려줘야함 : pk_enc ? sk_enc ? eoa
 * 
 * 
 */

import _ from 'lodash'
import contracts, { writerKeys } from "../contracts";
import {sendTransaction, web3} from "../contracts/web3";
import Encryption from "../crypto/encryption";
import db from "../db";
import snarks from "../snarks";
import { addPrefixHex } from "../utils/types";
import wallet from "../wallet";
import { getDataEncKey } from './utilsController';
import { generateNotesFromAcceptInput } from '../snarks/note';

/**
 * 
 * sk_enc
 * txHash
 * 
 */
const acceptTradeController = async (req, res) => {
    const txHash = req.body.txHash;
    console.log("req.body : ", req.body)

    web3.eth.getTransactionReceipt(addPrefixHex(txHash), async (err, receipt) => {
        if(err) {
            console.log(err);
            return res.send(false);
        }
        if(_.get(receipt, 'status') == false){ return res.send(false) }

        const eoaAddr = getEoaAddrFromReceipt(receipt);
        console.log(eoaAddr.toLocaleLowerCase())
        const consumerInfo = await db.data.getDataInfo(
            'eoa',
            eoaAddr.toLocaleLowerCase()
        )
        
        console.log("consumerInfo : ", consumerInfo)

        const [pk_enc_cons, r_cm, fee_peer, fee_del, h_k] = getGenTradeMsgFromReceipt(receipt, _.get(consumerInfo, 'sk_enc'));
        // const [pk_enc_cons, r_cm, fee_peer, fee_del, h_k] = getGenTradeMsgFromReceipt(receipt, writerKeys.sk);

        
        if(pk_enc_cons == undefined) return res.send(false);

        console.log(
            wallet.delegateServerKey.pk.ena,
            _.get(consumerInfo, 'addr_'),
            pk_enc_cons,
            _.get(consumerInfo, 'enc_key'),
            r_cm,
            fee_peer,
            fee_del
        )

        const acceptTradeSnarkInputs = new snarks.acceptTradeInput(
            wallet.delegateServerKey.pk.ena,
            _.get(consumerInfo, 'addr_'),
            pk_enc_cons,
            _.get(consumerInfo, 'enc_key'),
            r_cm,
            fee_peer,
            fee_del
        )
        console.log('accept Trade input : ', acceptTradeSnarkInputs.toSnarkInputFormat())

        // below is to TEST
        // const acceptTradeSnarkInputs = new snarks.acceptTradeInput(
        //     wallet.delegateServerKey.pk.ena,
        //     writerKeys.pk.ena,
        //     pk_enc_cons,
        //     getDataEncKey(),
        //     r_cm,
        //     fee_peer,
        //     fee_del
        // )
        
        snarks.acceptTradeProver.uploadInputAndRunProof(acceptTradeSnarkInputs.toSnarkInputFormat(), '_' + acceptTradeSnarkInputs.gethk());
        
        const acceptTradeReceipt = await contracts.tradeContract.acceptTrade(
            acceptTradeSnarkInputs.gethk(),
            acceptTradeSnarkInputs
        )
        console.log(acceptTradeReceipt);
        
        console.log('parseTxLog(acceptTradeReceipt) : ', parseTxLog(acceptTradeReceipt))

        const notes = generateNotesFromAcceptInput(
            acceptTradeSnarkInputs,
            parseTxLog(acceptTradeReceipt)[0],
            _.get(consumerInfo, 'sk_enc').toLocaleLowerCase()
        )

        console.log('notes : ', notes)

        db.note.INSER_NOTES(...notes)

        console.log('notes : ', await db.note.SELECT_NOTE_UNREAD())
        return res.send(true)
    })

}

// msg 
// 0 : pk_enc_cons
// 1 : r_cm
// 2 : fee_peer
// 3 : fee_del
// 4 : h_k
const getGenTradeMsgFromReceipt = (receipt, skEnc) => {
    console.log(receipt),
    console.log(parseTxLog(receipt), skEnc)
    console.log(skEnc)
    try {
        const logs = parseTxLog(receipt)[0];
        const penc = new Encryption.publicKeyEncryption();
        const msg = penc.Dec(
            new Encryption.pCT(
                logs[1],
                logs[2],
                logs.slice(3)
            ),
            skEnc
        )
        console.log('msg : ', msg)
        return msg;
    } catch (error) {
        console.log(error);
        return [undefined, undefined, undefined, undefined, undefined]
    }
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

export default acceptTradeController;