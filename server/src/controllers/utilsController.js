import _ from 'lodash'
import Config from "../config"
import contracts, { writerKeys } from "../contracts"
import Ganache from "../contracts/ganahce"
import web3 from "../contracts/web3"
import db from "../db"
import snarks from "../snarks"
import wallet from "../wallet"

export const TEST_DATA = '123 123\n fds fds \n';

let DATA_ENC_KEY = undefined;

export const getContractAddressController = (req, res) => {
    console.log('getContractAddressController : ', contracts.tradeContract.instance.options.address)
    res.send(contracts.tradeContract.instance.options.address)
}


export const getExampleGenTradeParamsController = async (req, res) => {
    
    
    // to make GenTrade parameters
    const RegisterDataSnarkInputs = new snarks.registDataInput();

    RegisterDataSnarkInputs.uploadDataFromStr(TEST_DATA);

    RegisterDataSnarkInputs.uploadAddrPeer(writerKeys.pk.ena);

    RegisterDataSnarkInputs.encryptData();

    RegisterDataSnarkInputs.makeSnarkInput();

    const hK = RegisterDataSnarkInputs.gethK();
    const addrPeer = writerKeys.pk.ena;
    const pkEnc = writerKeys.pk.pkEnc;

    DATA_ENC_KEY = RegisterDataSnarkInputs.getEncKey();

    console.log(hK, addrPeer, pkEnc)



    res.send({
        hK          : hK,
        pkEncPeer   : pkEnc.toXYJson(),
        addrPeer    : addrPeer,
        addrDel     : wallet.delegateServerKey.pk.ena,
        feeDel      : BigInt(web3.web3.utils.toWei('0.1', 'ether')).toString(16),
        feePeer     : BigInt(web3.web3.utils.toWei('0.9', 'ether')).toString(16),
    })
}

export const getNotesController = async (req, res) => {
    console.log(req.param, req.params)
    if(_.get(req.params, 'sk_enc') == undefined) return res.send([])

    const notes = await db.note.SELECT_NOTE_UNREAD_AND_UPDATEr((_.get(req.params, 'sk_enc')).toLocaleLowerCase());

    return res.send(notes);
}

export function getDataEncKey (){
    return DATA_ENC_KEY;
}



export default {
    getContractAddressController,
    getExampleGenTradeParamsController,
    getDataEncKey
}