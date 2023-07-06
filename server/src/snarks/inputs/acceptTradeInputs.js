import fs from 'fs'
import Config from "../../config";
import mimc from "../../crypto/mimc";
import types from "../../utils/types";
import math from "../../utils/math";
import Encryption from "../../crypto/encryption";
import CurveParam from "../../crypto/curveParam";
import FileSystem, { rawFileToBigIntString } from "../../utils/file";

export default class AcceptTradeSnarkInputs{
    /**
     * 
     * @param {string} pk_own_del 
     * @param {string} pk_own_peer 
     * @param {string} pk_enc_cons 
     * @param {string} dataEncKey 
     * @param {string} r_cm 
     * @param {string} fee_peer 
     * @param {string} fee_del 
     */
    constructor(
        addr_del,
        addr_peer,
        pk_enc_cons,
        dataEncKey,
        r_cm,
        fee_peer,
        fee_del
    ){  
        const mimc7 = new mimc.MiMC7();
        const pubEnc= new Encryption.publicKeyEncryption();

        this.pk_enc_cons = pk_enc_cons
        this.addr_peer   = addr_peer
        this.addr_del    = addr_del
        this.dataEncKey  = dataEncKey
        this.r_cm        = r_cm
        this.fee_del     = fee_del
        this.fee_peer    = fee_peer

        this.h_k         = mimc7.hash(
            this.addr_peer,
            this.dataEncKey
        )

        this.cm_peer = mimc7.hash(addr_peer, r_cm, fee_peer, this.h_k, pk_enc_cons);
        this.cm_del = mimc7.hash(addr_del, r_cm, fee_del, this.h_k, pk_enc_cons);

        const o_peer = mimc7.hash( r_cm, fee_peer, this.h_k, pk_enc_cons);
        const o_del  = mimc7.hash( r_cm, fee_del, this.h_k, pk_enc_cons);

        this.cm_peer_azeroth = mimc7.hash(addr_peer, fee_del, o_peer)
        this.cm_del_azeroth  = mimc7.hash(addr_del, fee_peer, o_del)
        
        console.log(pk_enc_cons, dataEncKey)
        const[pct, r, k] = pubEnc.Enc(
            {pkEnc : pk_enc_cons},
            dataEncKey
        )

        this.ecryptedDataEncKey = pct.toList();
        this.r_enc = r;
        this.k_enc = k;
    }

    toJson(){
        return JSON.stringify(this, null, 2)
    }
    
    toSnarkInputFormat(){
        return this.toJson();
    }

    toSnarkVerifyFormat() {
        return JSON.stringify({
            'cm_del' : this.cm_del,
            'cm_own' : this.cm_own,
            'ecryptedDataEncKey' : this.ecryptedDataEncKey
        }, null, 2)
    }   
    
    gethk(){
        return this.h_k;
    }
}