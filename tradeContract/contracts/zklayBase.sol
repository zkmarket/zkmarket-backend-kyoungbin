// Copyright (c) 2015-2020 Clearmatics Technologies Ltd
// Copyright (c) 2021-2021 Zkrypto Inc.
// SPDX-License-Identifier: LGPL-3.0+

pragma solidity ^0.8.2;

import './Tokens.sol';
import './BaseMerkleTree.sol';
import './Ownable.sol';

/// MixerBase implements the functions shared across all Mixers (regardless
/// which zkSNARK is used)
abstract contract ZklayBase is
    BaseMerkleTree,
    ERC223ReceivingContract,
    Ownable,
    NFTHolder
{
    struct CurvePoint {
        uint256 x;
        uint256 y;
    }

    struct ENA {
        uint256 r;
        uint256 ct;
    }

    struct AddressMap {
        uint256 Addr;
        uint256 PkOwn;
        CurvePoint PkEnc;
    }

    // zkTransfer fee
    uint256 private _zkTrasferFee = 0;

    // Address for zkTransfer fee
    address private _addressForZkTransferFee;

    // The roots of the different updated trees
    mapping(uint256 => bool) private _roots;

    // The public list of nullifiers (prevents double spend)
    mapping(uint256 => bool) private _nullifiers;

    // The auditor's public key
    // uint256 private _APK;
    CurvePoint private _APK;
    mapping(uint256 => CurvePoint) private _APK_map;
    uint private _indexOfApk = 0;

    // The Most recent root of the Merkle tree
    uint256 private _rootTop;

    // The public list of user address
    mapping(uint256 => bool) internal _addrList;

    // List of mapping addresses corresponding to user EOA
    mapping(address => AddressMap) internal _addressMap;

    // The public list of users' encrypted accounts
    mapping(address => mapping(uint256 => ENA)) internal _ENA;

    // Structure of the verification key and proofs is opaque, determined by
    // zk-snark verification library.
    uint256[] internal _vk;
    uint256[] internal _vkNft;

    // Registration status of fungible token address
    mapping(address => bool) private _tokens;

    // The number of inputs for a zk-SNARK proof
    uint256 internal constant _NUM_INPUTS = 24;

    // The unit used for public values (ether in and out), in Wei.
    // Must match the python wrappers.
    uint64 private constant _PUBLIC_UNIT_VALUE_WEI = 1;

    // The unit used for public values (ether in and out), in Ether.
    // Must match the python wrappers.
    uint64 private constant _PUBLIC_UNIT_VALUE_ETHER =
    _PUBLIC_UNIT_VALUE_WEI * (10 ** 18);

    // units of gas used * (base fee + priority fee)
    // estimated GasUsed = 2000000, (base fee + priority fee) = 10
    uint256 private _estimatedZkTransferGasFeeToWei = 200000000;

    event LogZkTransfer(
        uint256 nullifier,
        uint256 com,
        uint256[9] ct,
        uint256 index,
        address tokenAddress
    );

    event LogZkTransferNft(
        uint256 nullifier,
        uint256 com,
        uint256[9] ct,
        uint256 index
    );

    event LogUserRegister(uint256 addr, uint256 pkOwn, CurvePoint pkEnc);

    event LogNFT(address tokenAddress, uint88 tokenId);

    /// Constructor
    constructor(
        uint256 depth,
        uint256[] memory vk,
        uint256[] memory vkNft,
        uint256 price,
        address toReceiveFee
    ) BaseMerkleTree(depth) {
        uint256 initialRoot = uint256(_nodes[0]);
        _roots[initialRoot] = true;
        _rootTop = initialRoot;
        _vk = vk;
        _vkNft = vkNft;
        _tokens[address(0)] = true;
        _zkTrasferFee = price;
        _addressForZkTransferFee = toReceiveFee;
        // register 'Ethereum'
    }

    modifier verifyInputs(uint256 root, uint256 nullifier) {
        // 1. Check the auditor key.
        require(
            _APK.x != uint256(0) && _APK.y != uint256(0),
            'APK does not exist'
        );

        // 2. Check the root and the nullifiers.
        require(_roots[root], 'This root is not valid');

        require(
            !_nullifiers[nullifier],
            'This nullifier has already been used'
        );
        _;
    }

    modifier registeredToken(address tokenAddress) {
        require(_tokens[tokenAddress], 'Token does not exist');
        _;
    }

    function isNullified(uint256 nf) public view returns (bool) {
        return _nullifiers[nf];
    }

    function getCiphertext(address tokenAddress, uint256 addr)
    public
    view
    registeredToken(tokenAddress)
    returns (uint256, uint256)
    {
        require(_addrList[addr], 'The user does not exist');

        return (_ENA[tokenAddress][addr].ct, _ENA[tokenAddress][addr].r);
    }

    function getAPK() public view returns (CurvePoint memory, uint256) {
        require(
            _APK.x != uint256(0) && _APK.y != uint256(0),
            'APK does not exist'
        );

        require(
            _APK.x == _APK_map[_indexOfApk - 1].x && _APK.y == _APK_map[_indexOfApk - 1].y,
            '500 Error, APK something wrong'
        );

        return (_APK, _indexOfApk - 1);
    }

    function getAPKfromIndex(uint256 index) public view returns (CurvePoint memory) {
        require(
            _APK_map[index].x != uint256(0) && _APK_map[index].y != uint256(0),
            'APK does not exist'
        );

        return (_APK_map[index]);
    }

    function getUserPublicKeys(address eoa)
    public
    view
    returns (
        uint256,
        uint256,
        CurvePoint memory
    )
    {
        return (
        _addressMap[eoa].Addr,
        _addressMap[eoa].PkOwn,
        _addressMap[eoa].PkEnc
        );
    }

    function getRootTop() public view returns (uint256) {
        return _rootTop;
    }

    function getMerklePath(uint256 index)
    public
    view
    returns (uint256[] memory)
    {
        bytes32[] memory merklePathBytes = _computeMerklePath(index);
        uint256[] memory merklePath = new uint256[](_DEPTH);

        //TODO: need conversion?
        for (uint256 i = 0; i < merklePathBytes.length; i++) {
            merklePath[i] = uint256(merklePathBytes[i]);
        }

        return merklePath;
    }

    function registerToken(address tokenAddress) public onlyOwner {
        require(tokenAddress != address(0), 'Cannot register address of zero');
        require(!_tokens[tokenAddress], 'Token already exists');
        _tokens[tokenAddress] = true;
    }

    function registerUser(
        uint256 addr,
        uint256 pkOwn,
        uint256[] memory pkEnc
    ) public {
        require(!_addrList[addr], 'User already exist');
        _addrList[addr] = true;

        _addressMap[msg.sender].Addr = addr;
        _addressMap[msg.sender].PkOwn = pkOwn;
        CurvePoint memory curvePointPkEnc = CurvePoint(pkEnc[0], pkEnc[1]);
        _addressMap[msg.sender].PkEnc = curvePointPkEnc;

        emit LogUserRegister(addr, pkOwn, curvePointPkEnc);
    }

    function registerAuditor(uint256[] memory apk) public onlyOwner {
        //** Can register new Apk
        // require(
        //     _APK.x == uint256(0) && _APK.y == uint256(0),
        //     'APK already exists'
        // );
        _APK_map[_indexOfApk] = CurvePoint(apk[0], apk[1]);
        _APK = _APK_map[_indexOfApk];
        _indexOfApk = _indexOfApk + 1;
    }

    function getAPKByIndex(uint index) public view returns (CurvePoint memory) {
        require(
            _APK_map[index].x != uint256(0) && _APK_map[index].y != uint256(0),
            'APK does not exist'
        );

        return _APK_map[index];
    }
    // inputs
    // [0]  | rt
    // [1]  | sn
    // [2]  | pk.addr || ena
    // [3]  | pk.Own
    // [4]  | pk.Enc.x
    // [5]  | pk.Enc.y
    // [6]  | cm
    // [7]  | sCT_New.r
    // [8]  | sCT_New.ct
    // [9]  | pubInVal
    // [10] | pubOutVal
    // [11] | ct_0.x
    // [12] | ct_0.y
    // [13] | ct_1.x
    // [14] | ct_1.y
    // [15] | ct_2.x
    // [16] | ct_2,y
    // [17] | ct_3.0
    // [18] | ct_3.1
    // [19] | ct_3.2
    function zkTransfer(
        uint256[] memory proof,
        uint256[] memory inputs,
        address toEoA,
        address tokenAddress
    )
    public
    payable
    registeredToken(tokenAddress)
    verifyInputs(inputs[0], inputs[1])
    {
        uint256 addr = inputs[2];
        // Check the user address is in the list.
        require(
            _addrList[addr],
            'Invalid User: The user isn`t in the user list'
        );

        ENA memory ena = _ENA[tokenAddress][addr];
        uint256[] memory states = new uint256[](4);
        states[0] = _APK.x;
        states[1] = _APK.y;
        states[2] = ena.r;
        // 0
        states[3] = ena.ct;
        // 0

        require(
            _verifyZKProof(
                proof,
                _assembleZKInputsWithStates(states, inputs),
                false
            ),
            'Invalid proof: Unable to verify the proof correctly'
        );

        // Compute a new merkle root, Update root_list.
        // rt' <- add_and_update(commit_list, c')
        // root_list.append(rt')
        _insert(bytes32(inputs[6]));
        uint256 new_merkle_root = uint256(_recomputeRoot(1));
        _addRoot(new_merkle_root);

        // Update a nullifier list by appending a new nf.
        // nf_list.append(nf)
        _nullifiers[inputs[1]] = true;

        uint256[9] memory cipherText = [
        inputs[11],
        inputs[12],
        inputs[13],
        inputs[14],
        inputs[15],
        inputs[16],
        inputs[17],
        inputs[18],
        inputs[19]
        ];
        emit LogZkTransfer(
            inputs[1],
            inputs[6],
            cipherText,
            BaseMerkleTree._numLeaves,
            tokenAddress
        );

        _processPublicValues([inputs[9], inputs[10]], toEoA, tokenAddress);
        // Azeroth fee transfer (To zkrypto.inc)
        _transferAzerothFee();

        // 10. Update a ciphertext of ENA as follows.
        // ENA[addr] <- ct'
        _ENA[tokenAddress][addr] = ENA(inputs[7], inputs[8]);
    }

    // inputs
    // [0]  | rt
    // [1]  | sn
    // [2]  | pk.addr || ena
    // [3]  | pk.Own
    // [4]  | pk.Enc.x
    // [5]  | pk.Enc.y
    // [6]  | cm
    // [7]  | pubInVal
    // [8] | pubOutVal
    // [9] | ct_0.x
    // [10] | ct_0.y
    // [11] | ct_1.x
    // [12] | ct_1.y
    // [13] | ct_2.x
    // [14] | ct_2,y
    // [15] | ct_3.0
    // [16] | ct_3.1
    // [17] | ct_3.2
    function zkTransferNft(
        uint256[] memory proof,
        uint256[] memory inputs, // 0~13
        address toEoA
    ) public payable verifyInputs(inputs[0], inputs[1]) {
        uint256[] memory states = new uint256[](2);
        states[0] = _APK.x;
        states[1] = _APK.y;

        require(
            _verifyZKProof(
                proof,
                _assembleZKInputsWithStates(states, inputs),
                true
            ),
            'Invalid proof: Unable to verify the proof correctly'
        );

        // Compute a new merkle root, Update root_list.
        // rt' <- add_and_update(commit_list, c')
        // root_list.append(rt')
        _insert(bytes32(inputs[6]));
        uint256 new_merkle_root = uint256(_recomputeRoot(1));
        _addRoot(new_merkle_root);

        // Update a nullifier list by appending a new nf.
        // nf_list.append(nf)
        _nullifiers[inputs[1]] = true;

        uint256[9] memory cipherText = [
        inputs[9],
        inputs[10],
        inputs[11],
        inputs[12],
        inputs[13],
        inputs[14],
        inputs[15],
        inputs[16],
        inputs[17]
        ];
        emit LogZkTransferNft(
            inputs[1],
            inputs[6],
            cipherText,
            BaseMerkleTree._numLeaves
        );


        _processPublicNFT([inputs[7], inputs[8]], toEoA);
        // Azeroth fee transfer (To zkrypto.inc)
        _transferAzerothFee();
    }

    function _assembleZKInputsWithStates(
        uint256[] memory states,
        uint256[] memory inputs
    ) private pure returns (uint256[] memory) {
        // Define statement including APK and constant 'one' which generated from Jsnark.
        uint256 statementLength = 1 + inputs.length + states.length;

        uint256[] memory statements = new uint256[](statementLength);
        statements[0] = 1;

        for (uint256 i = 0; i < states.length; i++) {
            statements[i + 1] = states[i];
        }
        for (uint256 i = 0; i < inputs.length; i++) {
            statements[i + 1 + states.length] = inputs[i];
        }

        return statements;
    }

    // Implementations must implement the verification algorithm of the
    // selected SNARK.
    function _verifyZKProof(
        uint256[] memory proof,
        uint256[] memory inputs,
        bool isNft
    ) internal virtual returns (bool);

    function _addRoot(uint256 rt) internal {
        _roots[rt] = true;
        _rootTop = rt;
    }

    function _processPublicValues(
        uint256[2] memory inputs,
        address EOA,
        address tokenAddress
    ) private {
        uint256 vpubIn = inputs[0];
        uint256 vpubOut = inputs[1];

        // If vpubIn is > 0, we need to make sure that right amount is paid
        if (vpubIn > 0) {
            if (tokenAddress != address(0)) {
                ERC20 erc20Token = ERC20(tokenAddress);
                erc20Token.transferFrom(msg.sender, address(this), vpubIn);
                if (msg.value > 0) {
                    (bool success,) = msg.sender.call{value : msg.value}('');
                    require(success, 'vpubIn return transfer failed');
                }
            } else {
                vpubIn *= _PUBLIC_UNIT_VALUE_WEI;
                require(
                    msg.value == vpubIn,
                    'Wrong msg.value: Value paid is not correct'
                );
            }
        } else {
            // If vpubIn = 0, return incoming Ether to the caller
            if (msg.value > 0) {
                (bool success,) = msg.sender.call{value : msg.value}('');
                require(success, 'vpubIn return transfer failed');
            }
        }

        // If vpubOut > 0 then we do a withdraw. We retrieve the
        // msg.sender and send him the appropriate value If proof is valid
        if (vpubOut > 0) {
            if (tokenAddress != address(0)) {
                ERC20 erc20Token = ERC20(tokenAddress);
                erc20Token.transfer(EOA, vpubOut);
            } else {
                vpubOut *= _PUBLIC_UNIT_VALUE_WEI;
                payable(EOA).transfer(vpubOut);
            }
        }
    }

    function _processPublicNFT(uint256[2] memory inputs, address EOA) private {
        uint256 nftPubIn = inputs[0];
        uint256 nftPubOut = inputs[1];

        if (nftPubIn != 0) {
            (address tokenAddress, uint88 tokenId) = deserializeTokenId(
                nftPubIn
            );
            ERC721 token = ERC721(tokenAddress);
            emit LogNFT(tokenAddress, tokenId);
            token.transferFrom(msg.sender, address(this), tokenId);
        }

        if (nftPubOut != 0) {
            (address tokenAddress, uint88 tokenId) = deserializeTokenId(
                nftPubOut
            );
            ERC721 token = ERC721(tokenAddress);
            emit LogNFT(tokenAddress, tokenId);
            token.transferFrom(address(this), EOA, tokenId);
        }
    }

    function deserializeTokenId(uint256 serializedId)
    private
    pure
    returns (address, uint88)
    {
        address tokenAddress = address(uint160(serializedId >> 88));
        uint88 tokenId = uint88(serializedId);

        return (tokenAddress, tokenId);
    }

    // for business logic

    // price getter setter
    function getZkTransferFee() public view returns(uint256) {
        return (_zkTrasferFee);
    }
    function setZkTransferFee(uint256 price) public onlyOwner {
        // TODO bm [constant -> percent]
        _zkTrasferFee = price;
    }

    // azerothPriceAddress getter setter
    function getZkTransferFeeAddress() public view returns(address) {
        return (_addressForZkTransferFee);
    }
    function setAzerothPriceAddress(address addr) public onlyOwner {
        _addressForZkTransferFee = addr;
    }

    // transfer _price to _azerothPriceAddress
    function _transferAzerothFee() private {
        (bool success,) = _addressForZkTransferFee.call{value : _zkTrasferFee}('');
        require(success, 'Azeroth fee transfer failed.');
    }


    /*  
        ==============================================================================
        ==============================================================================
        ==============================================================================
        데이터 트레이드 컨트랙트 추가
    */
    // function tradeRegistData(
    //     uint256[] memory proof,
    //     uint256[REGISTDATA_NUM_INPUTS] memory inputs
    // )
    //     public 
    //     payable
    //     returns (bool)
    // {   
    //     require(registData(proof, inputs), 'invalid proof');

    //     return true;
    // }

    // /*
    //     1, 
    //     c0, c1   
    //     cm_own 
    //     cm_del 
    //     ENA_r, ENA_c 
    //     ENA'_r, ENA'_c 
    //     fee_del, fee_own 
    //     CT : (size : 6)
    //  */
    // function tradeOrderData(
    //     uint256[] memory proof,
    //     uint256[ORDER_NUM_INPUTS] memory inputs
    // )
    //     public 
    //     payable
    //     returns (bool)
    // {   
    //     uint256 fee = inputs[9] + inputs[10];

    //     fee *= _PUBLIC_UNIT_VALUE_WEI;
    //     require(
    //         msg.value == fee,
    //         'Wrong msg.value: Value paid is not correct'
    //     );

    //     require(orderData(proof, inputs), 'invalid proof');

    //     return true;
    // }

    // function tradeAcceptOrder(
    //     uint256[] memory proof,
    //     uint256[ACCEPT_NUM_INPUTS] memory inputs
    // )
    //     public 
    //     payable
    //     returns (bool)
    // {   
    //     // inputs[6] : fee_del
    //     // inputs[7] : fee_own

    //     require(acceptOrder(proof, inputs), 'invalid proof');

        

    //     return true;
    // }
}
