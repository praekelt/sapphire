``sapphire.widgets.bars``
=========================


.. raw:: html

  <div class="sapphire">
    <div id="bars"></div>
  </div>

  <script>
  !sapphire.docData || (function() {
    var bars = sapphire.widgets.bars()
      .width(600);

    d3.select('#bars')
      .datum(sapphire.docData.bars)
      .call(bars);
  })();
  </script>


A widget for displaying time-based data on consecutive bars on a chart, where
each bar corresponds to a time interval.


.. function:: sapphire.widgets.bars()

  Creates a new bars widget.


.. function:: bars(el)

  Draws the widget by applying it to the given selection. ``el`` can be a
  d3 selection, or any argument accepted by d3.select_.

  .. code-block:: javascript

    var bars = sapphire.widgets.bars();

    d3.select('#bars')
      .datum({
        title: 'Total Foo',
        values: [{
          x: 1405013457677,
          y: 1000000
        }, {
          x: 1405013458677,
          y: 9000000
        }]
      })
      .call(bars);


.. function:: bars.title([accessor])

  Property for the :ref:`accessor <accessors>` to use to access the widget's
  title from the bound datum. Defaults to ``function(d) { return d.title; }``.

  .. code-block:: javascript

    var bars = sapphire.widgets.bars()
      .title(function(d) { return d.heading; });

    d3.select('#bars')
      .datum({
        heading: 'A bars widget',
        ...
      })
      .call(bars);


.. function:: bars.values([accessor])

  Property for the :ref:`accessor <accessors>` to use to access the sets of
  ``x`` and ``y`` values or datapoints from the bound datum. Defaults to
  ``function(d) { return d.values; }``.

  .. code-block:: javascript

    var bars = sapphire.widgets.bars()
      .values(function(d) { return d.datapoints; });

    d3.select('#bars')
      .datum({
        ...
        datapoints: [{
          x: 1405013457677,
          y: 1000000
        }, {
          x: 1405013458677,
          y: 9000000
        }]
      })
      .call(bars);


.. function:: bars.x([accessor])

  Property for the :ref:`accessor <accessors>` to use to access the ``x`` value
  from each datum in the array returned by :func:`bars.values`. Defaults to
  ``function() { return d.x; }``.

  .. code-block:: javascript

    var bars = sapphire.widgets.bars()
      .x(function(d) { return d.time; });

    d3.select('#bars')
      .datum({
        ...
        metrics: [{
          ...
          datapoints: [{
            time: 1405013457677,
            y: 1000000
          }, {
            time: 1405013458677,
            y: 9000000
          }],
          ...
        }, {
          ...
          datapoints: [{
            time: 1405013457677,
            y: 8000000
          }, {
            time: 1405013458677,
            y: 3000000
          }],
          ...
        }]
        ...
      })
      .call(bars);


.. function:: bars.y([accessor])

  Property for the :ref:`accessor <accessors>` to use to access the ``y`` value
  from each datum in the array corresponding to :func:`bars.values`. Defaults
  to ``function() { return d.y; }``.

  .. code-block:: javascript

    var bars = sapphire.widgets.bars()
      .y(function(d) { return d.value; });

    d3.select('#bars')
      .datum({
        ...
        metrics: [{
          ...
          values: [{
            x 1405013457677,
            value: 1000000
          }, {
            x 1405013458677,
            value: 9000000
          }],
          ...
        }, {
          ...
          values: [{
            x 1405013457677,
            value: 8000000
          }, {
            x 1405013458677,
            value: 3000000
          }],
          ...
        }]
        ...
      })
      .call(bars);


.. function:: bars.xTickFormat([fn])

  Property for the formatting function to use when displaying the tick
  values on the line chart's ``x`` axis. Defaults to ``null``.

  :func:`sapphire.widgets.bars` uses d3.time.scale_ to generate its time
  scale, so when :func:`bars.xFormat` is ``null``, the built-in d3 tick
  formatter is used.

  .. code-block:: javascript

    var bars = sapphire.widgets.bars()
      .xFormat(d3.time.format('%Y-%m-%d'));


.. function:: bars.xTicks([v])

  Property for the number of ticks to use for the x axis of the chart. This
  is given directly to d3.time.scale_. Defaults to ``8``.

  .. code-block:: javascript

    var bars = sapphire.widgets.bars()
      .xTicks(10);


.. function:: bars.yTickFormat([fn])

  Property for the formatting function to use when displaying the tick
  values on the line chart's ``y`` axis. Defaults to ``d3.format('.2s')``.

  .. code-block:: javascript

    var bars = sapphire.widgets.bars()
      .yFormat(d3.format('s'));


.. function:: bars.yTicks([v])

  Property for the number of ticks to use for the y axis of the chart. This
  is given directly to d3.time.scale_. Defaults to ``5``.

  .. code-block:: javascript

    var bars = sapphire.widgets.bars()
      .yTicks(10);


.. function:: bars.yMax([v])

  Property for the chart's maximum y axis value. If a number is given, its
  value will be used as the chart's maximum value. If a function is given, the
  function will be passed an array of the y values to display and should return
  the number to use as the maximum. Defaults to ``d3.max``.

  .. code-block:: javascript

    var bars = sapphire.widgets.bars()
      .yMax(function(values) {
        return d3.max([9000].concat(values));
      });


.. function:: bars.colors([fn])

  Property for the colour function to use to calculate the colour
  used for the chart's bars, where the result of :func:`bars.title` is used as
  input to the function. Defaults to ``d3.scale.category10()``.

  .. code-block:: javascript

    var bars = sapphire.widgets.bars()
      .colors(d3.scale.category10());


.. function:: bars.width([v])

  Property for the :ref:`accessor <accessors>` to use to access the
  widget's width. Used if the widget is standalone.  Defaults to ``400``.

  .. code-block:: javascript

    var bars = sapphire.widgets.bars()
      .width(400);


.. function:: bars.colspan([v])

  Property for the widget's default column span in a dashboard. Used if
  the widget is not standalone (see and :func:`dashboard.colspan`).
  Defaults to ``4``.

  .. code-block:: javascript

    var bars = sapphire.widgets.bars()
      .colspan(4);


.. function:: bars.height([v])

  Property for the :ref:`accessor <accessors>` to use to access the
  widget's height. Used if the widget is standalone.  Defaults to ``200``.

  .. code-block:: javascript

    var bars = sapphire.widgets.bars()
      .height(200);


.. function:: bars.rowspan([v])

  Property for the widget's default row span in a dashboard. Used if the
  widget is not standalone (:func:`dashboard.rowspan`). Defaults to ``2``.

  .. code-block:: javascript

    var bars = sapphire.widgets.bars()
      .rowspan(2);


.. _d3.select: https://github.com/mbostock/d3/wiki/Selections#selecting-elements
.. _d3.time.scale: https://github.com/mbostock/d3/wiki/Time-Scales#scale
