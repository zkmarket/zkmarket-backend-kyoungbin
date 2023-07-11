import _ from 'lodash'
import { hexStrToDec, hexToInt } from "../../utils/types";
import Encryption from "../../crypto/encryption";
import CoinCommitment from './cm';

export default class GenTradeSnarkInputs{
    /**
     * 
     * @param {PublicKey} PublicKey_peer 
     * @param {PublicKey} PublicKey_del 
     * @param {PublicKey} PublicKey_cons 
     * @param {sCT} ENA 
     * @param {sCT} ENA_ 
     * @param {String} k_ena 
     * @param {String} h_k 
     */
    constructor(
        pk_enc_peer,
        addr_peer,
        pk_enc_cons,
        addr_del,
        ENA,
        ENA_,
        k_ena,
        h_k,
        fee_peer,
        fee_del
    ){
        
        // this.PublicKey_cons = PublicKey_cons
        // this.PublicKey_peer = PublicKey_peer
        // this.PublicKey_del  = PublicKey_del

        this.addr_peer   = addr_peer
        this.addr_del    = addr_del
        this.pk_enc_peer = pk_enc_peer
        this.pk_enc_cons = pk_enc_cons

        // this.pk_own_peer = pk_own_peer
        // this.pk_own_cons = pk_own_cons
        // this.pk_own_del  = pk_own_del

        this.ENA = ENA
        this.ENA_= ENA_
        this.h_k = h_k
        this.k_ena = k_ena
        this.fee_del  =  fee_del
        this.fee_peer =  fee_peer

        this.init()
    }

    init() {

        const symEnc = new Encryption.symmetricKeyEncryption(this.k_ena);
        const pubEnc = new Encryption.publicKeyEncryption()
        // console.log(symEnc.Dec(this.ENA),)
        // console.log(symEnc.Dec(this.ENA_), )
        // console.log('fee : ', fee.toString(10))

        console.log('before ENA : ', symEnc.Dec(this.ENA))
        console.log('after ENA_ : ', symEnc.Dec(this.ENA_), hexToInt(symEnc.Dec(this.ENA)) - hexToInt(symEnc.Dec(this.ENA_)))    

        const [cm, rand] = CoinCommitment.genCm(
            this.addr_peer,
            this.addr_del,
            this.pk_enc_cons,
            this.fee_peer,
            this.fee_del,
            this.h_k
        )
        
        this.cm_del = cm.cm_del
        this.cm_own = cm.cm_own
        this.r_cm = rand
        
        const [pct, r_enc, k_enc]= pubEnc.Enc(
            new Object({ pkEnc : this.pk_enc_peer }), 
            this.pk_enc_cons,
            this.r_cm,
            this.fee_peer,
            this.fee_del,
            this.h_k
        )
        const pctList = pct.toList();
        console.log('g_r : ',(pctList[0]))
        this.g_r = pctList[0];
        this.c1  = pctList[1];
        this.CT_cons = pctList.slice(2);
        this.r_enc = r_enc
        this.k_enc = k_enc
    }

    toJson(){
        return JSON.stringify(this, null, 2)
    }

    toSnarkInputFormat(){
        const json = JSON.parse(JSON.stringify(this, null, 2))
        json.ENA = this.ENA.toList()
        json.ENA_= this.ENA_.toList()
        return JSON.stringify(json, null, 2)
    }

    toSnarkVerifyFormat(){
        let contractInputs = [
            "1",
            this.g_r, 
            this.c1,
            this.cm_own,
            this.cm_del,
        ]
        contractInputs = _.union(contractInputs, this.ENA.toList())
        contractInputs = _.union(contractInputs, this.ENA_.toList())
        // contractInputs = _.union(contractInputs, [this.fee_del, this.fee_own])
        contractInputs = _.union(contractInputs, this.CT_cons)

        for(let i=0; i<contractInputs.length; i++){
            contractInputs[i] = hexStrToDec(contractInputs[i])
        }
        // console.log("contractInputs : ", contractInputs)
        return contractInputs;
    }

    gethk(){
        return this.h_k
    }
}