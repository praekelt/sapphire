``sapphire.widgets.lastvalue``
==============================

A widget displaying the last ``y`` value in a series of datapoints.

.. function:: sapphire.widgets.lastvalue()

  Creates a new lastvalue widget.


.. function:: lastvalue(el)

  Draws the widget by applying it to the given selection. ``el`` can be a
  d3 selection, or any argument accepted by d3.select_.

  .. code-block:: javascript

    var lastvalue = sapphire.lastvalue();

    d3.select('#lastvalue')
      .datum({
        title: 'A lastvalue widget',
        values [{
          x: 123,
          y: 345
        }, {
          x: 567,
          y: 789
        }]
      })
      .call(lastvalue);


.. function:: lastvalue.title([accessor])

  Property for the :ref:`accessor <accessors>` to use to access the widget's
  title from the bound datum. Defaults to ``function(d) { return d.title; }``.

  .. code-block:: javascript

    var lastvalue = sapphire.lastvalue()
      .title(function(d, i) {
        return d.heading;
      });

    d3.select('#lastvalue')
      .datum({
        ...
        heading: 'A lastvalue widget',
        ...
      })
      .call(lastvalue);


.. function:: lastvalue.values([accessor])

  Property for the :ref:`accessor <accessors>` to use to access the widget's
  sets of ``x`` and ``y`` values or datapoints.

  .. code-block:: javascript

    var lastvalue = sapphire.lastvalue()
      .values(function(d, i) {
        return d.datapoints;
      });

    d3.select('#lastvalue')
      .datum({
        ...
        datapoints: [{
          x: 123,
          y: 345
        }, {
          x: 567,
          y: 789
        }]
        ...
      })
      .call(lastvalue);


.. function:: lastvalue.x([accessor])

  Property for the :ref:`accessor <accessors>` to use to access the ``x`` value
  from each datum in the array corresponding to :func:`lastvalue.values`.

  .. code-block:: javascript

    var lastvalue = sapphire.lastvalue()
      .x(function(d, i) {
        return d.time;
      });

    d3.select('#lastvalue')
      .datum({
        ...
        values: [{
          time: 123,
          y: 345
        }, {
          time: 567,
          y: 789
        }]
        ...
      })
      .call(lastvalue);


.. function:: lastvalue.y([accessor])

  Property for the :ref:`accessor <accessors>` to use to access the ``y`` value
  from each datum in the array corresponding to :func:`lastvalue.values`.

  .. code-block:: javascript

    var lastvalue = sapphire.lastvalue()
      .y(function(d, i) {
        return d.value;
      });

    d3.select('#lastvalue')
      .datum({
        ...
        values: [{
          x: 123,
          value: 345
        }, {
          x: 567,
          value: 789
        }]
        ...
      })
      .call(lastvalue);


.. function:: lastvalue.format([fn])

  Property for the formatting function to use when displaying the last value.

  .. code-block:: javascript

    var lastvalue = sapphire.lastvalue()
      .format(d3.format('.2s'));


.. function:: lastvalue.none([v])

  Property for the value to display as the last value when
  :func:`lastvalue.values` returns an empty array.

  .. code-block:: javascript

    var lastvalue = sapphire.lastvalue()
      .none(0);


.. _d3.select: https://github.com/mbostock/d3/wiki/Selections#selecting-elements
.. _d3.map: https://github.com/mbostock/d3/wiki/Arrays#maps
