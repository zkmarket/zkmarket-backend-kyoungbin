import Encryption from "../crypto/encryption";
import mimc from "../crypto/mimc"
import math from "../utils/math";
import { decStrToHex } from "../utils/types";

const makeZkTransferInputs = async (

) => {
    const penc = new Encryption.publicKeyEncryption()
}

export const makeNullCm = (senderAddr) => {
    const mimc7 = new mimc.MiMC7();

    const o = math.randomFieldElement().toString(16)
    const cmBal = BigInt('0').toString(16);
    const cm = mimc7.hash(o, cmBal, senderAddr);
    const idx = 0;
    return [o, cm, cmBal, idx]
}

export const makeSn = (cm, sk) => {
    const mimc7 = new mimc.MiMC7();
    return mimc7.hash(cm, sk)
}

export const decArrToHexArr = (decArr) => {
    let hexArr = []
    decArr.forEach(e => {
        hexArr.push(decStrToHex(e))
    })
    return hexArr
}