===============
Merkle Sum Tree
===============
At the heart of our plasma implementation is the block structure: a merkle *sum* tree over all of the ranges in a block.  It allows us to have the security and light client features of the "vanilla" Plasma Cash spec without forcing transactions to be a fixed denomination.  ``Transaction`` objects contain a list of ``TransferRecord`` s which must be included in the relevant parts of the tree.  For a background and motivation on the research, check out `this`_ post.  This document will specify the implementation format of the sum tree we are using.

Merkle Sum Tree Format
=======
In a regular merkle tree, we construct a binary tree of hash nodes, up to a single root node.  Specifying the tree format is a simple matter of defining the ``parent()`` node function, as follows:

.. code-block:: javascript

  parent = function (left, right) { return Sha3(left.concat(right)) }

Where ``Sha3`` is the hash function and ``concat`` appends the two values together.  To create a merkle *sum* tree, the ``parent`` function must also concatenate the result of an addition operation on its children's own ``sum`` values:

.. code-block:: javascript

  parent = function (left, right) { return Sha3(left.concat(right)).concat(left.sum + right.sum)  }
 
Where the ``sum`` property pulls out only the numeric sum at the end of a node.  For example, we would have ``parent(0xabc...0001, 0xdef...0002) === hash(0xabc...0001.concat(0xdef...0002)).concat(0001 + 0002) === 0x123...0003``

Calculating a Branch's Range
======
The reason we use a merkle sum tree is because it allows us to calculate a specific range which a branch describes, and be 100% confident that no other valid branches exist which overlap that range.

We calculate this range by adding up a ``leftSum`` and ``rightSum`` going up the branch.  Initializing both to 0, at each parent verification, if the leaf lies somewhere under the ``left`` child, we take ``rightSum += right.sum``, and if the leaf is under the ``right``, we add ``leftSum += left.sum``.  

Then, the range the branch describes is ``(leftSum, root.sum - rightSum)``.  See the following example:

.. image:: ../_static/images/basic-branch-range-calc.png

In this example, branch 6's valid range is ``(21+3=24, 36-5=31)``.  Notice that ``31-24=7``, which is the sum value for branch 6!
Similarly, branch 5's valid range is ``(21, 36-(7+5)=24)```.  Notice that its end is the same as branch 6's start!

If you play around with it, you'll see that it's impossible to construct a merkle tree with two different branches covering the same range.  At some level of the tree, the sum would have to be broken!  This is how we get light clients.  We call the branch range bounds ``implicitStart`` and ``implicitEnd``, because it turns out they don't necessarily equal the width of the transactions in their leaves:

Parsing Transfers as Leaves
======
In a regular merkle tree, we construct the bottom layer of nodes by hashing the "leaves":

.. image:: https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Hash_Tree.svg/1920px-Hash_Tree.svg.png

In our case, we want the leaves to be the transactions of ranges of coins.  More specifically, we actually want `Transfer`s--signatures don't need to be included, they can be stored by the clients and submitted to the smart contract separately. (For more details on objects and serialization, see the serialization section.)

So--the hashing is straightforward--but what should the bottom nodes' `.sum` values be?  

Given `transferA`, what should the sum value be?  It turns out, _not_ just `transferA.end - transferA.start`.  The reason for this is that it might screw up other branches' rangres.  For example, consider:
.. code-block:: javascript

  transferA: {start: 2, end: 5, to: Carol, from: Alice}
  transferB: {start: 10, end: 15, to: Dave, from: Bob}
  
In this case, if we parsed ``transferA`` into a ``nodeA`` with ``nodeA.sum === 3 (=5-2)``, and ``transferB`` into ``nodeB.sum === 5 (=15-10)`` then the range calculations would be ``(0,3)`` and ``(3,8)``.  Neither of those ranges are the same as the ``transfer``s!  We have to "pad" the sums.  It turns out, there's more than one way to solve this--for example, ``nodeA.sum = 10`` and ``nodeB.sum = 5`` or even ``nodeA.sum = 6`` and ``nodeB.sum = 420``.  For simplicity, we've chosen the following scheme for parsing leaves into blocks:

.. image:: ../_static/images/leaf-parsing.png

Note that making all transfers "left-aligned" is an operator choice which might be changed in the future.  The only thing to be hard-coded at the smart contract level is that the root sum always be the ``MAX_END`` constant--above, it's 100; in practice since ``end`` is 16 bytes so it will be ``2^8^16 - 1``

**Branch Validity and Implicit NoTx**

Thus, the validity condition for a branch as checked by the smart contract is as follows: ``implicitStart <= transfer.start < transfer.end <= implicitEnd`` . Note that, in the original design of the sum tree in Plasma Cashflow, some leaves were filled with ``NoTx`` to represent that ranges were not transacted.  With this format, any coins which are not transacted are simply those between ``(implicitStart, transfer.start)`` and ``(transfer.end, implicitEnd)``.  We call this an "implicit NoTx".

Atomic Multisends
=====
Often (to support transaction fees as well as token trading) transactions require multiple sends to occur or not, atomically, to be valid.  All transactions are serialized as a list of ``Transfer``s -- see the serialization section for more details.  The effect is that transactions needs its entire list of ``Transfers`` to be included in as many branches it has ``Transfer``s--each with a valid sum in relation to that 

.. _`this`: https://ethresear.ch/t/plasma-cash-was-a-transaction-format/4261
