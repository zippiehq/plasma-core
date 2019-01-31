=======
CoinID Assignment
=======

This section will cover terminology and intuitions for the protocol's components. These data structures are encoded and decoded by ``plasma-utils``' library ``serialization``. The exact byte-per-byte binary representations of all data structures for each structure can be found in `schemas`.

Coin ID Assignment
========

The base unit of any plasma asset is represented as a coin. Like in standard Plasma Cash, these coins are non-fungible, and we call the index of a coin its ``coinID``, which is 16 bytes. They are assigned in order of deposit on a per-asset (ERC 20/ETH) basis. Notably, all assets in the chain share the same ID-space, even if they are different ERC20s or ETH. This means that transactions across all asset classes (which we refer to as the ``tokenType`` or ``token``) share the same tree, providing maximum compression.

We achieve this by having the first 4 bytes refer to the ``tokenType`` of a coin, and the next 12 represent all possible coins of that specific ``tokenType``.

For example: the 0th ``tokenType`` is always ``ETH``, so the first ``ETH`` deposit will give spending rights for coin ``0x00000000000000000000000000000000`` to the depositer.
The total coins received per deposit is precisely ``(amount of token deposited)/(minimum token denomination)`` many.

For example: let's say that ``tokenType`` 1 is ``DAI``, the coin denomination is ``0.1 DAI``, and the first depositer sends ``0.5 DAI``. That means its ``tokenType == 1``, so the first depositer will recieve the ``coinIDs`` from ``0x00000001000000000000000000000000`` up to and including coin ``0x00000001000000000000000000000004``.

Denominations
=========

In practice, so denominations will be much lower than ``0.1``. Instead of storing denominations directly in the contract, it stores a ``decimalOffset`` mapping for each ``tokenType`` which represents the shift in decimal places between the amount of deposited ``ERC20`` (or ``wei`` for ETH) and the number of received plasma coins. These calculations can be found in the ``depositERC20``, ``depositETH``, and ``finalizeExit`` functions in the `smart contract`

`//Note: decimalOfsets are hardcoded to 0 for this release, as we lack support in the client/operator code.`

.. _`schemas`: https://github.com/plasma-group/plasma-utils/tree/master/src/serialization/schemas

.. _`smart contract`: https://github.com/plasma-group/plasma-contracts/blob/master/contracts/PlasmaChain.vy
