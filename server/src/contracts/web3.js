import fs from 'fs';
import Web3 from 'web3';
import Config, {contractsBuildPath} from '../config';

export const web3 = new Web3(new Web3.providers.HttpProvider(Config.testProvider));

export const ContractJson = JSON.parse(fs.readFileSync(contractsBuildPath + 'DataTradeContract.json', 'utf-8'));
export const ContractIns  = new web3.eth.Contract(ContractJson.abi);

export default {
    web3,
    ContractJson,
    ContractIns
}