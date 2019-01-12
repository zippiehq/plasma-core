==============
JSON-RPC Calls
==============

pg_getBalance
=============
.. code-block:: javascript

    pg_getBalance

Returns the balance of a specific account.

----------
Parameters
----------

1. ``address`` - ``string``: Address of the account to query.

-------
Returns
-------
A list of token balances in the form `(token, balance)`.

------------------------------------------------------------------------------

pg_getBlock
===========
.. code-block:: javascript

    pg_getBlock

Pulls information about the block at a specific height.

----------
Parameters
----------

1. ``block`` - ``number``: Number of the block to query.

-------
Returns
-------

Information about the specified block.

------------------------------------------------------------------------------

pg_getTransaction
=================
.. code-block:: javascript

    pg_getTransaction

Pulls information about a specific transaction.

----------
Parameters
----------

1. ``hash`` - ``string``: The hash of the transaction.

-------
Returns
-------

Information about the specified transaction.

------------------------------------------------------------------------------

pg_sendTransaction
==================
.. code-block:: javascript

    pg_sendTransaction

Sends a transaction to the node to be processed.

----------
Parameters
----------

1. ``transaction`` - ``Object``:
    * ``from`` - ``string``: Address from which the transaction was sent.
    * ``to`` - ``string``: Address to which the transaction was sent.
    * ``token`` - ``string``: ID of the token to be sent.
    * ``value`` - ``number``: Value of tokens to be sent.

-------
Returns
-------

The hash of the transaction.

------------------------------------------------------------------------------

pg_sendRawTransaction
=====================
.. code-block:: javascript

    pg_sendRawTransaction

Sends a signed transaction to the node to be processed.

----------
Parameters
----------

1. ``transaction`` - ``string``: Raw signed transaction data.

-------
Returns
-------

``String``: The hash of the transaction.

------------------------------------------------------------------------------

pg_getHeight
============
.. code-block:: javascript

    pg_getHeight

Returns the current plasma block height.

----------
Parameters
----------

N/A

-------
Returns
-------

``Number``: The current block height.

------------------------------------------------------------------------------

pg_getRecentTransactions
========================
.. code-block:: javascript

    pg_getRecentTransactions

Returns the most recent transactions.
Because there are a *lot* of transactions in each block, this method is paginated.

----------
Parameters
----------

1. ``start`` - ``Number``: Start of the range of recent transactions to return.
2. ``end`` - ``Number``: End of range of recent transactions to return.

-------
Returns
-------

``Array``: A list of Transaction_ objects.

------------------------------------------------------------------------------

pg_getAccount
=============
.. code-block:: javascript

    pg_getAccount

Returns information about an account.

----------
Parameters
----------

1. ``address`` - ``String``: The account address.

-------
Returns
-------

``Account``: An Account_ object.

------------------------------------------------------------------------------

pg_getTransactionsByAddress
===========================
.. code-block:: javascript

    pg_getTransactionsByAddress

Returns the latest transactions by an address.
This method is paginated and requires a ``start`` and ``end``.
Limited to a total of **25** transactions at a time.

----------
Parameters
----------

1. ``address - ``String``: The address to query.
2. ``start`` - ``Number``: Start of the range of recent transactions to return.
3. ``end`` - ``Number``: End of range of recent transactions to return.

-------
Returns
-------

``Array``: A list of Transaction_ objects.

.. _Transaction: specs/transactions.html#transaction-objects
.. _Account: TODO
