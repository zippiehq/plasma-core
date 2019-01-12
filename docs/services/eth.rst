==========
ETHService
==========

Description
===========
``ETHService`` handles all interaction with Ethereum.
This includes things like watching for events, pulling data, or submitting new transactions.

API
===
.. code-block:: javascript

    deposit (token, amount)

Deposits some value of a token to the plasma smart contract.

----------
Parameters
----------

1. ``token`` - ``String``: Address of the token to deposit.
2. ``amount`` - ``Number``: Amount to deposit.

-------
Returns
-------

``any``: An Ethereum transaction receipt.

------------------------------------------------------------------------------

.. code-block:: javascript

    getBlock (block)

Returns information about a block.

----------
Parameters
----------

1. ``block`` - ``Number``: Number of the block to return.

-------
Returns
-------

``any``: Information about the block.
