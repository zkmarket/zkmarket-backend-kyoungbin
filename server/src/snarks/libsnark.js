import fs from 'fs';
// import Config, {fileStorePath, snarkPath, crsPath} from "../utils/config.js";
import Config, {crsPath, snarkPath} from '../config.js';
import { SnarkLib, SnarkLibUtils } from "./js-libsnark-opt/libsnark.interface.js";

export const CircuitType = ["RegistData", "GenTrade", "AcceptTrade"];

export default class LibSnark {
    constructor(circuitType, verify=false){
        if(!circuitType in CircuitType){return undefined;}
        this.type = verify ?  "verifier" : "prover" ;
        this.CircuitType = circuitType;

        this.pk_file_path = strToBuf(crsPath+this.CircuitType+'_crs_pk.dat')
        if(verify){this.vk_file_path = strToBuf(crsPath+this.CircuitType+'_crs_vk.dat')}
        const circuit_type_buf = strToBuf(this.CircuitType, 30);

        
        this.contextId = SnarkLib.createCircuitContext(
            circuit_type_buf, 
            Number(Config.R1CS_GG),
            Number(Config.EC_ALT_BN128),
            null, null, null
        );

        SnarkLib.serializeFormat(this.contextId, Number(Config.serializeFormat));
        SnarkLib.buildCircuit(this.contextId); // 5초
        
        if(verify) SnarkLib.readVK(this.contextId,this.vk_file_path)
        else SnarkLib.readPK(this.contextId, this.pk_file_path);
        // this.getLastFunctionMsg();
    }

    uploadInputJsonStr(snarkInputJson){
        // const snarkInputJsonStr = JSON.stringify(snarkInputJson);
        const buf=Buffer.alloc(snarkInputJson.length*2); buf.write(snarkInputJson); 
        SnarkLib.updatePrimaryInputFromJson(this.contextId, buf);
    }

    runProof(proofId = ""){
        SnarkLib.runProof(this.contextId); 
        SnarkLibUtils.write_proof_json(this.contextId, snarkPath+this.CircuitType+proofId+'_proof.json');

        // const proof_file_path = Buffer.alloc(300); proof_file_path.write(fileStorePath+this.CircuitType+proofId+'_proof.dat');
        // SnarkLib.writeProof(this.contextId, proof_file_path);
    }

    uploadInputAndRunProof(snarkInputJson, proofId=""){
        this.uploadInputJsonStr(snarkInputJson);
        this.runProof(proofId);
    }

    verifyProof(snarkInputJson, proofId=""){
        if(this.type === "prover"){return undefined;}
        SnarkLibUtils.load_proof_json(
            this.contextId,
            snarkPath+this.CircuitType + proofId + "_proof.json"
        )
        this.uploadInputJsonStr(snarkInputJson);
        const verResult = SnarkLib.runVerify(this.contextId);
        return verResult;
    }

    getLastFunctionMsg(){
        console.log(SnarkLib.getLastFunctionMsg(this.contextId));
    }

    getProofJson(proofId = "") {
        try {
            const proofJson = fs.readFileSync(
                snarkPath + this.CircuitType + proofId + "_proof.json", 
                {encoding: "utf-8"}
            );
            console.log(proofJson)
            return proofJson;
        } catch (e) {
            console.log(e, "getProofJson Error !!");
            return undefined;
        }
    }
}

export class ZkTransferLibsnark{
    contextId = 0;
    circuitName = 'ZKlay';
    serializeFormat = 'SERIALIZE_FORMAT_ZKLAY';
    treeHeight = '32';
    hashType = 'MiMC7';
    ecSelection = Config.EC_ALT_BN128;
    
    constructor(circuitName='ZKlay', treeHeight = '32', hashType = 'MiMC7', serializeFormat = 'SERIALIZE_FORMAT_ZKLAY') {
        this.circuitName = circuitName;
        this.treeHeight = treeHeight;
        this.hashType = hashType;
        this.serializeFormat = serializeFormat;

        this.contextId = SnarkLib.createCircuitContext(
            strToBuf(this.circuitName), 
            Number(Config.R1CS_GG),
            Number(Config.EC_ALT_BN128),
            null, null, null
        );
        console.log('zktransfer contextId : ', this.contextId, typeof(this.contextId))
        
        SnarkLib.serializeFormat(this.contextId, Number(Config.serializeFormat))
        SnarkLib.assignCircuitArgument(this.contextId, strToBuf('treeHeight'), strToBuf(this.treeHeight));
        SnarkLib.assignCircuitArgument(this.contextId, strToBuf('hashType'), strToBuf(this.hashType));
        SnarkLib.buildCircuit(this.contextId);
        
        SnarkLib.readPK(this.contextId, strToBuf(crsPath+this.circuitName+'_crs_pk.dat'));
    }

    uploadInputJsonStr(snarkInputJsonStr){
        const buf=strToBuf(snarkInputJsonStr, snarkInputJsonStr.length*2);
        SnarkLib.updatePrimaryInputFromJson(this.contextId, buf);
    }

    runProof(proofId = ""){
        SnarkLib.runProof(this.contextId); 
        SnarkLibUtils.write_proof_json(this.contextId, snarkPath+this.circuitName+proofId+'_proof.json');
    }

    uploadInputAndRunProof(snarkInputJsonStr, proofId=""){
        this.uploadInputJsonStr(snarkInputJsonStr);
        this.runProof(proofId);
    }

    getLastFunctionMsg(){
        console.log(SnarkLib.getLastFunctionMsg(this.contextId));
    }
}

const strToBuf = (str, size=256) => {
    const buf = Buffer.alloc(size);
    buf.write(str);
    return buf;
}