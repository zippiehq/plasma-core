============
Transactions over ranges of coins
============

Transfers
======
A transaction consists of a specified ``block`` number and an array of ``Transfer`` objects, which describe the details of each range of the transaction. From the `schema` in ``plasma-utils`` (``lengths`` in bytes):

.. code-block:: javascript

    ...
    const TransferSchema = new Schema({
     sender: {
       type: Address,
       required: true
     },
     recipient: {
       type: Address,
       required: true
     },
     token: {
       type: Number,
       length: 4,
       required: true
     },
     start: {
       type: Number,
       length: 12,
       required: true
     },
     end: {
       type: Number,
       length: 12,
       required: true
     }
    ...

We can see that each ``Transfer`` in a ``Transaction`` specifies a ``tokenType``, ``start``, ``end``, ``sender``, and ``recipient``.

Typed and Untyped Bounds
======

One thing to note above is that the ``start`` and ``end`` values are not 16 bytes, as ``coinID``s are, but rather 12. This should make sense in the context of the above sections on deposits. To get the actual ``coinID``s described by the transfer, we concatenate the ``token`` field's 4 bytes to the left of ``start`` and ``end``. We generally refer to the 12-byte versions as a ``transfer``'s ``untypedStart`` and ``untypedEnd``, with the concatenated version being called ``typedStart`` and ``typedEnd``. These values are also `exposed by the serializer`.
Another note: in any transfer the corresponding ``coinID``s are defined with ``start`` inclusive and ``end`` exclusive. That is, the exact ``coinID``s transferred are ``[typedStart, typedEnd)``. For example, the first 100 ETH coins can be sent with a ``Transfer`` with ``transfer.token = 0``, ``transfer.start = 0``, and ``transfer.end = 100``. The second 100 would have ``transfer.start = 100`` and ``transfer.end = 200``.

Multisends and Transfer/Transaction Atomicity
======
The ``Transaction`` schema consists of a 4-byte ``block`` number (the transaction is only valid if included in that particular plasma block), and an array of ``Transfer`` objects. This means that a transaction can describe several transfers, which are either all atomically executed or not depending on the *entire transaction's* inclusion and validity. This will form the basis for both decentralized exchange and `defragmentation` in later releases.

Serialization
======

As exemplified above, ``plasma-utils`` implements a custom serialization library for data structures. Both the JSON RPC and the smart contract use the byte arrays as encoded by the serializer.

The encoding is quite simple, being the concatenation of each value fixed to the number of bytes defined by the schema.
For encoding which involve variable-sized arrays, such as ``Transaction`` objects which contain 1 or more ``Transfer``s, a single byte precedes for the number of elements. Tests for the serialization library can be found `here.`
Currently, we have schemas for the following objects:
- ``Transfer``
- ``UnsignedTransaction``
- ``Signature``
- ``SignedTransaction``
- ``TransferProof``
- ``TransactionProof``


.. _schema: https://en.wikipedia.org/wiki/Number_line
.. _`exposed by the serializer`: https://github.com/plasma-group/plasma-utils/blob/master/src/serialization/models/transfer.js
.. _transaction: https://ethresear.ch/t/plasma-cash-defragmentation-take-3/3737
.. _here: https://github.com/plasma-group/plasma-utils/blob/master/test/serialization/test-serialization.js
