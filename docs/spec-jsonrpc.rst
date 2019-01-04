===========================
JSON-RPC Call Specification
===========================

.. code-block::

    pg_getBalance

Returns the balance of a specific account.

----------
Parameters
----------

1. `address` Address of the account to query.

-------
Returns
-------
A list of token balances in the form `(token, balance)`.

------------------------------------------------------------------------------

.. code-block::

    pg_getBlock

Pulls information about the block at a specific height.

----------
Parameters
----------

1. `block` Number of the block to query.

-------
Returns
-------

Information about the specified block.

------------------------------------------------------------------------------

.. code-block::

    pg_getTransaction

Pulls information about a specific transaction.

----------
Parameters
----------

1. `hash` The hash of the transaction.

-------
Returns
-------

Information about the specified transaction.

------------------------------------------------------------------------------

.. code-block::

    pg_sendTransaction

Sends a transaction to the node to be processed.

----------
Parameters
----------

1. `transaction` A transaction object.
    * `from` Address from which the transaction was sent.
    * `to` Address to which the transaction was sent.
    * `token` ID of the token to be sent.
    * `value` Value of tokens to be sent.

-------
Returns
-------

The hash of the transaction.

------------------------------------------------------------------------------

.. code-block::

    pg_sendRawTransaction

Sends a signed transaction to the node to be processed.

----------
Parameters
----------

1. `transaction` Raw signed transaction data.

-------
Returns
-------

The hash of the transaction.
