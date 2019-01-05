========
Encoding
========
Unlike previous plasma implementations, ``plasma-core`` makes use of a custom transaction encoding scheme.
This custom scheme minimizes the total bytes necessary to represent a transaction and vastly simplifies the process of decoding a transaction inside of a smart contract.

Transactions
============
Transactions are encoded according to the following schema:

.. code-block:: javascript

    [
        from,  // 20 bytes
        to,    // 20 bytes
        token, // 4 bytes
        start, // 12 bytes
        end,   // 12 bytes
        block  // 32 bytes
    ]

This brings the total unsigned transaction size to **100 bytes**.

Signatures
==========
Signatures are encoded according to the following schema:

.. code-block:: javascript

    [
        v, // 1 byte
        r, // 32 bytes
        s  // 32 bytes
    ]

This brings the total signature size to **65 bytes** and therefore the total transaction size to **165 bytes**.
