import dataDB from "./model/dataModel";
import noteDB from "./model/noteModel";
import tradeDB from "./model/tradeModel";

const dataDataBase = new dataDB();
const noteDataBase = new noteDB();
const tradeDataBase = new tradeDB();

export default {
    data : dataDataBase,
    note : noteDataBase,
    trade : tradeDataBase
}