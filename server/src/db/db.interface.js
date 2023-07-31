import _ from 'lodash';
import mysqlPromise from 'mysql2/promise';

import { mysqlConfig } from '../config.js';


const connection = await mysqlPromise.createConnection(mysqlConfig);

export class DBinterface {
    constructor(){
        this.connection = connection;
    } 

    /**
     * 
     * @param {Array<String>}   SELECT_LIST 
     * @param {String}          FROM 
     * @param {object}   WHERE  {key, value} array
     * @returns {}
     */
    async SELECT(
        SELECT_LIST,
        FROM = undefined,
        WHERE = undefined,
    )
    {   
        let query = 'SELECT '
        
        for (let select of SELECT_LIST ){
            query += select + ', '
        }
        query = query.slice(0,-2) 

        if(FROM) { query += ' FROM ' + FROM; }

        if(WHERE){ query += ` WHERE ${_.get(WHERE, 'key')}="${_.get(WHERE, 'value')}"`}
        
        try {
            const ret = await this.connection.execute(query + ';');

            return ret
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    /**
     * 
     * @param {String} TABLE_NAME 
     * @param {Array<String>} KEYS 
     * @param {Array<String>} VALUES 
     */
    async INSERT(
        TABLE_NAME,
        KEYS,
        VALUES
    ){  
        if(KEYS.length != VALUES.length){
            console.log('length err');
            return undefined;
        }

        let query = `INSERT INTO ${TABLE_NAME} (`
        for (let k of KEYS){
            query += k + ', ';
        }
        query = query.slice(0,-2) + ') VALUES ('
        
        for (let v of VALUES){
            query += `'${v}', `
        }
        query = query.slice(0,-2) + `)`

        try {
            const ret = await this.connection.execute(query+';');
            return ret;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async DELETE(){
        // 필요하면 구현
    }

    async UPDATE(
        TABLE_NAME,
        SET_KEY,
        SET_VALUE,
        WHERE_KEY,
        WHERE_VALUE
    ) {
        if(SET_KEY.length != SET_VALUE.length){
            throw new Error('SET key length, SET value length err');
        }

        let query = 'UPDATE ' + TABLE_NAME + ' SET ';
        for (let i = 0; i < SET_KEY.length; i++) {
            query += SET_KEY[i] + ' = ?,';
        }
        query = query.slice(0, query.length - 1);


        query += ' WHERE ';
        for (let i = 0; i < WHERE_KEY.length; i++) {
            query += WHERE_KEY[i] + ' = ?,';
        }
        query = query.slice(0, query.length - 1);

        let values = SET_VALUE
        values.push(...WHERE_VALUE)

        try {
            const ret = await this.connection.execute(query+';', values);
            return ret;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }
}

export default DBinterface;