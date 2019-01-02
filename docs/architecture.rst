============
Architecture
============
This document describes, in detail, the architecture of ``plasma-core``.
If you're a new contributor to ``plasma-core``, welcome!
Hopefully this document will help you better understand how ``plasma-core`` works under the hood.

plasma-core 101
===============
``plasma-core`` is composed of a set of *services* that, when woven together, form (almost) a complete node!
Each of these services performs a very specific role.
A more in-depth explanation of each individual service is available in the *Service API Reference* section of our documentation.

Architecture Diagram
====================
This diagram shows the basic architecture of ``plasma-core``:

.. image:: ./_static/images/architecture/architecture.png
    :align: center
    :figwidth: 300px
    :target: ./_static/images/architecture/architecture.png

    PG Plasma Architecture Diagram

External services
-----------------
``plasma-core`` talks to three external services: **Ethereum**, the plasma chain **Operator**, and user **applications**.
These three services are *outside* of the scope of ``plasma-core``.
Instead, ``plasma-core`` provides interfaces through which it can talk to and hear from these external services.

ETHService
~~~~~~~~~~
For communication with Ethereum, we use ETHService_.
``ETHService`` exposes functionality necessary to read relevant information from Ethereum and make any necessary transactions.
Other services are expected to go through ``ETHService`` whenever they wish to talk to Ethereum.

OperatorService
~~~~~~~~~~~~~~~
As its name suggests, OperatorService_ handles all communication with the plasma chain operator_.
This includes sending and receiving plasma chain transactions.

JSONRPCService
~~~~~~~~~~~~~~
The JSONRPCService_ acts as a handler for commands sent by user **applications**.
By default, applications must interact *directly* with ``JSONRPCService``.
``plasma-core`` can be extended to expose additional interfaces to ``JSONRPCService``, such as an HTTP API.

.. _ETHService: services-eth.html
.. _OperatorService: services-operator.html
.. _operator: TODO
.. _JSONRPCSErvice: services-jsonrpc.html
