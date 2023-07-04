// Copyright (c) 2015-2021 Clearmatics Technologies Ltd
// Copyright (c) 2021-2021 Zkrypto Inc.
// SPDX-License-Identifier: LGPL-3.0+

pragma solidity ^0.8.0;

library Groth16BLS12_381
{
    // Fr elements occupy 1 uint256, and Fq elements occupy 2 uint256s.
    // Therefore G1 elements occupy 4 uint256s. G2 elements have coordinates in
    // Fp2, and thus occupy 8 uint256s.
    //
    // Note that there is scope for compacting 2 Fq elements into 3 uint256s.
    // For now, this is not done, and the precompiled contracts used here do
    // not support it.
    //
    // The (negated) generator g2 of G2 is hardcoded in the code below:
    //
    // x = [
    //   0x00000000000000000000000000000000024aa2b2f08f0a91260805272dc51051
    //   0xc6e47ad4fa403b02b4510b647ae3d1770bac0326a805bbefd48056c8c121bdb8
    //   0x0000000000000000000000000000000013e02b6052719f607dacd3a088274f65
    //   0x596bd0d09920b61ab5da61bbdc7f5049334cf11213945d57e5ac7d055d042b7e
    // ]
    // y = [
    //   0x000000000000000000000000000000000d1b3cc2c7027888be51d9ef691d77bc
    //   0xb679afda66c73f17f9ee3837a55024f78c71363275a75d75d86bab79f74782aa
    //   0x0000000000000000000000000000000013fa4d4a0ad8b1ce186ed5061789213d
    //   0x993923066dddaf1040bc3ff59f825c78df74f2d75467e25e0f55f8a00fa030ed
    // ]
    //
    // VerifyingKey:
    //     uint256[4] Alpha;       // slots 0x00~
    //     uint256[8] Minus_Beta;  // slots 0x04~
    //     uint256[8] Minus_Delta; // slots 0x0c~
    //     uint256[] ABC;          // slots 0x14~

    // Proof:
    //
    //     uint256[4] a,           // offset 0x00 (0x000 bytes)
    //     uint256[8] b,           // offset 0x04 (0x080 bytes)
    //     uint256[4] c,           // offset 0x0c (0x180 bytes)
    //     <end>                   // offset 0x10 (0x200 bytes)

    function _verify(
        uint256[] storage vk,
        uint256[] memory proof,
        uint256[] memory inputs
    )
        internal
        returns (bool)
    {
        require(proof.length == 0x10, "Proof size invalid (BLS12-381)");

        // Compute expected number of inputs.
        uint256 num_inputs = ((vk.length - 0x14) / 4) - 1;
        require(
            inputs.length == num_inputs,
            "Input length differs from expected");

        // Note that the precompiled contracts used below check that all
        // elements of `inputs` belong to the appropriate field.

        // Memory scratch pad, large enough to hold all data in the layouts
        // shown below.
        uint256[24] memory pad;

        bool result = true;
        uint256 vk_slot_num;

        // 1. Compute the linear combination
        //   accum = \sum_{i=0}^{l} input[i] * abc[i]  (in G1).
        //
        // Write abc[0] to (accum_x, accum_y) (input[0] is implicitly 1). In
        // each iteration for i=1,..,l, use abc_x[i] and input[i] (index i-1)
        // to perform scalar multiplication using ecmul and ecadd. Elements
        // written to pad as follows, so that ecmul and ecadd output their
        // results directly into the correct locations.
        //
        //  OFFSET  USAGE
        //   0x120    <END>          ECMUL               ECADD
        //   0x100    input_i     --
        //   0x0e0    abc_y        |     --           --
        //   0x0c0    abc_y        | IN   | OUT        |
        //   0x0a0    abc_x        |      |            |
        //   0x080    abc_x       --     --            | IN
        //   0x060    accum_y                          |    --
        //   0x040    accum_y                          |     | OUT
        //   0x020    accum_x                          |     |
        //   0x000    accum_x                         --    --

        assembly {
            // Copied from bn implemenation in zeth.
            let g := sub(gas(), 2000)

            // Compute starting slot of the vk data and abc data.
            mstore(pad, vk.slot)
            vk_slot_num := keccak256(pad, 0x20)
            let abc_slot_num := add(vk_slot_num, 0x14)

            // Skip first word of `inputs`. Compute the end of the array (each
            // element is 0x20 bytes).
            let input_i := add(inputs, 0x20)
            let input_end := add(input_i, mul(num_inputs, 0x20))

            // Initialize 4 words of (accum_x, accum_y) as first element of
            // vk.abc
            mstore(pad, sload(abc_slot_num))
            abc_slot_num := add(abc_slot_num, 1)
            mstore(add(pad, 0x20), sload(abc_slot_num))
            abc_slot_num := add(abc_slot_num, 1)
            mstore(add(pad, 0x40), sload(abc_slot_num))
            abc_slot_num := add(abc_slot_num, 1)
            mstore(add(pad, 0x60), sload(abc_slot_num))
            abc_slot_num := add(abc_slot_num, 1)

            // Note the location of abc (the area used for scalar
            // multiplication)
            let mul_in := add(pad, 0x080)

            // For each input ...
            for
                {}
                lt(input_i, input_end)
                {}
            {
                // Copy vk.abc from storage into the pad
                mstore(mul_in, sload(abc_slot_num))
                abc_slot_num := add(abc_slot_num, 1)
                mstore(add(mul_in, 0x20), sload(abc_slot_num))
                abc_slot_num := add(abc_slot_num, 1)
                mstore(add(mul_in, 0x40), sload(abc_slot_num))
                abc_slot_num := add(abc_slot_num, 1)
                mstore(add(mul_in, 0x60), sload(abc_slot_num))
                abc_slot_num := add(abc_slot_num, 1)

                // Copy input into the pad
                mstore(add(mul_in, 0x80), mload(input_i))
                input_i := add(input_i, 0x20)

                // Call ecmul on (abc_i, input_i), then ecadd on (accum, abc_i)
                let s1 := call(g, 0x0b, 0, mul_in, 0xa0, mul_in, 0x80)
                let s2 := call(g, 0x0a, 0, pad, 0x100, pad, 0x080)
                result := and(result, and(s1, s2))
            }
        }

        // 2. Write all elements of the pairing check:
        //   e(a, b) =
        //       e(vk.alpha, vk.beta) * e(accum, g_2) * e(c, vk.delta)
        // where:
        //   e: G_1 x G_2 -> G_T is a bilinear map
        //   `*`: denote the group operation in G_T
        //
        // Verification is performed via ecpairing, as:
        //     e(a, b) * e(accum, -g_2) * e(vk.alpha, -vk.beta) *
        //         e(c, -vk.delta) == 1
        // (note that beta and delta in the VK are therefore uploaded as
        // negated values).

        //  OFFSET  USAGE
        //   0x600          <END>
        //   0x500~0x600    vk.minus_delta
        //   0x480~0x500    proof.c
        //   0x380~0x480    proof.b
        //   0x300~0x380    proof.a
        //   0x200~0x300    vk.minus_beta
        //   0x180~0x200    vk.alpha
        //   0x080~0x180    -g_2
        //   0x000~0x080    accum

        assembly
        {
            // accum already in place

            // Write g_2 to offset 0x080~
            
            mstore(
                add(pad, 0x080),
                // solhint-disable-next-line max-line-length
                0x00000000000000000000000000000000024aa2b2f08f0a91260805272dc51051)
            mstore(
                add(pad, 0x0a0),
                // solhint-disable-next-line max-line-length
                0xc6e47ad4fa403b02b4510b647ae3d1770bac0326a805bbefd48056c8c121bdb8)
            mstore(
                add(pad, 0x0c0),
                // solhint-disable-next-line max-line-length
                0x0000000000000000000000000000000013e02b6052719f607dacd3a088274f65)
            mstore(
                add(pad, 0x0e0),
                // solhint-disable-next-line max-line-length
                0x596bd0d09920b61ab5da61bbdc7f5049334cf11213945d57e5ac7d055d042b7e)
            mstore(
                add(pad, 0x100),
                // solhint-disable-next-line max-line-length
                0x000000000000000000000000000000000d1b3cc2c7027888be51d9ef691d77bc)
            mstore(
                add(pad, 0x120),
                // solhint-disable-next-line max-line-length
                0xb679afda66c73f17f9ee3837a55024f78c71363275a75d75d86bab79f74782aa)
            mstore(
                add(pad, 0x140),
                // solhint-disable-next-line max-line-length
                0x0000000000000000000000000000000013fa4d4a0ad8b1ce186ed5061789213d)
            mstore(
                add(pad, 0x160),
                // solhint-disable-next-line max-line-length
                0x993923066dddaf1040bc3ff59f825c78df74f2d75467e25e0f55f8a00fa030ed)
            
            

            // write vk.alpha and vk.minus_beta to offset 0x180~
            mstore(add(pad, 0x180), sload(vk_slot_num))
            mstore(add(pad, 0x1a0), sload(add(vk_slot_num,  1)))
            mstore(add(pad, 0x1c0), sload(add(vk_slot_num,  2)))
            mstore(add(pad, 0x1e0), sload(add(vk_slot_num,  3)))

            mstore(add(pad, 0x200), sload(add(vk_slot_num,  6)))
            mstore(add(pad, 0x220), sload(add(vk_slot_num,  7)))
            mstore(add(pad, 0x240), sload(add(vk_slot_num,  4)))
            mstore(add(pad, 0x260), sload(add(vk_slot_num,  5)))
            mstore(add(pad, 0x280), sload(add(vk_slot_num,  10)))
            mstore(add(pad, 0x2a0), sload(add(vk_slot_num,  11)))
            mstore(add(pad, 0x2c0), sload(add(vk_slot_num, 8)))
            mstore(add(pad, 0x2e0), sload(add(vk_slot_num, 9)))

            // write proof.a and proof.b to offset 0x300~ (skip first word of
            // proof which holds the length)
            proof := add(proof, 0x20)
            mstore(add(pad, 0x300), mload(proof))
            mstore(add(pad, 0x320), mload(add(proof, 0x020)))
            mstore(add(pad, 0x340), mload(add(proof, 0x040)))
            mstore(add(pad, 0x360), mload(add(proof, 0x060)))

            mstore(add(pad, 0x380), mload(add(proof, 0x0c0)))
            mstore(add(pad, 0x3a0), mload(add(proof, 0x0e0)))
            mstore(add(pad, 0x3c0), mload(add(proof, 0x080)))
            mstore(add(pad, 0x3e0), mload(add(proof, 0x0a0)))
            mstore(add(pad, 0x400), mload(add(proof, 0x140)))
            mstore(add(pad, 0x420), mload(add(proof, 0x160)))
            mstore(add(pad, 0x440), mload(add(proof, 0x100)))
            mstore(add(pad, 0x460), mload(add(proof, 0x120)))

            // write proof.c, followed by vk.minus_delta to offset 0x480~
            mstore(add(pad, 0x480), mload(add(proof, 0x180)))
            mstore(add(pad, 0x4a0), mload(add(proof, 0x1a0)))
            mstore(add(pad, 0x4c0), mload(add(proof, 0x1c0)))
            mstore(add(pad, 0x4e0), mload(add(proof, 0x1e0)))

            mstore(add(pad, 0x500), sload(add(vk_slot_num, 0x0e)))
            mstore(add(pad, 0x520), sload(add(vk_slot_num, 0x0f)))
            mstore(add(pad, 0x540), sload(add(vk_slot_num, 0x0c)))
            mstore(add(pad, 0x560), sload(add(vk_slot_num, 0x0d)))
            mstore(add(pad, 0x580), sload(add(vk_slot_num, 0x12)))
            mstore(add(pad, 0x5a0), sload(add(vk_slot_num, 0x13)))
            mstore(add(pad, 0x5c0), sload(add(vk_slot_num, 0x10)))
            mstore(add(pad, 0x5e0), sload(add(vk_slot_num, 0x11)))

            // Call ecpairing
            result := call(gas(), 0x10, 0, pad, 0x600, pad, 0x20)
        }

        return 1 == pad[0];
    }
}