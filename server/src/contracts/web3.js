import fs from 'fs';
import Web3 from 'web3';
import path from 'path';
import Config, {contractsBuildPath} from '../config';

const abi = JSON.parse(
        fs.readFileSync(
            path.join(Config.homePath, 'src/test/DataTradeContract/abi.json'),
            'utf-8'
        )
    )
const bytecode = fs.readFileSync(path.join(Config.homePath, 'src/test/DataTradeContract/bytecode'), 'utf-8')

export const web3 = new Web3(new Web3.providers.HttpProvider(Config.testProvider));

export const ContractJson = JSON.parse(fs.readFileSync(contractsBuildPath + 'DataTradeContract.json', 'utf-8'));
export const ContractIns  = new web3.eth.Contract(abi); //ContractJson.abi  // abi

export async function sendTransaction(
    web3,
    call,
    gas ,
    senderEthAddress = Ganache.getAddress(),
    senderEthPrivateKey = Ganache.getPrivateKey(),
    value = undefined
) {
    const txDesc = {
        from: senderEthAddress,
        gas: gas,
    };
    if (value !== undefined) {
        _.set(txDesc, 'value', value)
    }
    const encodedABI = call.encodeABI();
    const txCount = await web3.eth.getTransactionCount(senderEthAddress, 'pending');
    const chainId = await web3.eth.getChainId();
    const rawTx = {
        ...txDesc,
        data: encodedABI,
        nonce: '0x' + txCount.toString(16),
        to: call._parent._address,
        common: {
            customChain: {
                networkId: chainId,
                chainId: chainId,
            }
        }
    };

    const signedTx = await web3.eth.accounts.signTransaction(rawTx, senderEthPrivateKey);

    return web3.eth.sendSignedTransaction(signedTx.rawTransaction);
}


export default {
    web3,
    ContractJson,
    ContractIns,
    sendTransaction
}