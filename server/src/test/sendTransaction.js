import _ from 'lodash'
import Ganache from "../contracts/ganahce";

export async function sendTransaction(
    web3,
    call,
    gas ,
    senderEthAddress,
    senderEthPrivateKey,
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

export default sendTransaction;