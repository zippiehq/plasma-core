======
Proof Structure and Checking
======
Unlike traditional blockchain systems, full plasma nodes don't store every single transaction, they only ever need to store information relevant to assets they own. This means that the ``sender`` has to prove to the ``recipient`` that the sender actually owns the given range. A complete proof contains all the information sufficient to guaranteed that, if the Ethereum chain itself does not fork, tokens are redeemable on the main chain.

Proofs primarily consist of the inclusion for transactions, which update the chain of custody for those coins. The inclusion roots must be checked against the block hashes submitted by the operator to the smart contract on the main chain. By tracing the chain of custody as verified in the proof scheme, from a token's initial deposit into the contract  through to the present, ability to redeem is guaranteed.

``plasma-core`` follows a relatively simple methodology for verifying incoming transaction proofs. This section describes that methodology.

Proof Format
=====
History proofs consist of a set of deposit records and long list of relevant ``Transactions`` with corresponding ``TransctionProofs``.

``plasma-utils`` exposes a ``static checkTransactionProof(transaction, transactionProof, root)`` method, which is used by ``plasma-core`` `here` via calls to the ``ProofService``.

Transaction Proofs
=====
A `TransactionProof` object contains all the necessary information to check the validity of a given `Transaction`. Namely, it is `simply` an array of ``TransferProof`` objects. As per the block spec's section on atomic multisends, a given ``TransactionProof`` is valid if and only if all its ``TransferProofs`` are valid.

Transfer Proofs
=====
``TransferProofs`` contain all the necessary information required to recover the inclusion of a valid branch corresponding to the given ``Transfer`` in the ``Transaction`` at the correct block number. This constitutes:

* The actual nodes of the Merkle sum tree which represent the branch's full `inclusionProof`
* The index of the leaf to calculate the binary path traced by the branch
* The parsed bottom .sum as described in the sum tree spec above
* The signature for that particular sender.

Right from the ``plasma-utils`` schema:

.. _code-block:: javascript

const TransferProofSchema = new Schema({
 parsedSum: {
   type: Number,
   length: 16
 },
 leafIndex: {
   type: Number,
   length: 16
 },
 signature: {
   type: SignatureSchema
 },
 inclusionProof: {
   type: [Bytes],
   length: 48
 }
})

Note that the `inclusionProof` is a variable-length array whose size depends on the depth of the tree.

Proof Steps
======
The core of the verification process involves applying each proof element to the current "verified" state, starting with the deposit. If any proof element doesn't result in a valid state transition, we must reject the proof.

The process for applying each proof element is intuitive; we simply apply the transactions at each block as the contract's custody rules dictate.

Snapshot Objects
======
The way in which we keep track of historically owned ranges is called a ``snapshot``.

Quite simply, it represents the verified owner of a range at a block:

```
{
  typedStart: Number,
  typedEnd: Number,
  block: Number,
  owner: address
}
```

Deposit records
====
Every received range has to come from a corresponding deposit.

A deposit record consists of its ``token``, ``start``, ``end``, ``depositer``, and ``blockNumber``.

For each deposit record, the verifier must double-check with Ethereum to verify that the claimed deposit did indeed occur, and that no exits have happened in the meantime.

If so, a ``verifiedSnapshots`` array is initialized to these deposits with each ``snapshot.owner`` being the depositer.

Next, we apply all given ``TransactionProof``s, updating ``verifiedSnapshots`` accordingly. For each ``transaction`` and corresponding ``transactionProof``, the verifier performs the following steps:

1. Verify that the given proof element is valid. If not, throw an error.
2. For each ``transfer`` in the ``transaction``, do the following:
  a. "Split" any snapshots which were updated above at ``transfer.typedStart``, ``transfer.typedEnd``, ``implicitStart``, and ``implicitEnd``
  b. Increment the ``.block`` number for all resulting ``verifiedSnapshots`` which have a ``block`` equalling ``transaction.blockNumber - 1``
  c. For each split ``snapshot`` which fell between ``transfer.start`` and ``transfer.end``:
    i. verify that ``snapshot.owner === transfer.from``. If not, throw an error.
    ii. set ``snapshot.owner = transfer.sender``.

TransactionProof Validity
======

The transaction validity check in step 1. above is equivalent to checking the smart contract's validity condition. The basic validity check, based on the sum tree specification above, is as follows:

1. Check that the transaction encoding is well-formed.
2. For each ``transfer`` and corresponding ``transferProof``:
  a. Check that the ``signature`` resolves to its ``transfer.sender`` address
  b. verify that the ``inclusionProof`` has a root equal to the root hash for that plasma block, with the binary path defined by the ``leafIndex``
  c. calculate the ``implicitStart`` and ``implicitEnd`` of the branch, and verify that ``implicitStart <= transfer.start < transfer.end <= implicitEnd``.







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
Proof elements contain all the necessary information required to convince the recipient that they can now prove to the smart contract that the coin is theirs.
This is primarily the transaction itself and the branches of the Merkle sum tree which prove the transaction's inclusion and validity.
All proof elements must take the following format:

.. code-block:: javascript

    {
        transaction: Transaction
        branches: [
            {
                parsedSum: Number,
                leafIndex: Number,
                siblings: Array<String> // (sibling nodes, 48 bytes each)
            },
            ...
        ]
    }

For more details on the decoded form of `transaction` objects, see `encoding`_.
Note that the `branches` element is an array because a transaction can consist of more than 1 transfer (e.g. if it's a trade between DAI tokens and ETH).
For each of its transfers, a transaction must be included on a separate branch over the relevant part of the merkle sum tree.
The ``leafIndex`` tells us which slot in the tree that was, allowing us to reconstruct the binary path and therefore tell whether each of the siblings were on the left or right side.
The ``parsedSum`` tells us what ``sum`` value the operator gave to the transaction's direct parent node (see `sum tree`_ for more details).

Proof Steps
-----------
Checking Proof Relevancy
~~~~~~~~~~~~~~~~~~~~~~~~
The proof checking process begins by verifying that the given proof is actually relevant to the range in question.
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
We assume that the verifier has no prior knowledge, so our verified state starts out empty.
Alternatively, if the client has previously owned a range, we might "skip ahead" to that checkpoint in the relevancy filter above--for now, that's a premature optimization.

Snapshot Objects
~~~~~~~~~~~~~~~~~
The way in which we keep track of historically owned ranges is called a ``snapshot``.
Quite simply, it represents the verified owner of a range at a block:

.. code-block:: javascript

    {
        start: Number,
        end: Number,
        block: Number,
        owner: String
    }

First, we verify any given **deposit records**.
For each deposit record, the verifier **must** double-check with Ethereum to verify that the claimed deposit did indeed occur, and that no exits have happened in the meantime.
If so, the ``verifiedSnapshots`` array is initialized to these deposits with the each ``snapshot.owner`` being the depositer.

Next, we apply all given **transaction proofs**.
For each transaction record, the verifier performs the following steps:

1. Verify that the given proof element is valid. (see section below) If not, throw an error.
2. Increment the ``blockNumber`` for all ``verifiedSnapshots`` which both:
    a. intersect the transaction's covered range, and
    b. have a ``blockNumber`` equalling ``proof.transaction.blockNumber - 1``
3. For each ``transfer`` in the ``transaction``, do the following:
    a. "Split" any snapshots which were updated above at ``transfer.start`` and ``transfer.end``
    b. For each split ``snapshot`` which fell between ``transfer.start`` and ``transfer.end``:
        i. verify that ``snapshot.owner === transfer.from``.  If not, throw an error.
        ii. set ``snapshot.owner = transfer.to``

Note that ``2b.`` means that the ``proofs`` in the ``history`` must be ordered ascending in ``blockNumber``.

Once this operation has been recursively applied to all ``proof`` elements, the client may check for herslef which new coins she now owns, by searching for all elements in ``verifiedSnapshots`` with a ``blockNumber`` equalling the current plasma block, and the ``owner`` equalling her address.

Checking Transaction Validity
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
The transaction validity check in step ``1.`` above is equivalent to checking the smart contract's validity condition.
For more details, see the `sum tree`_ section of this documentation.
However, the basic checks are as follows:

1. Check that the transaction encoding is well-formed
2. Check that each `signature` in the transaction corresponds to its ``transfer.from`` address
3. For each ``transfer`` in ``proof.transaction``:
    a. verify that the corresponding sum tree ``branch`` has a root equal to the root hash for that plasma block
    b. calculate the ``implicitStart`` and ``implicitEnd`` of the ``branch``, and verify that ``implicitStart <= transfer.start < transfer.end <= implicitEnd``


.. _here: https://github.com/plasma-group/plasma-core/blob/3caa359681db62106ba703eb0fd99171ebb86365/src/services/proof/snapshot-manager.js#L117
.. _simply: https://github.com/plasma-group/plasma-utils/blob/master/src/serialization/schemas/transaction-proof.js
.. _schema: https://github.com/plasma-group/plasma-utils/blob/master/src/serialization/schemas/transfer-proof.js


.. _range: specs/transactions.html#ranges
.. _encoding: /encoding.html
.. _sum tree: sum-tree.html
.. _Merkle sum tree inclusion proof: specs/sum-tree.html#inclusion-proof
.. _proof of inclusion: specs/sum-tree.html#inclusion-proof
.. _proof of non-inclusion: specs/sum-tree#non-inclusion-proof
.. _deposit: specs/contract.html#deposits
