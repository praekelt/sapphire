``sapphire.widgets.pie``
========================


.. raw:: html

  <div class="sph-docs-col-md">
    <div id="pie"></div>
  </div>

  <script>
  !sapphire.docData || (function() {
    var pie = sapphire.widgets.pie();

    d3.select('#pie')
      .datum(sapphire.docData.pie)
      .call(pie);
  })();
  </script>


A widget displaying a set of metrics on a pie chart, along with a table
displaying each metric's title, colour, value and percentage.


.. function:: sapphire.widgets.pie()

  Creates a new pie widget.


.. function:: pie(el)

  Draws the widget by applying it to the given selection. ``el`` can be a
  d3 selection, or any argument accepted by d3.select_.

  .. code-block:: javascript

    var pie = sapphire.widgets.pie();

    d3.select('#pie')
    .datum({
      title: 'Corge, Grault and Garply',
      metrics: [{
        key: 'Corge',
        title: 'Corge',
        value: 89251
      }, {
        key: 'Grault',
        title: 'Grault',
        value: 21479
      }, {
        key: 'Garply',
        title: 'Garply',
        value: 76432
      }]
    })
    .call(pie);


.. function:: pie.title([accessor])

  Property for the :ref:`accessor <accessors>` to use to access the widget's
  title from the bound datum. Defaults to ``function(d) { return d.title; }``.

  .. code-block:: javascript

    var pie = sapphire.widgets.pie()
      .title(function(d) { return d.heading; });

    d3.select('#pie')
      .datum({
        heading: 'A pie widget',
        ...
      })
      .call(pie);


.. function:: pie.metrics([accessor])

  Property for the :ref:`accessor <accessors>` to use to access the
  widget's array of metrics from the bound datum. Defaults to
  ``function(d) { return d.metrics; }``.

  .. code-block:: javascript

    var pie = sapphire.widgets.pie()
      .metrics(function(d) { return d.sets; });

    d3.select('#pie')
      .datum({
        ...
        sets: [{
         ...
          value: 1000000
        }, {
          ...
          value: 3000000
          ...
        }]
      })
      .call(pie);


.. function:: pie.key([accessor])

  Property for the :ref:`accessor <accessors>` to use to access the key of
  each metric in the array returned by :func:`pie.metrics`. Defaults to
  ``function(d, i) { return i; })``.

  .. code-block:: javascript

    var pie = sapphire.widgets.pie()
      .key(function(d) { return d.name; });

    d3.select('#pie')
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
      .call(pie);


.. function:: pie.metricTitle([accessor])

  Property for the :ref:`accessor <accessors>` to use to access the title of
  each metric in the array returned by :func:`pie.metrics`. Defaults to
  ``function(d) { return d.title; }``.

  .. code-block:: javascript

    var pie = sapphire.widgets.pie()
      .metricTitle(function(d) { return d.name; });

    d3.select('#pie')
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
      .call(pie);


.. function:: pie.value([accessor])

  Property for the :ref:`accessor <accessors>` to use to access the
  values to display on the pie chart from each item in the array returned
  by :func:`pie.metrics`. Defaults to ``function(d) { return d.value; }``.

  .. code-block:: javascript

    var pie = sapphire.widgets.pie()
      .value(function(d) { return d.values[0].y; });

    d3.select('#pie')
      .datum({
        ...,
        metrics: [{
          ...,
          values: [{
            ...,
            y: 1000000
          }]
        }, {
          ...,
          values: [{
            ...,
            y: 8000000
          }]
        }],
      })
      .call(pie);


.. function:: pie.valueFormat([fn])

  Property for the formatting function to use when displaying the metric values
  in the widget's table. Defaults to a function equivalent to
  ``d3.format(',')`` for integer values and ``d3.format(',.3f')`` for float
  values.

  .. code-block:: javascript

    var pie = sapphire.widgets.pie()
      .valueFormat(d3.format('s'));


.. function:: pie.percentFormat([fn])

  Property for the formatting function to use when displaying the metric
  percentages in the widget's table. Defaults to ``d3.format('.0%')``.

  .. code-block:: javascript

    var pie = sapphire.widgets.pie()
      .percentFormat(d3.format('.1%'));


.. function:: pie.colors([fn])

  Property for the colour function to use to calculate each metric's colour
  from the values returned by :func:`pie.keys`. Defaults to

  ``d3.scale.category10()``.

  .. code-block:: javascript

    var pie = sapphire.widgets.pie()
      .colors(d3.scale.category10());


.. function:: pie.width([v])

  Property for the :ref:`accessor <accessors>` to use to access the widget's
  width. Used if the widget is standalone. Defaults to ``400``.

  .. code-block:: javascript

    var pie = sapphire.widgets.pie()
      .width(400);


.. function:: pie.innerRadius([v])

  Property for setting the pie chart's inner radius. If a function is given,
  the function is invoked with the pie chart's outer radius. Defaults to
  ``0``.

  .. code-block:: javascript

    var pie = sapphire.widgets.pie()
      .innerRadius(0);


.. function:: pie.explicitComponents([v])

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

    var pie = sapphire.widgets.pie()
      .explicitComponents(true);

    d3.select("#foo")
      .datum({...})
      .call(pie);

  The pie widget's components are:

    - ``'title'``: title of the widget
    - ``'chart'``: the actual pie chart
    - ``'legend'``: table showing the color, title and values of each metric


.. _d3.select: https://github.com/mbostock/d3/wiki/Selections#selecting-elements
.. _d3.time.scale https://github.com/mbostock/d3/wiki/Time-Scales#scale
