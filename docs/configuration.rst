configuration
=============

.. _accessors:

accessors
---------

Similar to d3, sapphire allows accessors to be given to specify the values of widget properties.

Accessors be can specified as their actual values: 

.. code-block:: javascript

  var bars = sapphire.bars()
    .title('A Humble Bar Chart');

Or as a function that, given the current datum (``d``), index (``i``) and element
(``this``), returns the desired value:

.. code-block:: javascript

  var bars = sapphire.bars()
    .title(function(d, i) { return d.title; });


Unless otherwise specified, the element used as the ``this`` context corresponds to the DOM node(s) in the selection that the component was called on:


.. code-block:: javascript

  var el = d3.select('#bars');

  var bars = sapphire.bars()
    .title(function(d, i) {
      console.log(this === el.node());  // true
      return d.title;
    });

  bars(el);
