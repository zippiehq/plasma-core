======
Proofs
======

Background
==========
Ownership of a range_ can be transferred from one user to another.
However, unlike traditional blockchain systems, Plasma Prime full nodes don't store every single transaction.
A user only ever needs to store information relevant to assets they own, so they don't keep track of 
This means that the sender has to *prove* to the receiver that the sender actually owns the given range.

Proof Verificaton
=================
``plasma-core`` follows a relatively simple methodology for verifying transaction proofs.
This section describes that methodology and provides some examples for different scenarios.

Proof Object
============

.. _range: specs/transactions.html#ranges

