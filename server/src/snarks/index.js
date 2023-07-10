import RegistDataSnarkInputs from "./inputs/registDataInputs"
import AcceptTradeSnarkInputs from "./inputs/acceptTradeInputs"
import LibSnark from "./libsnark"

const registDataProver = new LibSnark("RegistData");
const acceptTradeProver = new LibSnark("AcceptTrade");

export default {
    registDataInput : RegistDataSnarkInputs,
    acceptTradeInput: AcceptTradeSnarkInputs,
    registDataProver: registDataProver,
    acceptTradeProver: acceptTradeProver,
}