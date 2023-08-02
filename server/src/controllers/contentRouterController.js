import _ from "lodash";
import fs from 'fs';
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
    console.log('getContentListController')
    console.log(req.query)

    const sk_enc = _.get(req.query, 'sk_enc');
    const pk_enc = _.get(req.query, 'pk_enc');
    
    let dataInfoList = []
    if(pk_enc == undefined) {  dataInfoList = await db.data.getAllDataInfo(); }
    else {
        for (const[i,e] of (await db.trade.SELECT_TRADE({buyer_pk : pk_enc})).entries()){
            dataInfoList.push(
                await db.data.getDataInfo(
                    'h_k',
                    _.get(e, 'h_k')
                )
            )
        }
    }

    if(dataInfoList == undefined) return res.send([]);
    // console.log('dataInfoList : ', dataInfoList);

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

export const getDataController = async (req, res) => {
    console.log('getDataController')
    console.log(req.params)

    const flag = await db.trade.IS_VALID_TRADE(
        {
            h_k : _.get(req.params, 'h_k'), 
            pk_enc : _.get(req.params, 'pk_enc')
        }
    )
    console.log(flag)

    const dataPath =_.get((await db.data.getDataPath(_.get(req.params, 'h_k'))), 'data_path')
    console.log(dataPath, flag)
    
    if(dataPath && flag){
        const fileData = fs.readFileSync(
            dataPath, 'utf-8'
        )
        console.log(_.get(JSON.parse(fileData), 'text'))
        return res.send(fileData)
    }

    res.send('');
}

export const toFrontFormat = (data) => {
    if(data == undefined) return '';
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