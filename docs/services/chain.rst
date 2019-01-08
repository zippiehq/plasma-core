============
ChainService
============

Description
===========
``ChainService`` does most of the heavy lifting when it comes to receiving and sending transactions.
This service handles inserting new transactions into the local store of transactions.
It also handles updating the database whenever the user spends a transaction.

API
===
.. code-block:: javascript

    getOwnedRanges (address)

Returns the list of ranges that the user owns.

----------
Parameters
----------

1. ``address`` - ``String``: Address of the user to query.

-------
Returns
-------

``Array<{ start: Number, end: Number }>``: A list of ranges owned by that address.

------------------------------------------------------------------------------

.. code-block:: javascript

    getBalances (address)

Returns a list of balances for a user.

----------
Parameters
----------

1. ``address`` - ``String``: Address of the user to query.

-------
Returns
-------

``Object``: An object where keys are tokens and values are the balances.

------------------------------------------------------------------------------

.. code-block:: javascript

    getTransaction (hash)

Returns the transaction with the given hash.

----------
Parameters
----------

1. ``hash`` - ``String``: Hash of the transaction to query.

-------
Returns
-------

``Object``: A Transaction_ object.

------------------------------------------------------------------------------

.. code-block:: javascript

    hasTransaction (hash)

Checks if the database has a specific transaction.

----------
Parameters
----------

1. ``hash`` - ``String``: Hash of the transaction to check.

-------
Returns
-------

``boolean``: ``true`` if the database has the transaction, ``false`` otherwise.

------------------------------------------------------------------------------

.. code-block:: javascript

    getBlockHeader (block)

Returns the header of the block with the given number.

----------
Parameters
----------

1. ``block`` - ``Number``: Number of the block to query.

-------
Returns
-------

``String``: A block hash.

------------------------------------------------------------------------------

.. code-block:: javascript

    addBlockHeader (block, header)

Stores a block header.

----------
Parameters
----------

1. ``block`` - ``Number``: Number of the block to store.
2. ``header`` - ``String``: Hash of the given block.

-------
Returns
-------

N/A

------------------------------------------------------------------------------

.. code-block:: javascript

    addTransaction (transaction, proof)

Adds a transaction to the database if it's valid.

----------
Parameters
----------

1. ``transaction`` - ``Transaction``: A Transaction_ object.
2. ``proof`` - ``Proof``: A Proof_ object.

.. _Transaction: specs/transactions.html#transaction-object
.. _Proof: specs/proofs.html#proof-object
