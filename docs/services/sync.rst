===========
SyncService
===========

``SyncService`` makes sure that the client's wallet is always synchronized.
This service automatically pulls any pending transactions and keeps `transaction proofs`_ up to date.

------------------------------------------------------------------------------

isSyncing
=========

.. code-block:: javascript

    sync.isSyncing()

-------
Returns
-------

``boolean``: ``true`` if SyncService is currently syncing, ``false`` otherwise.


.. _transaction proofs: specs/proofs.html
