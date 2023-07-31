import Config from "../config";
import contractKeys from '../contractKeys';
import wallet from "../wallet";

export default class Note {
    constructor(
        note_idx,
        open,
        bal,
        addr,
        cm,
        tokenAddress,
        sk_enc
    ) {
        this.note_idx = note_idx;
        this.open_key = open;
        this.bal = bal;
        this.user_addr = addr;
        this.cm = cm;
        this.tokenAddress = tokenAddress;
        this.sk_enc = sk_enc;
    }

    toJson() {
        return JSON.stringify(this, null, 2);
    }
}

export const generateNotesFromAcceptInput = (acceptInput, info, sk_enc_peer) => {
    const notes = []

    // append server note
    notes.push(
        new Note(
            info[2],
            acceptInput.o_del,
            acceptInput.fee_del,
            acceptInput.addr_del,
            acceptInput.cm_del_azeroth,
            Config.ZERO_TOKEN_ADDRESS,
            wallet.delegateServerKey.sk
        )
    )

    // append peer note
    notes.push(
        new Note(
            info[3],
            acceptInput.o_peer,
            acceptInput.fee_peer,
            acceptInput.addr_peer,
            acceptInput.cm_peer_azeroth,
            Config.ZERO_TOKEN_ADDRESS,
            sk_enc_peer
        )
    )
    return notes
}