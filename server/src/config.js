import bluebird from 'bluebird';

let Config = {
    homePath        : '/Users/kim/azeroth-trade-dev/server/',

    dataBlockNum    : '530',
    dataMaxBlockNum : '530',

    serializeFormat : 3,
    EC_TYPE         : 'EC_ALT_BN128',
    R1CS_GG         : 1,
    R1CS_ROM_SE     : 2,

    EC_ALT_BN128    : 1,
    EC_BLS12_381    : 2,

    networkId       : '1234',

    networkSelector : 0,

    testProvider    : 'http://127.0.0.1:8545',
    testRPCprovider : '127.0.0.1:8545',

    AUDITOR_IDX : 0,
    DELEGATE_SERVER_IDX : 1,
    WRITER_IDX : 2,

    ZERO_TOKEN_ADDRESS : '0x0000000000000000000000000000000000000000'
}

export const mysqlConfig = {
    host    : 'localhost',
    user    : 'dataTradeServer',
    password: 'Itsp7501`',
    database: 'trade_db',
    Promise : bluebird,
};

export let crsPath = Config.homePath + 'src/snarks/crs/'
export let snarkPath = Config.homePath + 'db/proof/'
export let dbPath = Config.homePath + 'db/'
export let ganacheAccountKeyPath = Config.homePath + '../tradeContract/keys.json'
export let contractsBuildPath = Config.homePath + '../tradeContract/build/contracts/'

export default Config;