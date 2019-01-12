=============
WalletService
=============

Description
===========
``WalletService`` is a wrapper for a private key storage mechanism.
Note that ``plasma-core`` does **not** provide a "real" wallet service.
``plasma-core`` only provides a *mock wallet* for testing.
To learn more about what is and isn't included check out `Extending plasma-core`_.

API
===
.. code-block:: javascript

    async getAccounts ()

Returns any available accounts.

----------
Parameters
----------

N/A

-------
Returns
-------

``Array<String>``: List of addresses in the wallet.

------------------------------------------------------------------------------

.. code-block:: javascript

    async sign (address, data)

Signs some data with the given address.

----------
Parameters
----------

1. ``address`` - ``String``: Address to sign with.
2. ``data`` - ``any``: Arbitrary data to sign.

-------
Returns
-------

``Object``: A Signature_ object.


.. _Extending plasma-core: extending-plasma-core.html
.. _Signature: TODO.
