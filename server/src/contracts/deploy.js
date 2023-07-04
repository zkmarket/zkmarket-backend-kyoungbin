import _ from 'lodash'
import fs from 'fs'
import Ganache from './ganahce'
import Config from '../config'
import { web3, ContractJson, ContractIns } from './web3'
import { getContractFormatVk } from './utils'

export async function ganacheDeploy() {
    const fromAddr = Ganache.getAddress();
    const privKey  = Ganache.getPrivateKey();
    console.log(fromAddr, privKey)
    const receipt =  await deploy(fromAddr, privKey);

    ContractIns.options.address = receipt.contractAddress;

    return receipt.contractAddress;
}


export async function deploy(
    fromAddr,
    privKey,
) {

    const deployTx = ContractIns.deploy({
        data : ContractJson.bytecode,
        arguments : [
            getContractFormatVk('RegistData'), 
            getContractFormatVk('GenTrade'),
            getContractFormatVk('AcceptTrade')
        ],
    })


    const txCount = await web3.eth.getTransactionCount(fromAddr, 'pending');
    const chainId = await web3.eth.getChainId();
    console.log(deployTx)
    console.log(chainId)

    const createTransaction = await web3.eth.accounts.signTransaction({
        from    : `${fromAddr}`,
        data    : deployTx.encodeABI(),
        gas     : await deployTx.estimateGas(),
        gasPrice: '0x1',
    },
    `${privKey}`
    );

    const createReceipt = await web3.eth.sendSignedTransaction(createTransaction.rawTransaction);
    console.log(`Contract deployed at address: ${createReceipt.contractAddress}`);
    
    // set Contrat Address
    ContractIns.options.address = createReceipt.contractAddress;
    console.log(createReceipt);
    return createReceipt;
}

