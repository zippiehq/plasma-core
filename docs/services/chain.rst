============
ChainService
============

``ChainService`` does most of the heavy lifting when it comes to receiving and sending transactions.
This service handles inserting new transactions into the local store of transactions.
It also handles updating the database whenever the user spends a transaction.

------------------------------------------------------------------------------

getOwnedRanges
==============

.. code-block:: javascript

    chain.getOwnedRanges(address)

Returns the list of ranges that the user owns.

----------
Parameters
----------

1. ``address`` - ``string``: Address of the user to query.

-------
Returns
-------

``Array<{ start: number, end: number }>``: A list of ranges owned by that address.

------------------------------------------------------------------------------

getBalances
===========

.. code-block:: javascript

    chain.getBalances(address)

Returns a list of balances for a user.

----------
Parameters
----------

1. ``address`` - ``string``: Address of the user to query.

-------
Returns
-------

``Object``: An object where keys are tokens and values are the balances.

------------------------------------------------------------------------------

getTransaction
==============

.. code-block:: javascript

    chain.getTransaction(hash)

Returns the transaction with the given hash.

----------
Parameters
----------

1. ``hash`` - ``string``: Hash of the transaction to query.

-------
Returns
-------

``Object``: A Transaction_ object.

------------------------------------------------------------------------------

hasTransaction
==============

.. code-block:: javascript

    chain.hasTransaction(hash)

Checks if the database has a specific transaction.

----------
Parameters
----------

1. ``hash`` - ``string``: Hash of the transaction to check.

-------
Returns
-------

``boolean``: ``true`` if the database has the transaction, ``false`` otherwise.

------------------------------------------------------------------------------

getBlockHeader
==============

.. code-block:: javascript

    chain.getBlockHeader(block)

Returns the header of the block with the given number.

----------
Parameters
----------

1. ``block`` - ``number``: Number of the block to query.

-------
Returns
-------

``string``: A block hash.

------------------------------------------------------------------------------

addBlockHeader
==============

.. code-block:: javascript

    chain.addBlockHeader(block, header)

Stores a block header.

----------
Parameters
----------

1. ``block`` - ``number``: Number of the block to store.
2. ``header`` - ``string``: Hash of the given block.

------------------------------------------------------------------------------

addTransaction
==============

.. code-block:: javascript

    chain.addTransaction(transaction, proof)

Adds a transaction to the database if it's valid.

----------
Parameters
----------

1. ``transaction`` - ``Transaction``: A Transaction_ object.
2. ``proof`` - ``Proof``: A Proof_ object.


.. _Transaction: specs/transactions.html#transaction-object
.. _Proof: specs/proofs.html#proof-object
