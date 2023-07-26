import Web3Interface from "./web3.interface";
import { ContractJson, sendTransaction } from "./web3";
import Ganache from "./ganahce";
import { addPrefixHex } from "../utils/types";
import Config from "../config";
import { getContractFormatProof } from "./utils";

export default class tradeContract extends Web3Interface {
    constructor(endPoint, contractAddress) {
        super(endPoint);
        this.instance = new this.eth.Contract(ContractJson.abi, contractAddress);
        this.contractMethod = this.instance.methods;
        this.contractAddress= contractAddress;
    }

    async azerothRegisterAuditor(
        pkEnc, 
        userEthAddress = Ganache.getAddress(Config.AUDITOR_IDX),
        userEthPrivateKey = Ganache.getPrivateKey(Config.AUDITOR_IDX)
    ) {
        return await sendTransaction(
            this,
            this.instance.methods.registerAuditor(
                [
                    '0x' + pkEnc.x.toString(16),
                    '0x' + pkEnc.y.toString(16)
                ]
            ),
            '10000000',
            userEthAddress,
            userEthPrivateKey
        )
    }   

    async azerothRegisterUser(
        addr, 
        pkOwn, 
        pkEnc, 
        userEthAddress = Ganache.getAddress(),
        userEthPrivateKey = Ganache.getPrivateKey()
    ) 
    {
        return await sendTransaction(
            this,
            this.instance.methods.registerUser(
                addPrefixHex(addr), 
                addPrefixHex(pkOwn), 
                [
                    '0x' + pkEnc.x.toString(16), 
                    '0x' + pkEnc.y.toString(16)
                ]
            ),
            '10000000',
            userEthAddress,
            userEthPrivateKey
        )
    }

    async zkMarketRegisterUser(
        addr,
        pkOwn, 
        pkEnc, 
        eoa,
    )
    {   
        // console.log(
        //     addPrefixHex(pkOwn),
        //     addPrefixHex(pkEnc.x.toString(16)),
        //     eoa
        // )
        return await sendTransaction(
            this,
            this.instance.methods.registUserByDelegator(
                addPrefixHex(pkOwn),
                addPrefixHex(pkEnc.x.toString(16)),
                eoa
            ),
            '10000000',
            Ganache.getAddress(0),
            Ganache.getPrivateKey(0)
        )
    }

    async registUser(
        pk_own,
        pk_enc,
        eoa,
        userEthAddress = Ganache.getAddress(),
        userEthPrivateKey = Ganache.getPrivateKey(),
    ) {
        const gas = await this.contractMethod.registUserByDelegator(
            pk_own, pk_enc, eoa
        ).estimateGas();

        return this.sendContractCall(
            this.contractMethod.registUserByDelegator(pk_own, pk_enc, eoa),
            userEthAddress,
            userEthPrivateKey,
            gas
        );
    }

    async isRegisteredUser(addr) {
        return this.localContractCall(
            this.contractMethod.isRegisteredUser(addr)
        )
    }

    async getUserPK(address) {
        return this.localContractCall(
            this.contractMethod.getUserPk(address)
        )
    }

    async registData(
        proof,
        inputs,
        userEthAddress = Ganache.getAddress(),
        userEthPrivateKey = Ganache.getPrivateKey(),
    ) {
        if (proof.length != 8) {
            console.log('invalid proof length');
            return false;
        }
        if (inputs.length != 4) {
            console.log('invalid inputs length');
            return false;
        }
        const gas = await this.contractMethod.registData(proof, inputs).estimateGas();

        return await this.sendContractCall(
            this.contractMethod.registData(proof, inputs),
            userEthAddress,
            userEthPrivateKey,
            gas
        )
    }

    async isRegisteredData(hCt) {
        return this.localContractCall(
            this.contractMethod.isRegistered(hCt)
        )
    }

    async acceptTrade(
        h_k,
        snarkInput,
        userEthAddress = Ganache.getAddress(),
        userEthPrivateKey = Ganache.getPrivateKey()
    ) {
        return await sendTransaction(
            this,
            this.instance.methods.acceptOrder(
                getContractFormatProof(h_k, snarkInput.CircuitType),
                snarkInput.toSnarkVerifyFormat()
            ),
            '100000000',
            userEthAddress,
            userEthPrivateKey
        )
    }
}