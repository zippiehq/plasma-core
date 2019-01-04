==============
JSON-RPC Calls
==============

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

The hash of the transaction.
