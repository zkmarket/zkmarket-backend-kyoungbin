import Config from "../config"
import contracts, { writerKeys } from "../contracts"
import Ganache from "../contracts/ganahce"
import web3 from "../contracts/web3"
import snarks from "../snarks"
import wallet from "../wallet"

export const getContractAddressController = (req, res) => {
    console.log('getContractAddressController : ', contracts.tradeContract.instance.options.address)
    res.send(contracts.tradeContract.instance.options.address)
}

export const getExampleGenTradeParamsController = async (req, res) => {
    const data = '123 123\n fds fds \n'
    
    // to make GenTrade parameters
    const RegisterDataSnarkInputs = new snarks.registDataInput();

    RegisterDataSnarkInputs.uploadDataFromStr(data);

    RegisterDataSnarkInputs.uploadAddrPeer(writerKeys.pk.ena);

    RegisterDataSnarkInputs.encryptData();

    RegisterDataSnarkInputs.makeSnarkInput();

    const hK = RegisterDataSnarkInputs.gethCt();
    const addrPeer = writerKeys.pk.ena;
    const pkEnc = writerKeys.pk.pkEnc;

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

export default {
    getContractAddressController,
    getExampleGenTradeParamsController
}