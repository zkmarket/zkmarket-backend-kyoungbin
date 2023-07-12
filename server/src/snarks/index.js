import RegistDataSnarkInputs from "./inputs/registDataInputs"
import AcceptTradeSnarkInputs from "./inputs/acceptTradeInputs"
import GenTradeSnarkInputs from "./inputs/genTradeInputs";
import LibSnark, { ZkTransferLibsnark } from "./libsnark"
import ZkTransferSnarkInputs from "./inputs/zkTransferInputs";

const registDataProver = new LibSnark("RegistData");
const genTradeProver = new LibSnark("GenTrade");
const acceptTradeProver = new LibSnark("AcceptTrade");
const zkTransferProver = new ZkTransferLibsnark();

export default {
    registDataInput : RegistDataSnarkInputs,
    acceptTradeInput: AcceptTradeSnarkInputs,
    genTradeInput : GenTradeSnarkInputs,
    zkTransferInput : ZkTransferSnarkInputs,
    genTradeProver: genTradeProver,
    registDataProver: registDataProver,
    acceptTradeProver: acceptTradeProver,
    zkTransferProver: zkTransferProver
}