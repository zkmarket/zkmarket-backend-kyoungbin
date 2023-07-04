import _ from 'lodash'
import path from 'path'
import multer from 'multer'

import Config, { dbPath } from '../config'


export const uploadMiddleware = multer({
    storage : multer.diskStorage({
        destination : (req, file, cb) => {
            cb(null, dbPath+'image/')
        },
        filename : (req, file, cb) => {
            console.log(req.body)
            console.log(file, typeof file)
            const fileName = _.get(req.body, 'h_ct').replace('0x', '') + path.extname(_.get(file, 'originalname'))
            console.log(fileName)
            cb(null, fileName)
        },
    }),
    fileFilter : (req, file, cb) => {
        console.log("request : ",req)
        console.log(req.file, file)
        console.log(req.body, JSON.stringify(req.body))
        if(_.get(req.body, 'h_ct') === undefined ){
            return cb(new Error('h_ct is undefined'), null)
        }
        return cb(null, true)
    },
})

export const uploadController = (req, res) => {
    console.log(req.body)
    res.send(true)
}

export default {
    uploadMiddleware,
    uploadController
}