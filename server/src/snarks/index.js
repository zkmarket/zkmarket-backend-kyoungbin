import RegistDataSnarkInputs from "./inputs/registDataInputs"
import AcceptTradeSnarkInputs from "./inputs/acceptTradeInputs"
import GenTradeSnarkInputs from "./inputs/genTradeInputs";
import LibSnark from "./libsnark"

const registDataProver = new LibSnark("RegistData");
const genTradeProver = new LibSnark("GenTrade");
const acceptTradeProver = new LibSnark("AcceptTrade");

export default {
    registDataInput : RegistDataSnarkInputs,
    acceptTradeInput: AcceptTradeSnarkInputs,
    genTradeInput : GenTradeSnarkInputs,
    genTradeProver: genTradeProver,
    registDataProver: registDataProver,
    acceptTradeProver: acceptTradeProver,
}