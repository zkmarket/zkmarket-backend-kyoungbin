// Copyright (c) 2015-2020 Clearmatics Technologies Ltd
//
// SPDX-License-Identifier: LGPL-3.0+

pragma solidity ^0.8.2;
pragma experimental ABIEncoderV2;

/// Declare the ERC20 interface in order to handle ERC20 tokens transfers to
/// and from the Mixer. Note that we only declare the functions we are
/// interested in, namely, transferFrom() (used to do a Deposit), and
/// transfer() (used to do a withdrawal)
abstract contract ERC20 {
    function transferFrom(
        address from,
        address to,
        uint256 value
    ) public virtual;

    function transfer(address to, uint256 value) public virtual;
}

abstract contract ERC721 {
    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public virtual;

    function  safeTransferFrom(
        address from,
        address to,
        uint256 id,
        bytes memory data
    ) public virtual;
}

abstract contract ERC1155 {
    function safeBatchTransferFrom(
        address _from,
        address _to,
        uint256[] memory _ids,
        uint256[] memory _values,
        bytes memory _data
    ) public virtual;

    function  safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public virtual;
}

/// ERC223 token compatible contract
contract ERC223ReceivingContract {
    // See:
    // solhint-disable-next-line max-line-length
    //   https://github.com/Dexaran/ERC223-token-standard/blob/Recommended/Receiver_Interface.sol
    struct Token {
        address sender;
        uint256 value;
        bytes data;
        bytes4 sig;
    }

    function tokenFallback(
        address from,
        uint256 value,
        bytes memory data
    ) public pure {
        Token memory tkn;
        tkn.sender = from;
        tkn.value = value;
        tkn.data = data;

        // See:
        // solhint-disable-next-line max-line-length
        //   https://solidity.readthedocs.io/en/v0.5.5/types.html#conversions-between-elementary-types
        uint32 u = uint32(bytes4(data[0])) +
            uint32(bytes4(data[1]) >> 8) +
            uint32(bytes4(data[2]) >> 16) +
            uint32(bytes4(data[3]) >> 24);
        tkn.sig = bytes4(u);
    }
}
// OpenZeppelin Contracts v4.4.1 (token/ERC721/utils/ERC721Holder.sol)
contract NFTHolder {
    /**
     * @dev Handles the receipt of a single ERC1155 token type. This function is
     * called at the end of a `safeTransferFrom` after the balance has been updated.
     *
     * NOTE: To accept the transfer, this must return
     * `bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"))`
     * (i.e. 0xf23a6e61, or its own function selector).
     *
     * @param operator The address which initiated the transfer (i.e. msg.sender)
     * @param from The address which previously owned the token
     * @param id The ID of the token being transferred
     * @param value The amount of tokens being transferred
     * @param data Additional data with no specified format
     * @return `bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"))` if transfer is allowed
     */
    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) public view returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    /**
     * @dev Handles the receipt of a multiple ERC1155 token types. This function
     * is called at the end of a `safeBatchTransferFrom` after the balances have
     * been updated.
     *
     * NOTE: To accept the transfer(s), this must return
     * `bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"))`
     * (i.e. 0xbc197c81, or its own function selector).
     *
     * @param operator The address which initiated the batch transfer (i.e. msg.sender)
     * @param from The address which previously owned the token
     * @param ids An array containing ids of each token being transferred (order and length must match values array)
     * @param values An array containing amounts of each token being transferred (order and length must match ids array)
     * @param data Additional data with no specified format
     * @return `bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"))` if transfer is allowed
     */
    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata data
    ) public view returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }

    /**
     * @dev Whenever an {IERC721} `tokenId` token is transferred to this contract via {IERC721-safeTransferFrom}
     * by `operator` from `from`, this function is called.
     *
     * It must return its Solidity selector to confirm the token transfer.
     * If any other value is returned or the interface is not implemented by the recipient, the transfer will be reverted.
     *
     * The selector can be obtained in Solidity with `IERC721Receiver.onERC721Received.selector`.
     */
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) public view returns (bytes4) {
        return this.onERC721Received.selector;
    }
}