/**
 * TEST scenario of data trade 
 * 
 * 1. deploy contract 되어있다고 치고...
 * 2. register delegate server to Contract
 * 3. register Writer to Contract
 * 4. register User to Contract
 * 5. User zktransfer to he's own ENA
 * 6. register Data from Writer
 * 7. User genTrade 
 * 8. server AcceptTrade
 * 9. User get Data
 */

import tradeContract from "../contracts/contract"

const contractAddress = ''.toLocaleLowerCase()

const contracts =  new tradeContract(Config.testProvider, contractAddress)

