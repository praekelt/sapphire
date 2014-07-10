``sapphire.widgets.lines``
==========================


.. raw:: html

  <style>
  .sapphire .lines.widget > .title {
    color: #fcfcfc;
  }
  </style>

  <div class="sapphire">
    <div id="lines"></div>
  </div>

  <script>
  (function() {
    var lines = sapphire.widgets.lines()
      .width(600)
      .key(function(d) { return d.name; })
      .metricTitle(function(d) { return d.name; });

    d3.select('#lines')
      .datum({
        title: 'Foo, Bar, Baz and Quux',
        metrics: [{"name":"Foo","values":[{"x":1405018164786,"y":39598},{"x":1405018166786,"y":36752},{"x":1405018168785,"y":47289},{"x":1405018170785,"y":78298},{"x":1405018172785,"y":23481},{"x":1405018174785,"y":14985},{"x":1405018176786,"y":68781},{"x":1405018178786,"y":48980},{"x":1405018180786,"y":60260},{"x":1405018182785,"y":98316},{"x":1405018184785,"y":5719},{"x":1405018186785,"y":42905},{"x":1405018188785,"y":25108},{"x":1405018190786,"y":2373},{"x":1405018192785,"y":74295},{"x":1405018194785,"y":46388},{"x":1405018196785,"y":662},{"x":1405018198785,"y":91909},{"x":1405018200786,"y":92525},{"x":1405018202787,"y":81059}]}, {"name":"Bar","values":[{"x":1405018164786,"y":81843},{"x":1405018166786,"y":36674},{"x":1405018168785,"y":6403},{"x":1405018170785,"y":69796},{"x":1405018172785,"y":94174},{"x":1405018174785,"y":42920},{"x":1405018176786,"y":39015},{"x":1405018178786,"y":49362},{"x":1405018180786,"y":96878},{"x":1405018182785,"y":60920},{"x":1405018184785,"y":88895},{"x":1405018186785,"y":44611},{"x":1405018188785,"y":75588},{"x":1405018190786,"y":68452},{"x":1405018192785,"y":83887},{"x":1405018194785,"y":11059},{"x":1405018196785,"y":49831},{"x":1405018198785,"y":67217},{"x":1405018200786,"y":28703},{"x":1405018202787,"y":26360}]}, {"name":"Baz","values":[{"x":1405018164786,"y":21716},{"x":1405018166786,"y":24436},{"x":1405018168785,"y":30998},{"x":1405018170785,"y":49397},{"x":1405018172785,"y":85983},{"x":1405018174785,"y":47941},{"x":1405018176786,"y":93416},{"x":1405018178786,"y":28055},{"x":1405018180786,"y":31708},{"x":1405018182785,"y":97999},{"x":1405018184785,"y":5567},{"x":1405018186785,"y":618},{"x":1405018188785,"y":92928},{"x":1405018190786,"y":91730},{"x":1405018192785,"y":44991},{"x":1405018194785,"y":55669},{"x":1405018196785,"y":74478},{"x":1405018198785,"y":94699},{"x":1405018200786,"y":47556},{"x":1405018202787,"y":96103}]}, {"name":"Quux","values":[{"x":1405018164786,"y":82195},{"x":1405018166786,"y":11774},{"x":1405018168785,"y":65620},{"x":1405018170785,"y":89099},{"x":1405018172785,"y":60933},{"x":1405018174785,"y":60897},{"x":1405018176786,"y":95506},{"x":1405018178786,"y":13387},{"x":1405018180786,"y":21302},{"x":1405018182785,"y":97562},{"x":1405018184785,"y":90936},{"x":1405018186785,"y":249},{"x":1405018188785,"y":13632},{"x":1405018190786,"y":58824},{"x":1405018192785,"y":89610},{"x":1405018194785,"y":72208},{"x":1405018196785,"y":19472},{"x":1405018198785,"y":17605},{"x":1405018200786,"y":81775},{"x":1405018202787,"y":44066}]}]
      })
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
      .title(function(d, i) { return d.heading; });

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
      .metrics(function(d, i) { return d.sets; });

    d3.select('#lines')
      .datum({
        ...
        sets [{
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


.. function:: lines.metricTitle([accessor])

  Property for the :ref:`accessor <accessors>` to use to access the key of
  each metric in the array returned by :func:`lines.metrics`.

  The default accessor will use each metric datum's ``key`` property if it
  exists, falling back to the metric datum's index in the array of metric data
  if it does not find the property.

  .. code-block:: javascript

    var lines = sapphire.widgets.lines()
      .key(function(d, i) { return d.name; });

    d3.select('#lines')
      .datum({
        ...
        metrics [{
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
  each metric in the array returned by :func:`lines.metrics`.

  .. code-block:: javascript

    var lines = sapphire.widgets.lines()
      .metricTitle(function(d, i) { return d.name; });

    d3.select('#lines')
      .datum({
        ...
        metrics [{
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
  :func:`lines.metrics`.

  .. code-block:: javascript

    var lines = sapphire.widgets.lines()
      .values(function(d, i) { return d.datapoints; });

    d3.select('#lines')
      .datum({
        ...
        metrics [{
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
  from each datum in the array returned by :func:`lines.values`.

  .. code-block:: javascript

    var lines = sapphire.widgets.lines()
      .x(function(d, i) { return d.time; });

    d3.select('#lines')
      .datum({
        ...
        metrics [{
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
  from each datum in the array corresponding to :func:`lines.values`.

  .. code-block:: javascript

    var lines = sapphire.widgets.lines()
      .y(function(d, i) { return d.value; });

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


.. function:: lines.valueFormat([fn])

  Property for the formatting function to use when displaying the last ``y``
  value. Defaults to ``d3.format(',2s')``.

  .. code-block:: javascript

    var lines = sapphire.widgets.lines()
      .valueFormat(d3.format('.2s'));


.. function:: lines.tickFormat([fn])

  Property for the formatting function to use when displaying the tick values
  on the line chart's ``x`` axis. Defaults to ``null``.

  :func:`sapphire.widgets.lines` uses d3.time.scale_ to generate its time
  scale, so when :func:`lines.tickFormat` is ``null``, the built-in d3 tick
  formatter is used.

  .. code-block:: javascript

    var lines = sapphire.widgets.lines()
      .diffFormat(d3.format('.2s'));


.. function:: lines.ticks([v])

  Property for the number of ticks to use for the time axis of the chart. This
  is given directly to d3.time.scale_. Defaults to ``7``.

  .. code-block:: javascript

    var lines = sapphire.widgets.lines()
      .ticks(7);


.. function:: lines.ticks([v])

  Property for the value to display as the last value when
  :func:`lines.values` returns an empty array.

  .. code-block:: javascript

    var lines = sapphire.widgets.lines()
      .none(0);


.. function:: lines.colors([fn])

  Property for the colour function to use to calculate each metric's colour
  from its index. Defaults to ``d3.scale.category10()``.

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

  Property for the :ref:`accessor <accessors>` to use to access the widget's
  width. Used if the widget is standalone (see :func:`lines.standalone`).
  Defaults to ``400``.

  .. code-block:: javascript

    var lines = sapphire.widgets.lines()
      .width(400);


.. function:: lines.colspan([v])

  Property for the widget's default column span in a dashboard. Used if the
  widget is not standalone (see :func:`lines.standalone` and
  :func:`dashboard.colspan`). Defaults to ``4``.

  .. code-block:: javascript

    var lines = sapphire.widgets.lines()
      .colspan(4);


.. function:: lines.standalone([v])

  Property for setting whether this is a standalone widget, or a widget
  contained inside a dashboard. Automatically set to ``false`` when used with
  :func:`sapphire.dashboard`. Defaults to ``true``.

  .. code-block:: javascript

    var lines = sapphire.widgets.lines()
      .standalone(true);


.. _d3.select: https://github.com/mbostock/d3/wiki/Selections#selecting-elements
.. _d3.time.scale https://github.com/mbostock/d3/wiki/Time-Scales#scale
