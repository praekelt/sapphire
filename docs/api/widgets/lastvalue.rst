``sapphire.widgets.last``
==============================

A widget displaying the last ``y`` value in a series of datapoints.

.. function:: sapphire.widgets.last()

  Creates a new last widget.


.. function:: last(el)

  Draws the widget by applying it to the given selection. ``el`` can be a
  d3 selection, or any argument accepted by d3.select_.

  .. code-block:: javascript

    var last = sapphire.last();

    d3.select('#last')
      .datum({
        title: 'A last widget',
        values [{
          x: 123,
          y: 345
        }, {
          x: 567,
          y: 789
        }]
      })
      .call(last);


.. function:: last.title([accessor])

  Property for the :ref:`accessor <accessors>` to use to access the widget's
  title from the bound datum. Defaults to ``function(d) { return d.title; }``.

  .. code-block:: javascript

    var last = sapphire.last()
      .title(function(d, i) {
        return d.heading;
      });

    d3.select('#last')
      .datum({
        ...
        heading: 'A last widget',
        ...
      })
      .call(last);


.. function:: last.values([accessor])

  Property for the :ref:`accessor <accessors>` to use to access the widget's
  sets of ``x`` and ``y`` values or datapoints.

  .. code-block:: javascript

    var last = sapphire.last()
      .values(function(d, i) {
        return d.datapoints;
      });

    d3.select('#last')
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
      .call(last);


.. function:: last.x([accessor])

  Property for the :ref:`accessor <accessors>` to use to access the ``x`` value
  from each datum in the array corresponding to :func:`last.values`.

  .. code-block:: javascript

    var last = sapphire.last()
      .x(function(d, i) {
        return d.time;
      });

    d3.select('#last')
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
      .call(last);


.. function:: last.y([accessor])

  Property for the :ref:`accessor <accessors>` to use to access the ``y`` value
  from each datum in the array corresponding to :func:`last.values`.

  .. code-block:: javascript

    var last = sapphire.last()
      .y(function(d, i) {
        return d.value;
      });

    d3.select('#last')
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
      .call(last);


.. function:: last.format([fn])

  Property for the formatting function to use when displaying the last value.

  .. code-block:: javascript

    var last = sapphire.last()
      .format(d3.format('.2s'));


.. function:: last.none([v])

  Property for the value to display as the last value when
  :func:`last.values` returns an empty array.

  .. code-block:: javascript

    var last = sapphire.last()
      .none(0);


.. _d3.select: https://github.com/mbostock/d3/wiki/Selections#selecting-elements
.. _d3.map: https://github.com/mbostock/d3/wiki/Arrays#maps
