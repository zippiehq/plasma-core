===========
SyncService
===========

Description
===========
``SyncService`` makes sure that the client's wallet is always synchronized.
This service automatically pulls any pending transactions and keeps `transaction proofs`_ up to date.

API
===
.. code-block:: javascript

    isSyncing ()

----------
Parameters
----------

N/A

-------
Returns
-------

``boolean``: Whether or not the sync service is currently active.


.. _transaction proofs: specs/proofs.html
