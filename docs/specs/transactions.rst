============
Transactions
============

Ranges
======
Assets in Plasma Prime are represented as *ranges*. 
You can think of ranges like pieces of a `number line`_.
Each range has a `start` and an `end`, usually written as `(start, end`)
Each range also has a `length`, which can be calculated as `end - start`.

The `length` of a specific range represents the "value" of that range, depending on the token and base unit being used.
For example, the range `(0, 100)` represents 100 "units" of some token.
Our Plasma Prime implementation will initially only have the capability to represent `ETH`.
Fortunately, it's quite trivial to add support for additional tokens!

A user can own arbitrarily many ranges.
However, as we'll discuss later, each additional range slightly increases the total data requirements for that user.
For this reason, it's in the users' best interests to reduce the total number of ranges they own at any one point in time.

Ranges can be split apart as much as a user wants.
If a user owns `(0, 100)`, they can send `(0, 100)` or `(0, 50)` or `(25, 50)` or any other sub-range of `(0, 100)`.
Ranges can also be merged together, but only if they're directly adjacent to one another.
For example, `(0, 100)` and `(100, 200`) can be merged into `(0, 200)`, but `(0, 100)` and `(200, 300)` cannot be combined.

Transaction Object
==================
All transactions must take the following format:

.. code-block:: javascript

    {
        block: number,
        range: {
            start: number,
            end: number
        },
        from: string,
        to: string,
        signature: string
    }

``from`` and ``to`` must both be valid 20 byte Ethereum addresses_.
The ``signature`` must be created over the hash of the encoded transaction.
``plasma-core`` uses a `custom encoding scheme`_ to simplify the decoding process on Etheruem.

.. _number line: https://en.wikipedia.org/wiki/Number_line
.. _proof specificaton: specs/proofs.html
.. _addresses: https://en.wikipedia.org/wiki/Ethereum#Addresses
.. _custom encoding scheme: specs/encoding.html
