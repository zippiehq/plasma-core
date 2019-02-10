===============
OperatorService
===============

``OperatorService`` handles all interaction with the operator_.
This includes things like sending transactions and pulling any pending transactions.

------------------------------------------------------------------------------

getPendingTransactions
======================

.. code-block:: javascript

    operator.getPendingTransactions(address)

Gets any pending transactions for an address.
Because we're currently using the operator as a `transaction relay`_, the client must regularly check for and import pending transactions.

----------
Parameters
----------

1. ``address`` - ``string``: Address of the account to query.

-------
Returns
-------

``Promise<Array>``: Hashes of pending transactions for that address.

------------------------------------------------------------------------------

getTransaction
==============

.. code-block:: javascript

    operator.getTransaction(hash)

Returns information about a single transaction.

----------
Parameters
----------

1. ``hash`` - ``string``: Hash of the transaction.

-------
Returns
-------

``Promise<SignedTransaction>``: A Transaction_ object.

------------------------------------------------------------------------------

sendTransaction
===============

.. code-block:: javascript

    operator.sendTransaction(transaction)

----------
Parameters
----------

1. ``transaction`` - ``Transaction``: A signed Transaction_.

-------
Returns
-------

``Promise<string>``: A transaction receipt.


.. _operator: specs/operator.html
.. _transaction relay: TODO
.. _Transaction: specs/transactions.html#transaction-object
