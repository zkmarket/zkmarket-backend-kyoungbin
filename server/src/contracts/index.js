import { deploy, ganacheDeploy } from "./deploy";
import tradeContract from "./contract";
import Config from "../config";
import wallet from "../wallet";
import Ganache from "./ganahce";
import { hexToInt } from "../utils/types";

const contractAddress = await ganacheDeploy();

const trade = new tradeContract(Config.testProvider, contractAddress);

await trade.registUser(
    hexToInt(wallet.pkOwn).toString(),
    hexToInt(wallet.pkEnc).toString(),
    Ganache.getAddress()
)

export default {
    tradeContract : trade
}
