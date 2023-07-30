import _ from "lodash";
import db from "../db";
import web3 from "../contracts/web3";
import wallet from "../wallet";
import Config, { dbPath } from "../config";

/* 
    send Info list :  
            addrDel, 
            addrPeer, 
            pkEncPeer, 
            hK, 
            feeDel, 
            feePeer 
*/
export const getContentListController = async (req, res) => {
    console.log("getContentListController")

    const dataInfoList = await db.data.getAllDataInfo();
    if(dataInfoList == undefined) return res.send([]);
    console.log('dataInfoList : ', dataInfoList);

    // const formData = new FormData();
    const contentList = []

    for(let i=0; i<dataInfoList.length; i++){
        contentList.push(toFrontFormat(dataInfoList[i]))
    }
    console.log(contentList)
    res.send(contentList);
}

export const getImgController = async (req, res) => {
    const filePath = dbPath+'image/'+req.params.imgName 

    res.sendFile(filePath)
}

const toFrontFormat = (data) => {
    return {
        title : _.get(data, 'title'),
        description : _.get(data, 'descript'),
        addrPeer : _.get(data, 'addr_'),
        addrDel  : wallet.delegateServerKey.pk.ena,
        pkEnc : _.get(data, 'pk_enc'),
        author : _.get(data, 'author'),
        hK : _.get(data, 'h_k'),
        img_path : 'http://127.0.0.1:10801/content/img/' + _.get(data, 'cover_path'),
        fee : _.get(data, 'fee'),
    }
}

export default {
    getContentListController
}