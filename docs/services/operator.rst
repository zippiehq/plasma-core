===============
OperatorService
===============

Description
===========
``OperatorService`` handles all interaction with the Operator_.
This includes things like sending transactions and pulling any pending transactions.

API
===
.. code-block:: javascript

    async getPendingTransactions (address)

Gets any pending transactions for an address.
Because we're currently using the operator as a `transaction relay`_, the client must regularly check for and import pending transactions.

----------
Parameters
----------

1. ``address`` - ``String``: Address of the account to query.

-------
Returns
-------

``Array<String>``: Hashes of pending transactions for that address.

------------------------------------------------------------------------------

.. code-block:: javascript

    async getTransaction (hash)

Returns information about a single transaction.

----------
Parameters
----------

1. ``hash`` - ``String``: Hash of the transaction.

-------
Returns
-------

``Transaction``: A Transaction_ object.

------------------------------------------------------------------------------

.. code-block:: javascript

    async sendTransaction (transaction)

----------
Parameters
----------

1. ``transaction`` - ``Transaction``: A signed Transaction_.

-------
Returns
-------

``Object``: A transaction receipt.

.. _Operator: TODO
.. _transaction relay: TODO
.. _Transaction: specs/transactions.html#transaction-object
