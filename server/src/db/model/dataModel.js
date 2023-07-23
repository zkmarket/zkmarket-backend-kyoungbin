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
        addr_,
        eoa,
        h_k,
        h_ct,
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
                    'eoa',
                    'h_k',
                    'h_ct',
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
                    eoa,
                    h_k,
                    h_ct,
                    enc_key,
                    data_path,
                    cover_path,
                    addr_
                ]
            );
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
            const ret = this.SELECT(
                ['*'],
                this.tableName,
                {
                    'key' : type,
                    'value' : value
                }
            )
        } catch (error) {
            console.log(error);
            return undefined
        }
    }
}