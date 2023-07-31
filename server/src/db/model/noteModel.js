import _ from 'lodash'
import DBinterface from "../db.interface";

export default class noteDB extends DBinterface {
    constructor() {
        super();
        this.tableName = "notes";
    }

    /**
     * 
     *  {
            note_idx, 
            sk_enc, 
            open_key, 
            user_addr, 
            bal, 
            cm, 
            tokenAddress 
        }
     * 
     */
    async INSERT_NOTE(
       note
    ) {
        try{
            let keys = Object.keys(note);
            let values = keys.map((key) => note[key]);

            console.log('keys : ', keys)
            console.log('values : ', values)

            const ret = await this.INSERT(
                this.tableName,
                keys, values
            )
            return ret;
        } catch (err) {
            console.log(err);
            return false;
        }
    }

    async INSER_NOTES(
        ...notes
    ){  
        for(const [idx, note] of notes.entries()){
            try {
                await this.INSERT_NOTE(note)    
            } catch (error) {
               console.log(error); 
            }
        } 
    }

    async UPDATE_NOTE_toRead(
        note_idx_arr
    ) {
        for(const [i, e] of note_idx_arr.entries()){
            try {
                await this.UPDATE(
                    this.tableName,
                    ['is_read'],
                    [1],
                    ['note_idx'],
                    [e]
                )
            } catch (error) {
                console.log(error);
            }
        }
    }

    async SELECT_NOTE_UNREAD(sk_enc){
        const query = `SELECT * FROM ${this.tableName} WHERE (is_read IS NULL OR is_read = 0) AND sk_enc = '${sk_enc}'`;
        const ret = await this.connection.execute(query + ';');
        console.log('SELECT_NOTE_UNREAD : ', ret[0])
        return ret[0]
    }

    async SELECT_NOTE_UNREAD_AND_UPDATE(sk_enc){
        const ret = await this.SELECT_NOTE_UNREAD(sk_enc);

        await this.UPDATE_NOTE_toRead(
            getNoteIdxArr(ret)
        )
        return ret
    }
    
}

const getNoteIdxArr = (queryRet) => {
    let tmp = []
    for(const [i,e] of queryRet.entries()){
        tmp.push(_.get(e, 'note_idx'))
    }
    return tmp
} 