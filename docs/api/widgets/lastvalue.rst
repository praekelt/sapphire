``sapphire.widgets.lastvalue``
==============================

A widget displaying the last ``y`` value in a series of datapoints.

.. function:: sapphire.widgets.lastvalue([el])

  Creates a new lastvalue widget. ``el`` can be any argument accepted by
  d3.select_.  If ``el`` is not given, it needs to be set using :func:`view.el`
  before the widget can be drawn. If ``el`` has a datum bound to it, the widget
  will be drawn upon creation.


.. function:: lastvalue([datum])

  Draws the widget. If ``datum`` is given, it will be bound to the
  widget's current element before drawing the widget.

  .. code-block:: javascript

    var lastvalue = sapphire.lastvalue('#lastvalue');

    lastvalue({
      title: 'A lastvalue widget',
      values [{
        x: 123,
        y: 345
      }, {
        x: 567,
        y: 789
      }]
    });


.. function:: lastvalue.title([accessor])

  Property for the :ref:`accessor <accessors>` to use to access the widget's
  title from the bound datum. Defaults to ``function(d) { return d.title; }``.

  .. code-block:: javascript

    var lastvalue = sapphire.lastvalue('#lastvalue')
      .title(function(d, i) {
        return d.heading;
      });

    lastvalue({
      ...
      heading: 'A lastvalue widget',
      ...
    });


.. function:: lastvalue.values([accessor])

  Property for the :ref:`accessor <accessors>` to use to access the widget's
  sets of ``x`` and ``y`` values or datapoints.

  .. code-block:: javascript

    var lastvalue = sapphire.lastvalue('#lastvalue')
      .values(function(d, i) {
        return d.datapoints;
      });

    lastvalue({
      ...
      datapoints: [{
        x: 123,
        y: 345
      }, {
        x: 567,
        y: 789
      }]
      ...
    });


.. function:: lastvalue.x([accessor])

  Property for the :ref:`accessor <accessors>` to use to access the ``x`` value
  from each datum in the array corresponding to :func:`lastvalue.values`.

  .. code-block:: javascript

    var lastvalue = sapphire.lastvalue('#lastvalue')
      .x(function(d, i) {
        return d.time;
      });

    lastvalue({
      ...
      values: [{
        time: 123,
        y: 345
      }, {
        time: 567,
        y: 789
      }]
      ...
    });


.. function:: lastvalue.y([accessor])

  Property for the :ref:`accessor <accessors>` to use to access the ``y`` value
  from each datum in the array corresponding to :func:`lastvalue.values`.

  .. code-block:: javascript

    var lastvalue = sapphire.lastvalue('#lastvalue')
      .y(function(d, i) {
        return d.value;
      });

    lastvalue({
      ...
      values: [{
        x: 123,
        value: 345
      }, {
        x: 567,
        value: 789
      }]
      ...
    });


.. function:: lastvalue.format([fn])

  Property for the formatting function to use when displaying the last value.

  .. code-block:: javascript

    var lastvalue = sapphire.lastvalue('#lastvalue').format(d3.format('.2s'));


.. function:: lastvalue.none([v])

  Property for the value to display as the last value when
  :func:`lastvalue.values` returns an empty array.

  .. code-block:: javascript

    var lastvalue = sapphire.lastvalue('#lastvalue').none(0);


.. _d3.select: https://github.com/mbostock/d3/wiki/Selections#selecting-elements
.. _d3.map: https://github.com/mbostock/d3/wiki/Arrays#maps
