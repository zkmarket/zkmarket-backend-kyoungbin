import RegistDataSnarkInputs from "./inputs/registDataInputs"
import LibSnark from "./libsnark"

const registDataProver = new LibSnark("RegistData");
const acceptTradeProver = new LibSnark("AcceptTrade");

export default {
    registDataInput : RegistDataSnarkInputs,
    registDataProver: registDataProver,
    acceptTradeProver: acceptTradeProver,
}