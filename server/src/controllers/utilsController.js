import contracts from "../contracts"

export const getContractAddressController = (req, res) => {
    console.log('getContractAddressController : ', contracts.tradeContract.instance.options.address)
    res.send(contracts.tradeContract.instance.options.address)
}

export default {
    getContractAddressController
}