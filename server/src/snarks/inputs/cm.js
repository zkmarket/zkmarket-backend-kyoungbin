import math from "../../utils/math";
import mimc from "../../crypto/mimc";

export default class CoinCommitment {
    constructor(
        cm_own = undefined,
        cm_del = undefined
    ) {
        this.cm_own = cm_own
        this.cm_del = cm_del
    }

    static makeCm({
        addr_peer,
        addr_del,
        pk_enc_cons,
        r_cm,
        fee_own,
        fee_del,
        h_k
    }) {
        const mimc7 = new mimc.MiMC7();

        console.log(
            "\naddr_peer : "    ,  addr_peer, '\n',
            "addr_del : "       ,   addr_del, '\n',
            'r_cm : '           ,         r_cm ,'\n',
            'fee_own : '        ,      fee_own ,'\n',
            'h_k : '            ,          h_k ,'\n',
            'pk_enc_cons : '    ,  pk_enc_cons ,'\n',
        )  

        
        const cm_own = mimc7.hash(addr_peer, r_cm, fee_own, h_k, pk_enc_cons);
        const cm_del = mimc7.hash(addr_del, r_cm, fee_del, h_k, pk_enc_cons);

        return new CoinCommitment(cm_own, cm_del);
    }

    static genCm(
        addr_peer,
        addr_del,
        pk_enc_cons,
        fee_own, 
        fee_del, 
        h_k, 
    ) {
        const randomHex = math.randomFieldElement()
        return [
            this.makeCm({
            addr_peer:   addr_peer,
            addr_del: addr_del,
            pk_enc_cons : pk_enc_cons,
            r_cm        : randomHex.toString(16),
            fee_own     : fee_own, 
            fee_del     : fee_del, 
            h_k         : h_k, 
        }), randomHex.toString(16)];
    }

    toJson(){
        return JSON.stringify(this, null, 2);
    }
}