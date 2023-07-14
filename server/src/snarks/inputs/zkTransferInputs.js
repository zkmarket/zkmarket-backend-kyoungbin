import { getContractFormatProof } from "../../contracts/utils";
import types from "../../utils/types";

export default class ZkTransferSnarkInputs {
    /**
     *
     * @param {Object}                  keys            The object of keys { auditor.pk, sender.sk, sender.pk, receiver.pk }
     * @param {Object}                  ciphertexts     The object of ciphertext { oldsCT, newsCT, newpCT }
     * @param {Object}                  merkleTreeData  The object of merkleTreeData { root, intermediateHashes, index }. Refer - src/services/client/merkleTreeData
     * @param {Object}                  nullifier       The nullifier, hexadecimal string
     * @param {Object}                  commitments     The object of commitments { oldCm, newCm }
     * @param {Object}                  opens           The object of openings { oldOpen, newOpen }
     * @param {Object}                  balance         The object of some balance type { pocket, oldCmBal }
     * @param {Object}                  aux             The object of auxiliary data related with encryption scheme  {  newR, newK }
     */
    constructor(
        keys,
        ciphertexts,
        merkleTreeData,
        nullifier,
        commitments,
        opens,
        balance,
        aux) {
        this.keys = keys;
        this.ciphertexts = ciphertexts;
        this.merkleTreeData = merkleTreeData;
        this.nullifier = nullifier;
        this.commitments = commitments;
        this.opens = opens;
        this.balance = balance;
        this.aux = aux;
    }

    toJson() {
        return JSON.stringify(this, null, 2);
    }

    toSnarkInputFormat() {
        console.log("this.ciphertexts.newpCT : ", this.ciphertexts.newpCT)
        const input = {
            'CT': {
                '0': this.ciphertexts.newpCT.c3[0],
                '1': this.ciphertexts.newpCT.c3[1],
                '2': this.ciphertexts.newpCT.c3[2],
            },
            'G_r': this.ciphertexts.newpCT.c0.toJson(),
            'K_a': this.ciphertexts.newpCT.c2.toJson(),
            'K_u': this.ciphertexts.newpCT.c1.toJson(),
            'addr': this.keys.sender.pk.ena,
            'addr_r': this.keys.receiver.pk.ena,
            'apk': this.keys.auditor.pk.toJson(),
            'cm': this.commitments.oldCm,
            'cm_': this.commitments.newCm,
            'direction': this.merkleTreeData.direction,
            'du': this.opens.oldOpen,
            'du_': this.opens.newOpen,
            'dv': types.padZeroHexString(this.balance.oldCmBal),
            'dv_': types.padZeroHexString(this.balance.pocket.privBal),
            'intermediateHashes': this.merkleTreeData.toIntermediateHashesJson(),
            'k': this.aux.newK.toJson(16),
            'k_b': this.keys.sender.pk.pkOwn,
            'k_b_': this.keys.receiver.pk.pkOwn,
            'k_u': this.keys.sender.pk.pkEnc.toJson(),
            'k_u_': this.keys.receiver.pk.pkEnc.toJson(),
            'pv': types.padZeroHexString(this.balance.pocket.pubInBal),
            'pv_': types.padZeroHexString(this.balance.pocket.pubOutBal),
            'r': this.aux.newR,
            'rt': this.merkleTreeData.root,
            'sk': this.keys.sender.sk,
            'sn': this.nullifier,
        };

        // If Fungible Token Transfered
        if (this.ciphertexts.oldsCT && this.ciphertexts.newsCT) {
            input['cin'] = {
                '0': this.ciphertexts.oldsCT.r,
                '1': this.ciphertexts.oldsCT.ct,
            };
            input['cout'] = {
                '0': this.ciphertexts.newsCT.r,
                '1': this.ciphertexts.newsCT.ct,
            };
        }

        return JSON.stringify(input, null, 2);
    }

    static fromJson(libsnarkInputJson) {
        let dataJson = JSON.parse(libsnarkInputJson);
        return new SnarkInput(
            dataJson.keys,
            dataJson.ciphertexts,
            dataJson.merkleTreeData,
            dataJson.nullifier,
            dataJson.commitments,
            dataJson.opens,
            dataJson.balance,
            dataJson.aux,
        );
    }

    toSnarkVerifyFormat(toEoA, tokenAddress) {
        let hexProof = []
        getContractFormatProof(this.commitments.oldCm, 'ZKlay').forEach((e) =>{
            hexProof.push(types.addPrefixAndPadHex(BigInt(e).toString(16)))
        })
        const args = [
            hexProof,
            [
            types.addPrefixAndPadHex(this.merkleTreeData.root),
            types.addPrefixAndPadHex(this.nullifier),
            types.addPrefixAndPadHex(this.keys.sender.pk.ena),
            types.addPrefixAndPadHex(this.keys.sender.pk.pkOwn),
            ...types.addPrefixAndPadHexFromArray([
                types.addPrefixAndPadHex(this.keys.sender.pk.pkEnc.x.toString(16)),
                types.addPrefixAndPadHex(this.keys.sender.pk.pkEnc.y.toString(16)),
            ]),
            types.addPrefixAndPadHex(this.commitments.newCm),
            ...types.addPrefixAndPadHexFromArray(Object.values(this.ciphertexts.newsCT)),
            types.addPrefixAndPadHex(this.balance.pocket.pubInBal),
            types.addPrefixAndPadHex(this.balance.pocket.pubOutBal),
            ...types.addPrefixAndPadHexFromArray(this.ciphertexts.newpCT.toList()),
            ],
            toEoA,
            tokenAddress,
        ]
        return args
    }
}


