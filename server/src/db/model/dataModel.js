import DBinterface from "../db.interface";

export default class dataDB extends DBinterface {
    constructor() {
        super();
        this.tableName = "data";
    }

    async insertData(
        title,
        desc,
        author,
        pk_own,
        sk_enc,
        pk_enc,
        addr_,
        eoa,
        h_k,
        h_ct,
        fee,
        enc_key,
        data_path,
        cover_path = '',
    ) {
        try {
            const ret = await this.INSERT(
                this.tableName,
                [
                    'title',
                    'descript',
                    'author',
                    'pk_own',
                    'sk_enc',
                    'pk_enc',
                    'eoa',
                    'h_k',
                    'h_ct',
                    'fee',
                    'enc_key',
                    'data_path',
                    'cover_path',
                    'addr_'
                ],
                [
                    title,
                    desc,
                    author,
                    pk_own,
                    sk_enc,
                    pk_enc,
                    eoa,
                    h_k,
                    h_ct,
                    fee,
                    enc_key,
                    data_path,
                    cover_path,
                    addr_
                ]
            );
            console.log("insertData ret : ", ret)
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    }

    async getDataInfo(
        type,
        value
    ) {
        try {
            const ret = await this.SELECT(
                ['*'],
                this.tableName,
                {
                    'key' : type,
                    'value' : value
                }
            )
            if(ret[0].length == 0) return undefined;
            return ret[0][0];
        } catch (error) {
            console.log("getDataInfo ERROR : ", error);
            return undefined
        }
    }

    async getAllDataInfo() {
        try {
            const ret = await this.SELECT(
                ['*'],
                this.tableName,
            )
            if(ret[0].length == 0) return undefined;
            return ret[0];
        } catch (error) {
            console.log("getDataInfo ERROR : ", error);
            return undefined
        }
    }
}