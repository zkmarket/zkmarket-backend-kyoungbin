// SPDX-License-Identifier: LGPL-3.0+
pragma solidity ^0.8.2;

import "./Groth16AltBN128.sol";
import "./MiMC7.sol";
import "./ZklayBase.sol";
import "./BaseMerkleTree.sol";

contract DataTradeContract is ZklayBase {

    struct userInfo {
        uint256 addr; // azeroth address
        uint256 pk_enc;
        uint256 pk_own;
    }

    struct Order {
        address orderer;
        uint256 cm_pear;
        uint256 cm_del;
    }

    // h_ct list
    mapping(uint256 => bool) internal _hCT_list;

    //addr
    mapping(uint256 => bool) internal _addr_list;

    // EOA -> user keys
    mapping(address => userInfo) _userInfoMap;

    // pk_own -> address
    mapping(uint256 => address) _eoaMap;

    // order number -> order
    mapping(bytes32 => Order) _order;

    // to check trade
    mapping(uint256 => bool) waitTradeList;

    // registData SNARK Proof verify input num
    uint256 internal constant REGISTDATA_NUM_INPUTS = 4;

    // GenTrade SNARK Proof verify input num
    uint256 internal constant ORDER_NUM_INPUTS = 14;

    // AcceptTrade SNARK Proof verify input num
    uint256 internal constant ACCEPT_NUM_INPUTS = 8;

    // registDAta SNARK vk
    uint256[] private registData_vk;

    // GenTrade SNARK vk
    uint256[] private orderData_vk;

    // Accept Trade vk
    uint256[] private acceptOrder_vk;

    event logOrder(
        address sender,
        uint256 c0,
        uint256 c1,
        uint256[] c2
    );

    event LogAcceptTrade(
        uint256 cm_del,
        uint256 cm_peer,
        uint256 index_del,
        uint256 index_peer
    );

    constructor(
        uint256[] memory _registData_vk,
        uint256[] memory _orderData_vk,
        uint256[] memory _acceptOrder_vk,
        uint256 depth,
        uint256[] memory vk,
        uint256[] memory vkNft,
        uint256 price,
        address toReceiveFee
    ) ZklayBase(depth, vk, vkNft, price, toReceiveFee) {
        registData_vk = _registData_vk;
        orderData_vk  = _orderData_vk;
        acceptOrder_vk = _acceptOrder_vk;
        // registUser(pk_own_del, pk_enc_del);
    }

    function registUserByDelegator(
        uint256 pk_own, 
        uint256 pk_enc,
        address eoa
    ) 
        public
        payable
    {   
        // bytes32 _addr = MiMC7._hash(bytes32(pk_own), bytes32(pk_enc));
        _registUser(_addressMap[eoa].Addr, pk_own, pk_enc, eoa);
    }

    function registUser(
        uint256 pk_own, 
        uint256 pk_enc
    )
        public
        payable
    {   
        // bytes32 _addr = MiMC7._hash(bytes32(pk_own), bytes32(pk_enc));
        _registUser(_addressMap[msg.sender].Addr, pk_own, pk_enc, msg.sender);
    }

    function _registUser(
        uint256 addr,
        uint256 pk_own, 
        uint256 pk_enc,
        address eoa
    )
        public
        payable
    {   
        require(_addrList[addr], "Azeroth User deos not exist");
        require(!_addr_list[_userInfoMap[eoa].addr], "msg.sender already exist");
        require(!_addr_list[addr], "User already exist");

        _addr_list[addr] = true;

        _userInfoMap[eoa].addr = addr;
        _userInfoMap[eoa].pk_enc = pk_enc;
        _userInfoMap[eoa].pk_own = pk_own;

        _eoaMap[pk_own] = eoa;
    }

    function isRegisteredUser(
        uint256 addr
    ) 
        public 
        view 
        returns (bool) 
    {
        return _addr_list[addr];
    }

    /*
        --- inputs ---
        0 : 1 
        1 : addr_peer
        2 : h_k
        3 : h_ct
        --------------
    */
    function registData(
        uint256[] memory proof,
        uint256[] memory inputs
    ) 
        public  
        returns(bool)
    {   
        // check input length
        require( inputs.length == REGISTDATA_NUM_INPUTS, "invalid Input length");
        
        // check hct
        require( !_hCT_list[inputs[3]], "already registered h_ct");

        uint256[] memory input_values = new uint256[](REGISTDATA_NUM_INPUTS);
        for (uint256 i = 0 ; i < REGISTDATA_NUM_INPUTS; i++) {
            input_values[i] = inputs[i];
        }
        require( Groth16AltBN128._verify(registData_vk, proof, input_values), "invalid proof");

        _hCT_list[input_values[3]] = true;
        return _hCT_list[input_values[3]];
    }

    function isRegistered(uint256 _hct) 
        public 
        view 
        returns(bool) 
    {
        return _hCT_list[_hct];
    }


    /**
        0 : 1 
        1 : c0 
        2 : c1
        3 : cm_own 
        4 : cm_del 
        5 : ENA_r 
        6 : ENA_c 
        7 : ENA'_r 
        8 : ENA'_c 
        9 : CT[0]
        10: CT[1]
        11: CT[2]
        12: CT[3]
        13: CT[4]
     */
    function orderData(
        uint256[] memory proof,
        uint256[] memory inputs,
        address tokenAddress
    )
        public
        payable
        returns(bool)
    {
        require( inputs.length == ORDER_NUM_INPUTS, "invalid Input length");

        require( !waitTradeList[inputs[3]], "already exist cm_own");
        require( !waitTradeList[inputs[4]], "already exist cm_del");
        
        // check ENA is valid 블록체인에 기록된 ENA 와 동일한지 확인
        require(_ENA[tokenAddress][_addressMap[msg.sender].Addr].r == inputs[5], "invalid ENA(r)");
        require(_ENA[tokenAddress][_addressMap[msg.sender].Addr].ct == inputs[6], "invalid ENA(ct)");

        uint256[] memory input_values = new uint256[](ORDER_NUM_INPUTS);
        for (uint256 i = 0 ; i < ORDER_NUM_INPUTS; i++) {
            input_values[i] = inputs[i];
        }
        require( Groth16AltBN128._verify(orderData_vk, proof, input_values), "invalid proof");
        
        // order number
        bytes32 orderNumber = MiMC7._hash(bytes32(inputs[3]), bytes32(inputs[4]));
        _order[orderNumber].orderer = msg.sender;

        // insert cm to waitTradeList
        waitTradeList[inputs[3]] = true;
        waitTradeList[inputs[4]] = true;
        _order[orderNumber].cm_pear = inputs[3];
        _order[orderNumber].cm_del = inputs[4];
        
        _ENA[tokenAddress][_addressMap[msg.sender].Addr] = ENA(inputs[7], inputs[8]);

        // // emit log
        // uint256[] memory c2 = new uint256[](6);
        // for (uint256 i=0; i<6; i++){
        //     c2[i] = input_values[i+11];
        // } 
        // emit logOrder(
        //     msg.sender,
        //     input_values[1],
        //     input_values[2],
        //     c2
        // );

        return true;
    }

    function cancelOrder(
        bytes32 orderNumber
    )
        public
        returns (bool)
    {
        require(_order[orderNumber].orderer == msg.sender,"Not match the orderer");
        require(waitTradeList[_order[orderNumber].cm_pear] == true, "cm pear no exit");
        require(waitTradeList[_order[orderNumber].cm_del] == true, "cm del no exit");

        waitTradeList[_order[orderNumber].cm_pear] = false;
        waitTradeList[_order[orderNumber].cm_del] = false;

        return true;
    }

    /**
        0 : 1
        1 : cm_del  
        2 : cm_own
        3 : cm_del_azeroth
        4 : cm_peer_azeroth
        5 : ecryptedDataEncKey[0] g^r
        6 : ecryptedDataEncKey[1] k* pk^r
        7 : ecryptedDataEncKey[2] enc_k(msg)
     */
    function acceptOrder(
        uint256[] memory proof,
        uint256[] memory inputs    
    )
        public
        returns(bool)
    {
        require(inputs.length == ACCEPT_NUM_INPUTS, "invalid Inputs length");

        // check cm
        require(waitTradeList[inputs[1]], "cm0 no exist");
        require(waitTradeList[inputs[2]], "cm1 no exist");

        uint256[] memory input_values = new uint256[](ACCEPT_NUM_INPUTS);
        for (uint256 i = 0 ; i < ACCEPT_NUM_INPUTS; i++) {
            input_values[i] = inputs[i];
        }
        require( Groth16AltBN128._verify(acceptOrder_vk, proof, input_values), "invalid proof");

        waitTradeList[input_values[1]] = false;
        waitTradeList[input_values[2]] = false;

        _insert(bytes32(input_values[3]));
        _insert(bytes32(input_values[4]));
        uint256 new_merkle_root = uint256(_recomputeRoot(2));
        _addRoot(new_merkle_root);
        
        emit LogAcceptTrade(
            input_values[3], 
            input_values[4], 
            BaseMerkleTree._numLeaves - 1, 
            BaseMerkleTree._numLeaves
        );

        return true;
    }

    function checkCmValidation(
        bytes32 orderNumber
    )
        public
        view
        returns (bool,bool)
    {
        return (waitTradeList[_order[orderNumber].cm_pear], waitTradeList[_order[orderNumber].cm_del]);
    }

    function _hash(bytes32 left, bytes32 right)
        internal
        pure
        override
        returns (bytes32)
    {
        return MiMC7._hash(left, right);
    }

    function _verifyZKProof(
        uint256[] memory proof,
        uint256[] memory inputs,
        bool isNft
    ) internal override returns (bool) {
        if (isNft) {
            return Groth16AltBN128._verify(_vkNft, proof, inputs);
        }
        return Groth16AltBN128._verify(_vk, proof, inputs);
    }


    // =================== TO TEST ===================
    // YOU MUST DELETE BELOW FUNCTIONS BEFORE DEPLOYING

    function setENA(
        address tokenAddress,
        uint256 addr,
        uint256 ena_r,
        uint256 ena_ct
    ) 
        public
        payable
        registeredToken(tokenAddress)
        returns (bool)
    { 
        _ENA[tokenAddress][addr] = ENA(ena_r, ena_ct);
        return true;
    }
}