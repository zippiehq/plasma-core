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
``plasma-core`` follows a relatively simple methodology for verifying incoming transaction proofs.
This section describes that methodology and provides some examples for different scenarios.

Proof Format
------------
Transaction proofs consist of a long list of *proof elements*.
There are two different types of proof elements, *transactions records* and *deposit records*.

Transaction Records
~~~~~~~~~~~~~~~~~~~
Transaction records are made up of a transaction_ and a corresponding `Merkle sum tree proof`_.
The transaction's Merkle sum tree proof attests that the transaction was correctly included in the plasma chain.
The prover must provide a ``null transaction`` and a `proof of non-inclusion`_ for any blocks in which the incoming transaction's component ranges were not transferred.

Deposit Records
~~~~~~~~~~~~~~~
Every range_ has to come from a corresponding deposit_.
A deposit record consists of a range and the number of the block in which that range was deposited.

Proof Steps
-----------
Checking Proof Relevancy
~~~~~~~~~~~~~~~~~~~~~~~~
The proof checking process begins by verifying that the given proof is actually relevant to the range in question.
This is more of an optimization than anything.
Ideally, the prover would be honest and wouldn't try to send over nonsense proofs.
In the case that the prover is malicious, this mechanism ensures that a client doesn't have to do a bunch of unnecessary proof checking.
The simplest way to implement this step is to check that the range referenced in each proof element overlaps with the range in question.
Here's what that looks like in python:

.. code-block:: python

    def filter_relevant_proof_elements(range, proof_elements):
        relevant_proof_elements = []
        for proof_element in proof_elements:
            if (max(proof_element.start, range.start) <= max(proof_element.end, range.end)):
                relevant_proof_elements.append(proof_element)
        return relevant_proof_elements

In this step we can also carry out other "proof sanitization," like checking that the `start` of each range comes before its `end`. 

Applying Proof Elements
~~~~~~~~~~~~~~~~~~~~~~~
Once we've filtered out any irrelevant proof elements, we can get to the core of the verification process.
Basically, this process involves applying each proof element to the current "verified" state.
If any proof element doesn't result in a valid state transition, we simply reject the proof.

The process for applying each proof element is very simple.
We assume that the verifier has no prior knowledge, so our verified state starts out empty.

First, we apply any given **deposit records**.
For each deposit record, the verifier **must** double-check with Ethereum to verify that the given block number is valid.

Next, we apply any given **transaction records**.
For each transaction record, the verifier **must** check that:

1. The proof element is a ``null transaction``.
2. The given `proof of non-inclusion`_ is valid.

OR

1. The proof element is **not** a ``null transaction``.
2. The signature on the transaction record was created by previous owner of the range.
3. The given block is equal to the previous block plus one.
4. The given `proof of inclusion`_ is valid.

If these conditions are not met for *any* given proof element, the verifier **must** reject the proof.
Otherwise, the verifier updates their verified state to reflect the new information provided by the proof element.

Asserting Transaction Validity
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
The final step of the verification process is to apply the incoming transaction to the verified state.
If this step is successful, then the proof is valid!
The verifier can then save the proof into their local database for future use.

Proof Object
============

.. _range: specs/transactions.html#ranges
.. _transaction: specs/transactions.html
.. _Merkle sum tree inclusion proof: specs/sum-tree.html#inclusion-proof
.. _proof of inclusion: specs/sum-tree.html#inclusion-proof
.. _proof of non-inclusion: specs/sum-tree#non-inclusion-proof
.. _deposit: specs/contract.html#deposits
