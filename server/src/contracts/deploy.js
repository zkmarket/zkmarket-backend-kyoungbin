import fs from 'fs'
import _ from 'lodash'
import path from 'path'
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
    const deployTx = ContractIns.deploy({
        data : bytecode,
        arguments : [
            // getContractFormatVk('RegistData'), 
            // getContractFormatVk('GenTrade'),
            // getContractFormatVk('AcceptTrade'),
            testParameter.vk_registData,
            testParameter.vk_genTrade,
            testParameter.vk_acceptTrade,
            32,
            getContractFormatVk('ZKlay'),
            testParameter.vk_nft,
            web3.utils.toHex((0.00000 * web3.utils.unitMap.ether)),
            fromAddr,
        ],
    })


    const txCount = await web3.eth.getTransactionCount(fromAddr, 'pending');
    const chainId = await web3.eth.getChainId();
    console.log(deployTx)
    console.log(chainId)

    const createTransaction = await web3.eth.accounts.signTransaction({
        to      : deployTx._parent._address,
        from    : `${fromAddr}`,
        data    : deployTx.encodeABI(),
        gas     : '10000000' ,
        nonce: '0x' + txCount.toString(16),
        common: {
            customChain: {
                networkId: chainId,
                chainId: chainId,
            }
        }
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

