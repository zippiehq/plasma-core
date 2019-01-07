============
Transactions
============

Ranges
======
Assets in Plasma Prime are represented as *ranges*. 
You can think of ranges like pieces of a `number line`_.
Each range has a `start` and an `end`, usually written as `(start, end`)
Each range also has a `length`, which can be calculated as `end - start`.
For further background on the research and motivations that led to this format, see `this ethresearch post`_.

The `length` of a specific range represents the "value" of that range, depending on the token and base unit being used.
For example, the range `(0, 100)` represents 100 "units" of some token.

A user can own arbitrarily many ranges.
However, as we'll discuss later, each additional range slightly increases the total data requirements for that user.
For this reason, it's in the users' best interests to reduce the total number of ranges they own at any one point in time.

Ranges can be split apart as much as a user wants.
If a user owns `(0, 100)`, they can send `(0, 100)` or `(0, 50)` or `(25, 50)` or any other sub-range of `(0, 100)`.
Ranges can also be merged together, but only if they're directly adjacent to one another.
For example, `(0, 100)` and `(100, 200`) can be merged into `(0, 200)`, but `(0, 100)` and `(200, 300)` cannot be combined.


TransferRecord Object
==================
A transaction contains a list of `TransferRecord`s which represent the ranges being transacted.  The TransferRecord object takes the following format:

.. code-block:: JSON

    {
        start: number (16 bytes),
        end: number (16 bytes),
        from: sender's address,
        to: recipient's address
    }

``from`` and ``to`` must both be valid 20 byte Ethereum addresses_.

The ``start`` and ``end`` values are 16 bytes each.  To allow the chain to support multiple ERC20s, this total "number line" of coins is split into 4 bytes' worth of "sections" for different tokens.  Thus remaining 12 bytes' (=68,719,476,736) will be the chain's maximum capacity for each token.  For example, if the chain has no deposits, users might recieve coins with a `start` of ``0x00000000000000000000000000000000``  when depositing ERC20 token A into the chain and ``0x00000001000000000000000000000000`` when depositing token B.  The maximum deposits for token A and B would go up to ``0x00000000ffffffffffffffffffffffff`` and ``0x00000001ffffffffffffffffffffffff``, respectively.

Transaction Object
==================
All transactions must take the following format:

.. code-block:: JSON

    {
        blockNumber: number
        transfers: [
            tr1: TransferRecord,
            tr2: TransferRecord,
            ...
        ],
        signatures: [
            sig1: {v: number, r: number, s: number},
            sig2: {v: number, r:number, s: number}
        ]
    }
The block number must be specified and a transaction's validity is dependent on being included in the same plasma block as described.  This is in accordance to the simplified Plasma Cash exit game as described in `this post`_.
The ``signature`` s must be created over the hash of the list of encoded ``TransferRecord`` s.
``plasma-core`` uses a `custom encoding scheme`_ to simplify the decoding process on Etheruem.

.. _number line: https://en.wikipedia.org/wiki/Number_line
.. _this ethresearch post: https://ethresear.ch/t/plasma-cash-was-a-transaction-format/4261
.. _proof specificaton: specs/proofs.html
.. _addresses: https://en.wikipedia.org/wiki/Ethereum#Addresses
.. _this post: 
.. _custom encoding scheme: specs/encoding.html
