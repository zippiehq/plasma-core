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
