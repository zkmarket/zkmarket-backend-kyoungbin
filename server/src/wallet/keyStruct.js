import _ from 'lodash';
import math from '../utils/math.js'
import constants from '../utils/constants.js';
import Curve from '../crypto/curve.js';
import mimc from '../crypto/mimc.js';
import types from '../utils/types.js';

class zkMarketKey {
    /**
     * @param {BigInt} sk : sk of Azeroth
     */
    constructor(sk){
        const mimc7 = new mimc.MiMC7()
        this.skEnc = mimc7.hash(sk.toString(16), types.asciiToHex('sk_enc'))
        this.pkEnc = Curve.basePointMul(types.hexToInt(this.skEnc))
    }
}

export default class UserKey {
    // ena : addr of azeroth hash( pk_own || pk_enc )
    // sk  : sk_enc sk_own of azeroth
    // skEncZkMarket : sk enc of data trade hash( sk || asciiToHex('sk') )
    // pkEncZkMarket : 
    constructor({ena, pkOwn, pkEnc}, sk){
        this.pk = {
            ena : ena,
            pkOwn : pkOwn,
            pkEnc : pkEnc
        };
        this.sk = sk;
        // this.marketKey = new zkMarketKey(sk);
    }

    toJson(){
        return JSON.stringify({
            ena   : this.pk.ena,
            pkOwn : this.pk.pkOwn,
            pkEnc : this.pk.pkEnc,
            sk      : this.sk,
        }, null, 2);
    }

    pubKeyToJson(){
        return JSON.stringify({
            ena   : this.pk.ena,
            pkOwn : this.pk.pkOwn,
            pkEnc : this.pk.pkEnc,
        });
    }

    static fromJson(userKeyJson) {
        const userKey = JSON.parse(userKeyJson);
        return new UserKey(
            {
                ena     : _.get(userKey, "ena"),
                pkOwn   : _.get(userKey, "pkOwn"),
                pkEnc   : _.get(userKey, "pkEnc")
            },
            _.get(userKey, "sk"),
        );
    }

    static keyGen() {
        const mimc7 = new mimc.MiMC7();

        const sk = math.randomFieldElement(constants.SUBGROUP_ORDER);
        const userPublicKey = {
            ena: null,
            pkOwn: mimc7.hash(sk.toString(16)),
            pkEnc: Curve.basePointMul(sk),
        };
        userPublicKey.ena = mimc7.hash(
            userPublicKey.pkOwn,
            userPublicKey.pkEnc.x.toString(16),
            userPublicKey.pkEnc.y.toString(16)
        );

        return new UserKey(userPublicKey, sk.toString(16));
    }

    static recoverFromUserSk(sk) {
        const mimc7 = new mimc.MiMC7();

        const skBigIntType = types.hexToInt(sk);
        console.log(skBigIntType, skBigIntType.toString(16))
        const userPublicKey = {
            ena: null,
            pkOwn: mimc7.hash(skBigIntType.toString(16)),
            pkEnc: Curve.basePointMul(skBigIntType),
        };
        userPublicKey.ena = mimc7.hash(
            userPublicKey.pkOwn,
            userPublicKey.pkEnc.x.toString(16),
            userPublicKey.pkEnc.y.toString(16)
        );

        return new upk(userPublicKey);
    }
}

export function recoverAddr(pkOwn, pkEnc) {
    const mimc7 = new mimc.MiMC7();
    return mimc7.hash(pkOwn, pkEnc);
}
