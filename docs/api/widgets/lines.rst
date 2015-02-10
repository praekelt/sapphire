``sapphire.widgets.lines``
==========================


.. raw:: html

  <div class="sph-docs-col-md">
    <div id="lines"></div>
  </div>

  <script>
  !sapphire.docData || (function() {
    var lines = sapphire.widgets.lines()
      .key(function(d) { return d.name; })
      .metricTitle(function(d) { return d.name; });

    d3.select('#lines')
      .datum(sapphire.docData.lines)
      .call(lines);
  })();
  </script>


A widget displaying a set of metrics in a line chart, accompanied by a table
displaying each metric's title, colour and last ``y`` value.


.. function:: sapphire.widgets.lines()

  Creates a new lines widget.


.. function:: lines(el)

  Draws the widget by applying it to the given selection. ``el`` can be a
  d3 selection, or any argument accepted by d3.select_.

  .. code-block:: javascript

    var lines = sapphire.widgets.lines();

    d3.select('#lines')
      .datum({
        key: 'a',
        title: 'Total Foo and Bar',
        metrics: [{
          key: 'foo',
          title: 'Total Foo',
          values: [{
            x: 1405013457677,
            y: 1000000
          }, {
            x: 1405013458677,
            y: 9000000
          }]
        }, {
          key: 'bar',
          title: 'Total Bar',
          values: [{
            x: 1405013457677,
            y: 8000000
          }, {
            x: 1405013458677,
            y: 3000000
          }]
        }],
      })
      .call(lines);


.. function:: lines.title([accessor])

  Property for the :ref:`accessor <accessors>` to use to access the widget's
  title from the bound datum. Defaults to ``function(d) { return d.title; }``.

  .. code-block:: javascript

    var lines = sapphire.widgets.lines()
      .title(function(d) { return d.heading; });

    d3.select('#lines')
      .datum({
        heading: 'A lines widget',
        ...
      })
      .call(lines);


.. function:: lines.metrics([accessor])

  Property for the :ref:`accessor <accessors>` to use to access the widget's
  array of metrics from the bound datum. Defaults to
  ``function(d) { return d.metrics; }``.

  .. code-block:: javascript

    var lines = sapphire.widgets.lines()
      .metrics(function(d) { return d.sets; });

    d3.select('#lines')
      .datum({
        ...
        sets: [{
         ...
          values: [{
            x: 1405013457677,
            y: 1000000
          }, {
            x: 1405013458677,
            y: 9000000
          }],
          ...
        }, {
          ...
          values: [{
            x: 1405013457677,
            y: 8000000
          }, {
            x: 1405013458677,
            y: 3000000
          }],
          ...
        }]
      })
      .call(lines);


.. function:: lines.key([accessor])

  Property for the :ref:`accessor <accessors>` to use to access the key of
  each metric in the array returned by :func:`lines.metrics`. Defaults to
  ``function(d, i) { return i; })``.

  .. code-block:: javascript

    var lines = sapphire.widgets.lines()
      .key(function(d) { return d.name; });

    d3.select('#lines')
      .datum({
        ...
        metrics: [{
          ...
          name: 'Foo',
          ...
        }, {
          ...
          name: 'Bar',
          ...
        }]
      })
      .call(lines);


.. function:: lines.metricTitle([accessor])

  Property for the :ref:`accessor <accessors>` to use to access the title of
  each metric in the array returned by :func:`lines.metrics`. Defaults to
  ``function(d) { return d.title; }``.

  .. code-block:: javascript

    var lines = sapphire.widgets.lines()
      .metricTitle(function(d) { return d.name; });

    d3.select('#lines')
      .datum({
        ...
        metrics: [{
          ...
          name: 'Foo',
          ...
        }, {
          ...
          name: 'Bar',
          ...
        }]
      })
      .call(lines);



.. function:: lines.values([accessor])

  Property for the :ref:`accessor <accessors>` to use to access the sets of
  ``x`` and ``y`` values or datapoints from each item in the array returned by
  :func:`lines.metrics`. Defaults to ``function(d) { return d.values; }``.

  .. code-block:: javascript

    var lines = sapphire.widgets.lines()
      .values(function(d) { return d.datapoints; });

    d3.select('#lines')
      .datum({
        ...
        metrics: [{
          ...
          datapoints: [{
            x: 1405013457677,
            y: 1000000
          }, {
            x: 1405013458677,
            y: 9000000
          }],
          ...
        }, {
          ...
          datapoints: [{
            x: 1405013457677,
            y: 8000000
          }, {
            x: 1405013458677,
            y: 3000000
          }],
          ...
        }]
      })
      .call(lines);


.. function:: lines.x([accessor])

  Property for the :ref:`accessor <accessors>` to use to access the ``x`` value
  from each datum in the array returned by :func:`lines.values`. Defaults to
  ``function() { return d.x; }``.

  .. code-block:: javascript

    var lines = sapphire.widgets.lines()
      .x(function(d) { return d.time; });

    d3.select('#lines')
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
      .call(lines);


.. function:: lines.y([accessor])

  Property for the :ref:`accessor <accessors>` to use to access the ``y`` value
  from each datum in the array corresponding to :func:`lines.values`. Defaults
  to ``function() { return d.y; }``.

  .. code-block:: javascript

    var lines = sapphire.widgets.lines()
      .y(function(d) { return d.value; });

    d3.select('#lines')
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
      .call(lines);


.. function:: lines.yFormat([fn])

  Property for the formatting function to use when displaying the last
  ``y`` value.

  Defaults to a function equivalent to ``d3.format(',')`` for integer values
  and ``d3.format(',.3f')`` for float values.

  .. code-block:: javascript

    var lines = sapphire.widgets.lines()
      .yFormat(d3.format('.2s'));


.. function:: lines.xTickFormat([fn])

  Property for the formatting function to use when displaying the tick
  values on the line chart's ``x`` axis. Defaults to ``null``.

  :func:`sapphire.widgets.lines` uses d3.time.scale_ to generate its time
  scale, so when :func:`lines.xFormat` is ``null``, the built-in d3 tick
  formatter is used.

  .. code-block:: javascript

    var lines = sapphire.widgets.lines()
      .xFormat(d3.time.format('%Y-%m-%d'));


.. function:: lines.xTicks([v])

  Property for the number of ticks to use for the x axis of the chart. This
  is given directly to d3.time.scale_. Defaults to ``8``.

  .. code-block:: javascript

    var lines = sapphire.widgets.lines()
      .xTicks(10);


.. function:: lines.yTickFormat([fn])

  Property for the formatting function to use when displaying the tick
  values on the line chart's ``y`` axis. Defaults to ``d3.format('.2s')``.

  .. code-block:: javascript

    var lines = sapphire.widgets.lines()
      .yFormat(d3.format('s'));


.. function:: lines.yTicks([v])

  Property for the number of ticks to use for the y axis of the chart. This
  is given directly to d3.time.scale_. Defaults to ``5``.

  .. code-block:: javascript

    var lines = sapphire.widgets.lines()
      .yTicks(10);


.. function:: lines.yMin([v])

  Property for the chart's minimum y axis value. If a number is given, its
  value will be used as the chart's minimum value. If a function is given, the
  function will be passed an array of the y values to display and should return
  the number to use as the minimum. Defaults to ``d3.min``.

  .. code-block:: javascript

    var lines = sapphire.widgets.lines()
      .yMin(function(values) {
        return d3.min([9000].concat(values));
      });


.. function:: lines.yMax([v])

  Property for the chart's maximum y axis value. If a number is given, its
  value will be used as the chart's maximum value. If a function is given, the
  function will be passed an array of the y values to display and should return
  the number to use as the maximum. Defaults to ``d3.max``.

  .. code-block:: javascript

    var lines = sapphire.widgets.lines()
      .yMax(function(values) {
        return d3.max([9000].concat(values));
      });

.. function:: lines.colors([fn])

  Property for the colour function to use to calculate each metric's colour
  from the values returned by :func:`lines.keys`. Defaults to
  ``d3.scale.category10()``.

  .. code-block:: javascript

    var lines = sapphire.widgets.lines()
      .colors(d3.scale.category10());


.. function:: lines.none([v])

  Property for the value to display as the last value when
  :func:`lines.values` returns an empty array. Defaults to ``0``.

  .. code-block:: javascript

    var lines = sapphire.widgets.lines()
      .none(0);


.. function:: lines.width([v])

  Property for the :ref:`accessor <accessors>` to use to access the
  widget's width. Used if the widget is standalone.  Defaults to ``400``.

  .. code-block:: javascript

    var lines = sapphire.widgets.lines()
      .width(400);


.. function:: lines.explicitComponents([v])

  Property for setting whether the widget should expect its components
  to be layed out explictly or not.

  If set to ``false``, the widget will append the components automatically.

  If set to ``true``, the widget will look for the relevant element's
  component child elements to decide where to draw each.

  Defaults to ``false``.

  .. code-block:: html

    <div id="foo">
      <div data-widget-component="title"></div>
      <div data-widget-component="chart"></div>
      <div data-widget-component="legend"></div>
     </div>

  .. code-block:: javascript

    var lines = sapphire.widgets.lines()
      .explicitComponents(true);

    d3.select("#foo")
      .datum({...})
      .call(lines);

  The lines widget's components are:

    - ``'title'``: title of the widget
    - ``'chart'``: the actual line chart
    - ``'legend'``: table showing the color, title and values of each metric


.. _d3.select: https://github.com/mbostock/d3/wiki/Selections#selecting-elements
.. _d3.time.scale: https://github.com/mbostock/d3/wiki/Time-Scales#scale
