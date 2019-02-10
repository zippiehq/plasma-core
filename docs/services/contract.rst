================
ContractProvider
================

``ContractProvider`` is a wrapper that interacts with the plasma chain smart contract.

------------------------------------------------------------------------------

deposit
=======

.. code-block:: javascript

    contract.deposit(address, token, amount)

Deposits some value of a token to the plasma smart contract.

----------
Parameters
----------

1. ``address`` - ``string``: Address to deposit with.
1. ``token`` - ``string``: Address of the token to deposit.
2. ``amount`` - ``number``: Amount to deposit.

-------
Returns
-------

``EthereumTransaction``: An Ethereum transaction receipt.

------------------------------------------------------------------------------

getBlock
========

.. code-block:: javascript

    contract.getBlock(block)

Returns the hash of a specific block.

----------
Parameters
----------

1. ``block`` - ``number``: Number of the block to return.

-------
Returns
-------

``string``: The block hash.
