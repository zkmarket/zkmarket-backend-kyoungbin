import Web3Interface from "./web3.interface";
import { ContractJson } from "./web3";
import Ganache from "./ganahce";

export default class tradeContract extends Web3Interface {
    constructor(endPoint, contractAddress) {
        super(endPoint);
        this.instance = new this.eth.Contract(ContractJson.abi, contractAddress);
        this.contractMethod = this.instance.methods;
        this.contractAddress= contractAddress;
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
}