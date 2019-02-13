============
ChainService
============

``ChainService`` does most of the heavy lifting when it comes to receiving and sending transactions.
This service handles processing new transactions and computing the latest state.

------------------------------------------------------------------------------

getBalances
===========

.. code-block:: javascript

    chain.getBalances(address)

Returns a list of balances for a user.

----------
Parameters
----------

1. ``address`` - ``string``: Address of the user to query.

-------
Returns
-------

``Promise<Object>``: An object where keys are tokens and values are the balances.

-------
Example
-------

.. code-block:: javascript

    const balances = await chain.getBalances(address)
    console.log(balances)
    > { '0': '1194501', '1': '919ff01' }

------------------------------------------------------------------------------

addDeposits
===========

.. code-block:: javascript

    chain.addDeposits(deposits)

Applies a series of deposits to the state.

----------
Parameters
----------

1. ``deposits`` - ``Array<Deposit>``: An array of Deposit_ objects to apply.

------------------------------------------------------------------------------

getExitsWithStatus
==================

.. code-block:: javascript

    chain.getExitsWithStatus(address)

Returns any exits started by a specific user.
Identifies exits that are finalized or ready to be finalized.

----------
Parameters
----------

1. ``address`` - ``string``: Address of the user to query.

-------
Returns
-------

``Array<Exit>``: An array of Exits_ started by the user.

------------------------------------------------------------------------------

addExit
=======

.. code-block:: javascript

    chain.getExitsWithStatus(address)


----------
Parameters
----------

1. ``address`` - ``string``:

-------
Returns
-------

``Array``:

------------------------------------------------------------------------------

pickRanges
==========

.. code-block:: javascript

    chain.getExitsWithStatus(address)


----------
Parameters
----------

1. ``address`` - ``string``:

-------
Returns
-------

``Array``:

------------------------------------------------------------------------------

pickTransfers
=============

.. code-block:: javascript

    chain.getExitsWithStatus(address)


----------
Parameters
----------

1. ``address`` - ``string``:

-------
Returns
-------

``Array``:

------------------------------------------------------------------------------

startExit
=========

.. code-block:: javascript

    chain.getExitsWithStatus(address)


----------
Parameters
----------

1. ``address`` - ``string``:

-------
Returns
-------

``Array``:

------------------------------------------------------------------------------

finalizeExits
=============

.. code-block:: javascript

    chain.getExitsWithStatus(address)


----------
Parameters
----------

1. ``address`` - ``string``:

-------
Returns
-------

``Array``:

------------------------------------------------------------------------------

sendTransaction
===============

.. code-block:: javascript

    chain.getExitsWithStatus(address)


----------
Parameters
----------

1. ``address`` - ``string``:

-------
Returns
-------

``Array``:

------------------------------------------------------------------------------

loadState
=========

.. code-block:: javascript

    chain.getExitsWithStatus(address)


----------
Parameters
----------

1. ``address`` - ``string``:

-------
Returns
-------

``Array``:

------------------------------------------------------------------------------

saveState
=========

.. code-block:: javascript

    chain.getExitsWithStatus(address)


----------
Parameters
----------

1. ``address`` - ``string``:

-------
Returns
-------

``Array``:

.. _Deposit: TODO
.. _Exits: TODO
.. _Transaction: specs/transactions.html#transaction-object
.. _Proof: specs/proofs.html#proof-object
