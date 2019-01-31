==============
Smart Contract and Exit Games
==============
The proof for a chain of custody isn't useful unless it can also be passed to the main chain to keep funds secure. The mechanism which accepts proofs on-chain is the core of plasma's security model, and it is called the "exit game."

When a user wants to move their money off a plasma chain, they make an "exit", which opens a dispute period. At the end of the dispute period, if there are no outstanding disputes, the money is sent from the plasma contract on the main chain to the exiter. During the dispute period, users may submit "challenges" which claim the money being exited isn't rightfully owned by the person exiting. The proofs described above guarantee that a "response" to these challenges is always calculable.

The goal of the exit game is to keep money secured, even in the case of a maximally adversarial operator. Particularly, there are three main attacks which we must mitigate:

- Data withholding: the operator may publish a root hash to the contract, but not tell anybody what the contents of the block are.
- Including a forged/invalid transaction: the operator may include a transaction in a block whose ``sender`` was not the previous ``recipient`` in the chain of custody.
- Censorship: after someone deposits their money, the operator may refuse to publish any transactions sending the money.

In all of these cases, the challenge/response protocol of the exit game makes sure these behaviors do not allow theft, in at most 1 challenge followed by 1 response.

Keeping track of deposits and exits
======
*Deposits mapping*
Each time a new set of coins is deposited, the contract updates a mapping which each contain a ``deposit`` struct. From the contract:

..code-block:: python

  struct deposit:
   untypedStart: uint256
   depositer: address
   precedingPlasmaBlockNumber: uint256
   
Note that this struct contains neither the ``untypedEnd`` or ``tokenType`` for the deposit. That's because the contract uses those values as the keys in a mapping of mappings. Accessing, for example, accessing the depositer of a given deposit looks like this: ``someDepositer: address = self.deposits[tokenType][untypedEnd].depositer``

This choice saves a little gas, and also makes some of the code cleaner since we don't need to store any sort of deposit ID to reference a deposit.

*Exitable ranges mapping*

In addition to adding self.deposits entries each time there's a deposit, the contract needs to somehow keep track of historical exits to prevent multiple exits on the same range. This is a little trickier because exits do not occur in order like deposits, and it would be expensive to search through a list of exits.

Our contract implements a constant-sized solution, which instead stores a list of exitable ranges, updating the list as new exits occur. From the smart contract:

..code-block:: python

  struct exitableRange:
   untypedStart: uint256
   isSet: bool

Again, we use a double-nested mapping with keys ``tokenType`` and ``untypedEnd`` so that we may call ``self.exitable[tokenType][untpyedEnd].untypedStart`` to access the start of the range. Note that Vyper returns 0 for all unset mapping keys, so we need an ``isSet`` bool so that users may not "trick" the contract by passing an unset ``exitableRange``.

The contract's ``self.exitable`` ranges are split and deleted based on successful calls to ``finalizeExit`` via a helper function called ``removeFromExitable``. Note that exits on a previously exited range do not even need to be challenged; they will never pass the ``checkRangeExitable`` function called in ``finalizeExit``. You can find that code `here`.

Exit games' relationship to vanilla Plasma Cash
=====
At heart, the exit games in our spec are very similar to the original Plasma Cash design. Exits are initiated with calls to the function

``beginExit(tokenType: uint256, blockNumber: uint256, untypedStart: uint256, untypedEnd: uint256) -> uint256:``

To dispute an exit, all challenges specify a particular coinID called into question, and a Plasma Cash-style challenge game is carried out on that particular coin. Just a single coin needs to be proven invalid to cancel the entire exit.

Both exits and the two types of respondable challenges are given an ``exitID`` and ``challengeID`` which are assigned in order via an incrementing ``challengeNonce`` and ``exitNonce``.

Blocknumber-specified transactions
=====
In the original Plasma Cash spec, the exiter is required to specify both the exited transaction and its previous "parent" transaction to prevent the "in-flight" attack where the operator delays including a valid transaction and inserts an invalid one in the block between.

This poses a problem for our range-based schemes, because a transaction may have multiple parents. For example, if Alice sends ``(0, 50]`` to Carol, and Bob sends ``(50, 100]`` to Carol, Carol can now send ``(0, 100]`` to Dave. But, if Dave wants to exit that, both the ``(0, 50]`` and ``(50, 100]`` are parents.

Though specifying multiple parents is definitely doable, this specification would be gas-expensive and seemed more complex to implement. So, we opted for the simpler alternative, in which each transaction specifies the `block` its senders intend for it to go in and is invalidated if included in a different block. This solves the in-flight attack and means the contract does not need a transaction's parents. For those interested in a formal writeup and safety proof for this scheme, it's worth giving `this great post` a look.

Per-coin transaction validity
=====
An unintuitive property of our exit games worth noting up front is that a certain transaction might be "valid" for some of the coins in its range, but not on others.

For example, imagine that Alice sends ``(0, 100]`` to Bob, who in turn sends ``(50, 100]`` to Carol. Carol does not need to verify that Alice was the rightful owner of the full ``(0, 100]``. Carol only needs an assurance that Alice owned ``(50, 100]``  - the part of the custody chain which applies to her receipt. Though the transaction might in a sense be "invalid" if Alice didn't own ``(0, 50]``, the smart contract does not care about that for the purposes of disputes around exits for the coins ``(50, 100]``. So long as the received coins' ownership is verified, the rest of the transactions don't matter.

This is a very important requirement to preserve the size of light client proofs. If Carol had to check the full ``(0, 100]``, she might also have to check an overlapping parent of ``(0, 10000]``, and then all of its parents, and so on. This "cascading" effect could massively increase the size of proofs if transactions were very interdependent.

Note that this property also applies to atomic multisends which describe multiple ranges being swapped. If Alice trades 1 ETH for Bob's 1 DAI, it is Alice's responsibility to check that Bob owns the 1 Dai before signing. However, after, if Bob then sends the 1 ETH to Carol, Carol need not verify that Bob owned the 1 DAI, only that Alice owned the 1 ETH she sent to Bob. Alice incurred the risk, so Carol doesn't have to.

From the standpoint of the smart contract, this property is a direct consequence of challenges always being submitted for a particular ``coinID`` within the exit.

How the contract handles transaction checking
======
Note that, to be used in exit games at all, ``Transaction``s must pass the ``TransactionProof`` check described in the proofs section above(valid signatures, branch bounds, etc). This check is performed at the contract level in the function

``def checkTransactionProofAndGetTypedTransfer(
   transactionEncoding: bytes[277],
   transactionProofEncoding: bytes[1749],
   transferIndex: int128
 ) -> (
   address, # transfer.to
   address, # transfer.from
   uint256, # transfer.start (typed)
   uint256, # transfer.end (typed)
   uint256 # transaction plasmaBlockNumber
 ):``
 
 An important note here is the ``transferIndex`` argument. Remember, a transaction may contain multiple transfers, and must be included once in the tree for each transfer. However, since challenges refer to a specific ``coinID``, only a single transfer will be relevant. So, challengers and responders gives a ``transferIndex``  - whichever of the transfers relates to the coin being disputed. The check decodes and checks all the ``TransferProof``s in the ``TransactionProof``, and then checks inclusion for each with the function
 
 ``def checkTransferProofAndGetTypedBounds(
 leafHash: bytes32,
 blockNum: uint256,
 transferProof: bytes[1749]
) -> (uint256, uint256): # typedimplicitstart, typedimplicitEnd``

Challenges which immediately cancel exits
=====
Two kinds of challenges immediately cancel exits: those on spent coins and those on exits before the deposit occurred.

**Spent coin challenge**
This challenge is used to demonstrate that the exiter of a transaction already sent the coins to someone else.

``@public
def challengeSpentCoin(
 exitID: uint256,
 coinID: uint256,
 transferIndex: int128,
 transactionEncoding: bytes[277],
 transactionProofEncoding: bytes[1749],
):
``

It uses ``checkTransactionProofAndGetTypedTransfer`` and then checks the following:

1. The challenged coinID lies within the specified exit.
2. The challenged coinID lies within the ``typedStart`` and ``typedEnd`` of the ``transferIndex``th element of ``transaction.transfers``.
3. The ``plasmaBlockNumber`` of the challenge is greater than that of the exit.
4. The ``transfer.sender`` is the exiter.

The introduction of atomic swaps does mean one thing: the spent coin challenge period must be strictly less than others, because of an edge case in which the operator withholds an atomic swap between two or more parties. In this case, those parties must exit their pre-swapped coins, forcing the operator to make a a spent coin challenge and reveal whether the swap was included or not. BUT, if we allowed the operator to do that at the last minute, it would make for be a race condition where the parties have no time to use the reveal to cancel other exits. Thus, the timeout is made shorter (1/2) than the regular challenge window, eliminating "last-minute response" attacks.

**Before deposit challenge**
This challenge is used to demonstrate that an exit comes from an earlier ``plasmaBlockNumber`` than that coin was actually deposited for.

``@public
def challengeBeforeDeposit(
 exitID: uint256,
 coinID: uint256,
 depositUntypedEnd: uint256
):``

The contract looks up ``self.deposits[self.exits[exitID].tokenType][depositUntypedEnd].precedingPlasmaBlockNumber`` and checks that it is later than the exit's block number. If so, it cancels.

Optimistic exits and inclusion challenges
======
Our contract allows an exit to occur without doing any inclusion checks at all in the optimistic case. To allow this, any exit may be challenged directly via
``@public
def challengeInclusion(exitID: uint256):``

To which the exiter must directly respond with either the transaction or deposit they are exiting from.

``@public
def respondTransactionInclusion(
 challengeID: uint256,
 transferIndex: int128,
 transactionEncoding: bytes[277],
 transactionProofEncoding: bytes[1749],
):
...
@public
def respondDepositInclusion(
 challengeID: uint256,
 depositEnd: uint256
):``

The second case allows users to get their money out if the operator censored all transactions after depositing.
Both responses cancel the challenge if:
1. The deposit or transaction was indeed at the exit's plasma block number.
2. The depositer or recipient is indeed the exiter.
3. The start and end of the exit were within the deposit or transfer's start and end

Invalid History Challenges
=====
The most complex challenge-response game, for both vanilla Plasma Cash and this spec, is the case of history invalidity. This part of the protocol mitigates the attack in which the operator includes an forged "invalid" transaction whose sender is not the previous recipient. The solution is called an invalid history challenge: because the rightful owner has not yet spent their coins, they attest to this and challenge: "oh yeah, that coin is yours? Well it was mine earlier, and you can't prove I ever spent it."

Both invalid history challenges and responses can be either deposits or transactions.

**Challenging**
There are two ways to challenge depending on the current rightful owner:

``@public
def challengeInvalidHistoryWithTransaction(
 exitID: uint256,
 coinID: uint256,
 transferIndex: int128,
 transactionEncoding: bytes[277],
 transactionProofEncoding: bytes[1749]
):``

and

``@public
def challengeInvalidHistoryWithDeposit(
 exitID: uint256,
 coinID: uint256,
 depositUntypedEnd: uint256
):``

These both call a

``@private
def challengeInvalidHistory(
 exitID: uint256,
 coinID: uint256,
 claimant: address,
 typedStart: uint256,
 typedEnd: uint256,
 blockNumber: uint256
):``

function which does the legwork of checking that the coinID is within the challenged exit, and that the blockNumber is earlier than the exit.

**Responding to invalid history challenges**

Of course, the invalid history challenge may be a grief, where really the challenger did spend their coin, and the chain of custody is indeed valid. We must allow this response. There are two kinds.

The first is to respond with a transaction showing the challenger's spend:

``@public
def respondInvalidHistoryTransaction(
 challengeID: uint256,
 transferIndex: int128,
 transactionEncoding: bytes[277],
 transactionProofEncoding: bytes[1749],
):``

The smart contract then performs the following checks:
1. The ``transferIndex``th ``Transfer`` in the ``transactionEncoding`` covers the challenged ``coinID``.
2. The ``transferIndex``th ``transfer.sender`` was indeed the claimant for that invalid history challenge.
3. The transaction's plasma block number lies between the invalid history challenge and the exit.

The other response is to show the challenge came before the coins were actually deposited - making the challenge invalid. This is similar to the ``challengeBeforeDeposit`` for exits themselves.

``@public
def respondInvalidHistoryDeposit(
 challengeID: uint256,
 depositUntypedEnd: uint256
):``

In this case, there is no check on the sender being the challenge recipient, since the challenge was invalid. So the contract must simply check:
1. The deposit covers the challenged ``coinID``.
2. The deposit's plasma block number lies between the challenge and the exit.

If so, the exit is cancelled.

This concludes the complete exit game specification. With these building blocks, funds can be kept safe even in the case of a maximally malicious plasma chain.


.. _here:: https://github.com/plasma-group/plasma-contracts/blob/068954a8584e4168daf38ebeaa3257ec08caa5aa/contracts/PlasmaChain.vy#L380
.. _`this great post`:: https://ethresear.ch/t/plasma-cash-with-smaller-exit-procedure-and-a-general-approach-to-safety-proofs/1942
