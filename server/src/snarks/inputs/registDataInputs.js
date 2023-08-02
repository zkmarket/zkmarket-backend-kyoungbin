import fs from 'fs'
import Config from "../../config";
import mimc from "../../crypto/mimc";
import types, { hexStrToDec } from "../../utils/types";
import math from "../../utils/math";
import Encryption from "../../crypto/encryption";
import CurveParam from "../../crypto/curveParam";
import FileSystem, { rawFileToBigIntString } from "../../utils/file";
import { hexToDec } from '../../contracts/utils';


export default class RegistDataSnarkInputs {
    data     = null;
    addr_peer= null;
    h_k      = null;
    h_ct     = null;
    CT_data  = null;
    CT_r     = null;
    dataEncKey = null;

    constructor(EC_TYPE=Config.EC_TYPE){ 
        this.curveParam = CurveParam(EC_TYPE);
    }

    uploadDataFromFilePath(filePath){
        try {
            const utf8buf = fs.readFileSync(filePath);
            const hexStr = rawFileToBigIntString(utf8buf).padEnd(
                Config.textFileByteLen*2, "0"
            );
            this.uploadDataFromHexStr(hexStr);
        } catch (error) {
            console.log(error)
            return error
        }
    }

    uploadDataFromStr(str){
        const utf8buf = Buffer.from(str, 'utf-8');
        const hexStr = rawFileToBigIntString(utf8buf).padEnd(
            Config.textFileByteLen*2, "0"
        );
        this.uploadDataFromHexStr(hexStr);
    }

    uploadDataFromHexStr(hexStr){
        const hexStrPad = hexStr.padEnd(Config.dataBlockNum * CurveParam().blockBytes * 2, '0');
        this.uploadData(FileSystem.hexStringToBigIntArr(hexStrPad));
    }

    uploadData(data){
        try{
            this.checkData(data)
        }
        catch(err){
            console.log(err.message);
            return;
        }
        this.data = data;
    }

    uploadAddrPeer(addr_peer){
        this.addr_peer = addr_peer;
    }

    uploadsCTdataAndEncKey(sCTdata, dataEncKey){
        this.dataEncKey = dataEncKey.toString();
        this.CT_r    = sCTdata.r;
        this.CT_data = sCTdata.ct;
    }

    encryptData() {
        if(this.CT_data != null || this.CT_r != null){
            throw new Error("CT is already exsist");
        }
        const dataEncKey = types.decStrToHex( math.randomFieldElement(this.curveParam.prime));
        const symEnc = new Encryption.symmetricKeyEncryption(dataEncKey);
        const sCTdata = symEnc.EncData(this.data);
        this.uploadsCTdataAndEncKey(sCTdata, dataEncKey);
    }

    makeSnarkInput(){
        if (
            this.dataEncKey == null || 
            this.CT_data    == null || 
            this.addr_peer  == null ||
            this.data       == null
        ){ throw new Error("data is not prepared"); }
        const mimc7 = new mimc.MiMC7();
        this.h_k    = mimc7.hash(this.addr_peer, this.dataEncKey).toLocaleLowerCase();
        this.h_ct   = this.hashArr(this.CT_data);
    }

    getsCtData(){
        return new Encryption.sCTdata(this.CT_r, this.CT_data).toJson();
    }

    getEncKey(){
        return this.dataEncKey;
    }

    gethCt(){
        return this.h_ct;
    }
    
    gethK(){
        return this.h_k.toLocaleLowerCase();
    }
    
    toSnarkInputFormat(){
        if( this.dataEncKey == null || 
            this.CT_data == null ||
            this.addr_peer == null ||
            this.data ==null
        ){ throw new Error("param is not prepared"); }
        
        const snarkInput = {
            "h_k"       : this.h_k,
            "h_ct"      : this.h_ct,
            "dataEnckey": this.dataEncKey,
            "addr_peer" : this.addr_peer,
            "data"      : {},
            "CT_data"   : {},
            "CT_r"      : this.CT_r,
        };
        for(let i=0; i<Number(Config.dataMaxBlockNum); i++){
            snarkInput["data"][i]  = this.data[i];
            snarkInput["CT_data"][i]= this.CT_data[i];
        }
        // console.log(snarkInput);
        return JSON.stringify(snarkInput);
    }

    // Input of smart contract
    toSnarkVerifyFormat(){
        if(
            this.addr_peer == null ||
            this.h_ct   == null ||
            this.h_k    == null 
        ){ return null;}
        
        let snarkInputs = ['1']
        
        // if(this.addr_peer.slice(0,2) != '0x'){
        //     snarkInputs.push('0x' + this.addr_peer);
        // }
        // else{
        //     snarkInputs.push(this.addr_peer);
        // }

        

        // if(this.h_k.slice(0,2) != '0x'){
        //     snarkInputs.push('0x' + this.h_k);
        // }
        // else{
        //     snarkInputs.push(this.h_k);
        // }

        // if(this.h_ct.slice(0,2) != '0x'){
        //     snarkInputs.push('0x' + this.h_ct);
        // }
        // else{
        //     snarkInputs.push(this.h_ct);
        // }

        snarkInputs.push(hexToDec(this.addr_peer))
        snarkInputs.push(hexToDec(this.h_k))
        snarkInputs.push(hexToDec(this.h_ct))

        return snarkInputs;
    }

    hashArr(arr){
        const mimc7 = new mimc.MiMC7();
        for(let i=0; i<arr.length; i++){
            mimc7.hashUpdate(arr[i]);
        }
        return mimc7.hashGetOuptut();
    }

    checkData(data){
        const error = Error("data format Error");
        if (!Array.isArray(data)) {
            throw error;
        }
        if (data.length != Config.dataMaxBlockNum){
            throw error;
        }
        for(let i=0; i<Config.dataMaxBlockNum; i++){
            if(! types.isBigIntFormat(data[i])){
                throw error;
            }
        }
    }
}