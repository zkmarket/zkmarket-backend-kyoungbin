import DBinterface from "../db.interface";

export default class tradeDB extends DBinterface {
    constructor() {
        super();
        this.tableName = "trade";
    }

    async INSERT_TRADE(
        {buyer_addr, buyer_sk, buyer_pk, title, h_k}
    ) {
        this.INSERT(
            this.tableName,
            [
                'buyer_addr',  'title', 'h_k', 'buyer_pk'
            ],
            [
                buyer_addr, title, h_k, buyer_pk.toLocaleLowerCase()
            ]
        )
    }

    async SELECT_TRADE({ buyer_sk, buyer_pk }){
        try {
            return (await this.SELECT(
                ['*'],
                this.tableName,
                {key: 'buyer_pk', value: buyer_pk.toLocaleLowerCase()}
            ))[0]
        } catch (error) {
            console.log(error)
        }
    }

    async IS_VALID_TRADE({pk_enc, h_k }) {
        try {
            console.log("IS_VALID_TRADE : ", pk_enc, h_k)
            const ret = await this.connection.execute(
                `SELECT * FROM ${this.tableName} WHERE buyer_pk="${pk_enc}" AND h_k="${h_k}";`,
            )
            return ret[0].length == 0 ? false : true;
        } catch (error) {
            console.log(error)
            return false
        }
    }

    async SELECT_ALL_TRADE(){
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