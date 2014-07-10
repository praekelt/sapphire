``sapphire.widgets.last``
=========================


.. raw:: html

  <style>
  .sapphire .last.widget > .title {
    color: #fcfcfc;
  }
  </style>

  <div class="sapphire">
    <div id="last"></div>
  </div>

  <script>
  d3.json('../../data.json', function(data) {
    d3.select('#last')
      .datum(data)
      .call(sapphire.widgets.last());
  });
  </script>


A widget displaying the last ``y`` value in a series of datapoints, a sparkline
of the values, and a summary of the difference between the last value and the
value preceding it.


.. function:: sapphire.widgets.last()

  Creates a new last widget.


.. function:: last(el)

  Draws the widget by applying it to the given selection. ``el`` can be a
  d3 selection, or any argument accepted by d3.select_.

  .. code-block:: javascript

    var last = sapphire.widgets.last();

    d3.select('#last')
      .datum({
        title: 'A last widget',
        values: [{
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

    var last = sapphire.widgets.last()
      .title(function(d, i) { return d.heading; });

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

    var last = sapphire.widgets.last()
      .values(function(d, i) { return d.datapoints; });

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

    var last = sapphire.widgets.last()
      .x(function(d, i) { return d.time; });

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

    var last = sapphire.widgets.last()
      .y(function(d, i) { return d.value; });

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


.. function:: last.valueFormat([fn])

  Property for the formatting function to use when displaying the last ``y`` value.
  Defaults to ``d3.format(',2s')``.

  .. code-block:: javascript

    var last = sapphire.widgets.last()
      .valueFormat(d3.format('.2s'));


.. function:: last.diffFormat([fn])

  Property for the formatting function to use when displaying the difference
  between the last ``y`` value and the ``y`` value preceding it. Defaults to
  ``d3.format('+,2s')``.

  .. code-block:: javascript

    var last = sapphire.widgets.last()
      .diffFormat(d3.format('.2s'));


.. function:: last.timeFormat([fn])

  Property for the formatting function to use when displaying the last ``x``
  value and the ``x`` value preceding it. Defaults to
  ``d3.time.format('%-d %b %-H:%M')``.

  .. code-block:: javascript

    var last = sapphire.widgets.last()
      .timeFormat(d3.time.format('%-d %b %-H:%M'));


.. function:: last.none([v])

  Property for the value to display as the last value when
  :func:`last.values` returns an empty array. Defaults to ``0``.

  .. code-block:: javascript

    var last = sapphire.widgets.last()
      .none(0);


.. function:: last.width([v])

  Property for the :ref:`accessor <accessors>` to use to access the widget's
  width. Used if the widget is standalone (see :func:`last.standalone`).
  Defaults to ``400``.

  .. code-block:: javascript

    var last = sapphire.widgets.last()
      .width(400);


.. function:: last.colspan([v])

  Property for the widget's default column span in a dashboard. Used if the
  widget is not standalone (see :func:`last.standalone` and
  :func:`dashboard.colspan`). Defaults to ``4``.

  .. code-block:: javascript

    var last = sapphire.widgets.last()
      .colspan(4);


.. function:: last.standalone([v])

  Property for setting whether this is a standalone widget, or a widget
  contained inside a dashboard. Automatically set to ``false`` when used with
  :func:`sapphire.dashboard`. Defaults to ``true``.

  .. code-block:: javascript

    var last = sapphire.widgets.last()
      .standalone(true);


.. _d3.select: https://github.com/mbostock/d3/wiki/Selections#selecting-elements
