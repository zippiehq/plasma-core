==============
JSONRPCService
==============

Description
===========
``JSONRPCService`` handles incoming JSON-RPC method calls.
A full list of methods is documented at the `JSON-RPC Methods Specification`_.
Note that ``JSONRPCService`` does **not** expose any form of external interface (such as an HTTP server).
Full nodes should implement these services so that users can interact with the node.
For more information about these external services, see our document on `extending plasma-core`_.


API
===
.. code-block:: javascript

    getAllMethods ()

Returns all available RPC methods.

----------
Parameters
----------

N/A

-------
Returns
-------

``Object``: All subdispatcher methods as a single object in the form ``{ name: methodref }``.

------------------------------------------------------------------------------

.. code-block:: javascript

    getMethod (name)

Returns a method by its name.

----------
Parameters
----------

1. ``name`` - ``String``: Name of the method.

-------
Returns
-------

``Function``: A reference to the method with that name.

------------------------------------------------------------------------------

.. code-block:: javascript

    async callMethod (name, params = [])

Calls a method with the given name and params.

----------
Parameters
----------

1. ``name`` - ``String``: Name of the method to call.
2. ``params`` - ``Array``: An array of parameters.

-------
Returns
-------

``any``: The result of the method call.

------------------------------------------------------------------------------

.. code-block:: javascript

    async handle (request)

Handles a raw `JSON-RPC request`_.

----------
Parameters
----------

1. ``request`` - ``Object``: A JSON-RPC `request object`_.

-------
Returns
-------

``Object``: A JSON-RPC `response object`_.

.. _JSON-RPC Methods Specification: specs/jsonrpc.html
.. _extending plasma-core: extending-plasma-core.html
.. _JSON-RPC request: https://www.jsonrpc.org/specification#request_object
.. _request object: https://www.jsonrpc.org/specification#request_object
.. _response object: https://www.jsonrpc.org/specification#response_object
