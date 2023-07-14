/* global BigInt */
import curve from './curve.js';
import math from '../utils/math.js';
import mimc from './mimc.js';
import types from '../utils/types.js';
import constants from '../utils/constants.js';
import CurveParam from './curveParam.js';
import Config from '../config.js';

class sCT {
    /**
     * 
     * @param {string}      r       In the symmetric key encryption, used random value | hexadecimal string
     * @param {string}      ct      The ciphertext | hexadecimal string
     */
    constructor(r, ct) {
        this.r = r;
        this.ct = ct;
    }

    toJson() { return JSON.stringify(this); }
    toList() { return [ this.r, this.ct ]; }

    static fromJson(sCTJson) {
        let dataJson = JSON.parse(sCTJson);
        return new sCT(
            dataJson.r,
            dataJson.ct
        );
    }

    empty() {
        return this.ct === '0' && this.r === '0';
    }
}

class sCTdata {
    /**
     * 
     * @param {string Array} ct   // size == dataBlockNum
     */
    constructor(r, ct){
        this.r  = r;
        this.ct = ct;
        this.blockNum = Number(Config.dataMaxBlockNum);
    }

    toJson() { return JSON.stringify(this); }

    static fromJson(sCTctrJson){
        let dataJson = JSON.parse(sCTctrJson);
        return new sCTdata(
            dataJson.r,
            dataJson.ct
        );
    }

    empty(){
        let zero = 0;
        let emptyData = new Array();
        for (let i=0; i<this.dataMaxBlockNum ; i++){
            emptyData.push(zero.toString(16));
        }
        return this.ct === zero, this.r === '0';
    }
}

// 1 block 31 byte
class symmetricKeyEncryption{
    /**
     * 
     * @param {string}      privKey     The user's private key | hexadecimal string
     */
    constructor(privKey){
        let cvParam = CurveParam(Config.EC_TYPE);
        this.prime = cvParam.prime;
        this.privKey = privKey;
        this.dataMaxBlockNum = Number(Config.dataMaxBlockNum);
    }

    /**
     *
     * @param msg
     * @return {sCT}
     * @constructor
     */
    Enc(msg){
        let mimc7 = new mimc.MiMC7();
        let r = math.randomFieldElement(this.prime).toString(16);
        let intMsg = types.hexToInt(msg);
        let intHashed = types.hexToInt(mimc7.hash(this.privKey.toString(16), r));
        let ct = math.mod(intMsg + intHashed, this.prime).toString(16);

        return new sCT(r, ct);
    }
    
    /**
     * 
     * @param data : hexString Array
     * 
     * ct[i] = m[i] + H(sk+i || r)
     */
    EncData(data){
        if(data.length != this.dataMaxBlockNum){
            return false;
        }
        let mimc7 = new mimc.MiMC7();
        let r = math.randomFieldElement(this.prime).toString(16);
        let intDataTmp, intHashedTmp;
        let ct = [];
        
        for(let i=0; i<this.dataMaxBlockNum; i++){
            intDataTmp   = types.hexToInt(data[i]);
            intHashedTmp = types.hexToInt(mimc7.hash(
                ( types.hexToInt(this.privKey) + BigInt(i) ).toString(16),
                r
            ));
            ct.push( math.mod(intDataTmp + intHashedTmp, this.prime).toString(16) );
        }
    
        return new sCTdata(r, ct);
    }

    /**
     *
     * @param sct
     * @return {string}
     * @constructor
     */
    Dec(sct){
        let mimc7 = new mimc.MiMC7();
        let intCT = types.hexToInt(sct.ct);
        let intHashed = types.hexToInt(mimc7.hash(this.privKey, sct.r));
        return math.mod(intCT - intHashed, this.prime).toString(16);
    }

    DecData(sct){
        let mimc7 = new mimc.MiMC7();
        let data = []
        for(let i=0; i<this.dataMaxBlockNum; i++){
            let intCT = types.hexToInt(sct.ct[i]);
            let intHashed = types.hexToInt(mimc7.hash(
                ( types.hexToInt(this.privKey) + BigInt(i) ).toString(16),
                sct.r
            ));
            data.push( math.mod(intCT-intHashed, this.prime).toString(16) );
        }
        return data;
    }
}


class pCT {
    /**
     * 
     * @param {string}      c0      The ciphertext G^r
     * @param {string}      c1      The ciphertext k*(pk_1)^r
     * @param {string}      c2      The ciphertext SE.Enc_k(msg)
     */
    constructor(c0, c1, c2) {
        this.c0 = c0;
        this.c1 = c1;
        this.c2 = c2;
    }

    toJson() { return JSON.stringify(this); }

    static fromJson(pCTJson) {
        let dataJson = JSON.parse(pCTJson);
        return new pCT(
            dataJson.c0,
            dataJson.c1,
            dataJson.c2
        );
    }

    toList() {
        return [ this.c0, this.c1, ... this.c2 ];
    }
}

class AzerothpCT {
    /**
     *
     * @param {AffinePoint}      c0      The ciphertext G^r
     * @param {AffinePoint}      c1      The ciphertext k*(pk_1)^r
     * @param {AffinePoint}      c2      The ciphertext k*(pk_2)^r
     * @param {string[]}    c3      The ciphertext SE.Enc_k(msg)
     */
    constructor(c0, c1, c2, c3) {
        this.c0 = (c0.toHexArray) ? c0 : new curve.AffinePoint(c0.x, c0.y);
        this.c1 = (c1.toHexArray) ? c1 : new curve.AffinePoint(c1.x, c1.y);
        this.c2 = (c2.toHexArray) ? c2 : new curve.AffinePoint(c2.x, c2.y);
        this.c3 = c3;
    }
    toJson() { return JSON.stringify(this); }

    static fromJson(pCTJson) {
        let dataJson = JSON.parse(pCTJson);

        return new pCT(
            dataJson.c3
        );
    }

    toList() {
        return [...this.c0.toHexArray(), ...this.c1.toHexArray(), ...this.c2.toHexArray(), ...this.c3];
    }
}

class publicKeyEncryption {
    constructor(){
        this.EC_TYPE = Config.EC_TYPE;
        let cvParam = CurveParam(this.EC_TYPE);
        this.prime = cvParam.prime;
    }

    /**
     * 
     * @param {string}     apk     Auditor's public key
     * @param {{ena: string, pkOwn: string, pkEnc: string}}      upk     User's public key
     * @param  {...string}          msg     The plaintext | hexadecimal string type
     * @returns 
     */
    Enc(upk, ...msg) {
        // console.log(this.prime)
        let r = math.randomFieldElement(constants.SUBGROUP_ORDER);
        let k = math.randomFieldElement(this.prime);
        let c0 = curve.basePointMul(r).x.toString(16);
        let c1 = math.mod(k * curve.multscalar(types.hexToInt(upk.pkEnc), r), this.prime).toString(16);
        let c2 = (() => {
            let ret = [];
            let mimc7 = new mimc.MiMC7();
            for(const [i, e] of msg.entries()){
                let hashInput = (k + BigInt(i.toString(10))).toString(16); 
                let hashed = types.hexToInt(mimc7.hash(hashInput));
                ret.push(
                    math.mod(types.hexToInt(e) + hashed,this.prime).toString(16)
                );
            }
            return ret;
        })();
        r = r.toString(16); k = k.toString(16);
        return [new pCT( c0, c1, c2 ), r, k];
    }

     /**
     *
     * @param {string}     apk     Auditor's public key
     * @param {{ena: string, pkOwn: string, pkEnc: string}}      upk     User's public key
     * @param  {...string}          msg     The plaintext | hexadecimal string type
     * @returns
     */
    AzerothEnc(apk, upk, ...msg) {
        let Curve = new curve.MontgomeryCurve(new CurveParam(Config.EC_TYPE));
        let r = math.randomFieldElement(constants.SUBGROUP_ORDER);
        let k = math.randomFieldElement(constants.SUBGROUP_ORDER);
        let curveK = curve.basePointMul(k);

        let curvePk = Curve.computeScalarMul(upk.pkEnc, r);
        let curveApk = Curve.computeScalarMul(apk, r);

        let c0 = curve.basePointMul(r);
        let c1 = Curve.addAffinePoint(curveK, curvePk);
        let c2 = Curve.addAffinePoint(curveK, curveApk);

        let c3 = (() => {
            let ret = [];
            let mimc7 = new mimc.MiMC7();
            for (const [i, e] of msg.entries()) {
                let hashInput = (curveK.x + BigInt(i.toString(10))).toString(16);
                let hashed = types.hexToInt(mimc7.hash(hashInput));
                ret.push(
                    math.mod(types.hexToInt(e) + hashed, this.prime).toString(16)
                );
            }
            console.log("Azeroth ENC : ", ret)
            return ret;
        })();
        r = r.toString(16); k = curveK;
        return [new AzerothpCT(c0, c1, c2, c3), r, k];
    }

    /**
     * 
     * @param {pCT}         pct         The cihpertext of public key encryption 
     * @param {string}      privKey     The user's private key or auditor's private key | hexadecimal string
     * @returns 
     */
    Dec( pct, privKey ) {
        let mimc7 = new mimc.MiMC7();
        let denom = curve.multscalar(
            types.hexToInt(pct.c0),
            types.hexToInt(privKey)
        );
        denom = math.modInv(denom, this.prime);
        let encKey =  types.hexToInt(pct.c1); 
        
        let key = math.mod((encKey * denom), this.prime);
        return (() => {
            let ret = [];
            for(const [i, e] of pct.c2.entries()){
                let hashInput = (key + BigInt(i.toString(10))).toString(16);
                let hashed = types.hexToInt((mimc7.hash(hashInput)));
                ret.push(
                    math.mod(types.hexToInt(e) - hashed,this.prime).toString(16)
                );
            }
            return ret;
        })();
    }
}

const Encryption = {
    sCTdata,
    sCT,
    symmetricKeyEncryption,
    pCT,
    publicKeyEncryption
};

export default Encryption;