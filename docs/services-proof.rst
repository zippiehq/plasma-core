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
``checkProof(transaction, proof)``

**Description**

Checks the validity of a transaction using the given proof.

**Params**

1. ``transaction`` - A Transaction_ object.
2. ``proof`` - A Proof_ object.

**Return**

1. ``boolean`` - ``true`` if the transaction is valid, ``false`` otherwise.

.. _transaction proof specification: spec-proofs
.. _Transaction: spec-transactions#transaction-object
.. _Proof: spec-proofs#proof-object
