============
ProofService
============

Description
===========
``ProofService`` handles checking the validity of transactions.
In the Plasma Group plasma chain design, each client only receives transactions that are relevant to that client.
The client then needs to check that the received transaction is actually valid.
This is carried out via a transaction proof attached to each transaction.
If you're interested in learning more about transaction proofs, check out our more detailed `transaction proof specification`_ document.

API
===
.. code-block:: javascript

    checkProof (transaction, proof)

Checks the validity of a transaction using the given proof.

----------
Parameters
----------

1. ``transaction`` - ``Object``: A Transaction_ object.
2. ``proof`` - ``Object``: A Proof_ object.

-------
Returns
-------

``boolean``: ``true`` if the transaction is valid, ``false`` otherwise.

.. _transaction proof specification: specs/proofs.html
.. _Transaction: specs/transactions.html#transaction-object
.. _Proof: specs/proofs.html#proof-object
