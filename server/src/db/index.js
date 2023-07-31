import dataDB from "./model/dataModel";
import noteDB from "./model/noteModel";

const dataDataBase = new dataDB();
const noteDaaBase = new noteDB();

export default {
    data : dataDataBase,
    note : noteDaaBase
}