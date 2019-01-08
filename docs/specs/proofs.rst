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

History Format
------------
History proofs consist of a set of *deposit records* and long list of *proof elements*.

Deposit Records
~~~~~~~~~~~~~~~
Every received range_ has to come from a corresponding deposit_.
A deposit record consists of a ``start``, ``end``, and the ``blockNumber`` in which that range was deposited.

Proof Elements
~~~~~~~~~~~~~~~~~~~
Proof elements contain all the necessary information required to convince the recipient that they can now prove to the smart contract that the coin is theirs.  This is primarily the transaction itself and the branches of the Merkle sum tree which prove the transaction's inclusion and validity.
All proof elements must take the following format:

.. code-block:: javascript

    {
        transaction: '0xabc123...' (encoded transaction)
        branches: [
            parsedSum: number (16 bytes),
            leafIndex: number,
            siblings: ['0xcde456...' (sibling nodes, 48 bytes each)]
        ]
    }
    
For more details on the decoded form of `transaction` objects, see `encoding`_.  Note that the `branches` element is an array--this is because a transaction can consist of more than 1 transfer (e.g. if it's a trade between DAI tokens and ETH).  For each of its transfers, a transaction must be included on a separate branch over the relevant part of the merkle sum tree.  The ``leafIndex`` tells us which slot in the tree that was, allowing us to reconstruct the binary path and therefore tell whether each of the ``sibling`` s were on the left or right side.  The ``parsedSum`` tells us what ``sum`` value the operator gave to the transaction's direct parent node (see `sum-tree`_ for more details).

Proof Steps
-----------
Checking Proof Relevancy
~~~~~~~~~~~~~~~~~~~~~~~~
The proof checking process begins by verifying that the given proof is actually relevant to the range in question.
This is more of an optimization than anything (and is not yet implemented).
Ideally, the prover would be honest and wouldn't try to send over nonsense proofs.
In the case that the prover is malicious, this mechanism ensures that a client doesn't have to do a bunch of unnecessary proof checking.
The simplest way to implement this step is to check that the range referenced in each proof element overlaps with the range in question.
Here's what that roughly looks like in python:

.. code-block:: python

    def filter_relevant_proof_elements(range, proof_elements):
        relevant_proof_elements = []
        for proof_element in proof_elements:
            if (max(proof_element.start, range.start) <= max(proof_element.end, range.end)):
                relevant_proof_elements.append(proof_element)
        return relevant_proof_elements

Applying Proof Elements
~~~~~~~~~~~~~~~~~~~~~~~
Once we've filtered out any irrelevant proof elements, we can get to the core of the verification process.
Basically, this process involves applying each proof element to the current "verified" state.
If any proof element doesn't result in a valid state transition, we simply reject the proof.

The process for applying each proof element is very simple.
We assume that the verifier has no prior knowledge, so our verified state starts out empty. (Alternatively, if the client has previously owned a range, we might "skip ahead" to that checkpoint in the relevancy filter above--for now, that's a premature optimization.)

Snapshot Objects
~~~~~~~~~~~~~~~~~
The way in which we keep track of historically owned ranges is called a ``snapshot``.  Quite simply, it represents the verified owner of a range at a block:

.. code-block:: javascript

    {
        start: number,
        end: number,
        blockNumber: number,
        owner: address
    }

First, we verify any given **deposit records**.
For each deposit record, the verifier **must** double-check with Ethereum to verify that the claimed deposit did indeed occur, and that no exits have happened in the meantime.  If so, the ``verifiedSnapshots`` array is initialized to these deposits with the each ``snapshot.owner`` being the depositer.

Next, we apply all given **transaction proofs**.
For each transaction record, the verifier performs the following steps:

1. Verify that the given proof element is valid. (see section below) If not, throw an error.
2. Increment the ``blockNumber`` for all ``verifiedSnapshots`` which both
    a. intersect the transaction's covered range, and
    b. have a ``blockNumber`` equalling ``proof.transaction.blockNumber - 1``
3. For each ``transfer`` in the ``transaction``, do the following:
    a. "Split" any snapshots which were updated above at ``transfer.start`` and ``transfer.end``
    b. For each split ``snapshot`` which fell between ``transfer.start`` and ``transfer.end``:
        i. verify that ``snapshot.owner === ``transfer.from``.  If not, throw an error.
        ii. set ``snapshot.owner = transfer.to``

Note that 2b. means that the ``proofs`` in the ``history`` must be ordered ascending in ``blockNumber``.

Once this operation has been recursively applied to all ``proof`` elements, the client may check for herslef which new coins she now owns, by searching for all elements in ``verifiedSnapshots`` with a ``blockNumber`` equalling the current plasma block, and the ``owner`` equalling her address.

Checking Transaction Validity
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
The transaction validity check in step 1. above is equivalent to checking the smart contract's validity condition.  For more details, see the `sum-tree`_ section of this documentation.  However, the basic checks are as follows:

1. Check that the transaction encoding is well-formed
2. Check that each `signature` in the transaction corresponds to its ``transfer.from`` address
3. For each ``transfer`` in ``proof.transaction``:
    a. verify that the corresponding sum tree ``branch`` has a root equal to the root hash for that plasma block
    b. calculate the ``implicitStart`` and ``implicitEnd`` of the ``branch``, and verify that ``implicitStart <= transfer.start < transfer.end <= implicitEnd``


.. _range: specs/transactions.html#ranges
.. _transaction: specs/transactions.html
.. _Merkle sum tree inclusion proof: specs/sum-tree.html#inclusion-proof
.. _proof of inclusion: specs/sum-tree.html#inclusion-proof
.. _proof of non-inclusion: specs/sum-tree#non-inclusion-proof
.. _deposit: specs/contract.html#deposits
