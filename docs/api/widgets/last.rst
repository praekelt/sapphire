``sapphire.widgets.last``
=========================


.. raw:: html

  <div class="sph-docs-col-sm">
    <div id="last"></div>
  </div>

  <script>
  !sapphire.docData || (function() {
    d3.select('#last')
      .datum(sapphire.docData.last)
      .call(sapphire.widgets.last());
  })();
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
      .title(function(d) { return d.heading; });

    d3.select('#last')
      .datum({
        ...
        heading: 'A last widget',
        ...
      })
      .call(last);


.. function:: last.values([accessor])

  Property for the :ref:`accessor <accessors>` to use to access the widget's
  sets of ``x`` and ``y`` values or datapoints. Defaults to
  ``function(d) { return d.values; }``.

  .. code-block:: javascript

    var last = sapphire.widgets.last()
      .values(function(d) { return d.datapoints; });

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
  from each datum in the array corresponding to :func:`last.values`. Defaults
  to ``function(d) { return d.x; }``.

  .. code-block:: javascript

    var last = sapphire.widgets.last()
      .x(function(d) { return d.time; });

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
  from each datum in the array corresponding to :func:`last.values`. Defaults
  to ``function(d) { return d.y; }``.

  .. code-block:: javascript

    var last = sapphire.widgets.last()
      .y(function(d) { return d.value; });

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


.. function:: last.yFormat([fn])

  Property for the formatting function to use when displaying the last ``y`` value.
  Defaults to ``d3.format(',2s')``.

  .. code-block:: javascript

    var last = sapphire.widgets.last()
      .yFormat(d3.format('.2s'));


.. function:: last.diffFormat([fn])

  Property for the formatting function to use when displaying the difference
  between the last ``y`` value and the ``y`` value preceding it. Defaults to
  ``d3.format('+,2s')``.

  .. code-block:: javascript

    var last = sapphire.widgets.last()
      .diffFormat(d3.format('.2s'));


.. function:: last.xFormat([fn])

  Property for the formatting function to use when displaying the last ``x``
  value and the ``x`` value preceding it. Defaults to
  ``d3.time.format('%-d %b %-H:%M')``.

  .. code-block:: javascript

    var last = sapphire.widgets.last()
      .xFormat(d3.time.format('%-d %b %-H:%M'));


.. function:: last.none([v])

  Property for the value to display as the last value when
  :func:`last.values` returns an empty array. Defaults to ``0``.

  .. code-block:: javascript

    var last = sapphire.widgets.last()
      .none(0);


.. function:: last.width([v])

  Property for the :ref:`accessor <accessors>` to use to access the
  widget's width. Used if the widget is standalone.  Defaults to ``400``.

  .. code-block:: javascript

    var last = sapphire.widgets.last()
      .width(400);


.. function:: last.sparklineLimit([v])

  Property for the minimum number of values or datapoints needed for the
  sparkline to be drawn. Defaults to ``15``.

  Note that the given value will be floored at ``2``.

  .. code-block:: javascript

    var last = sapphire.widgets.last()
      .sparklineLimit(3);


.. function:: last.summaryLimit([v])

  Property for the minimum number of values or datapoints needed for the
  summary to be drawn. Defaults to ``2``.

  Note that the given value will be floored at ``2``.

  .. code-block:: javascript

    var last = sapphire.widgets.last()
      .summaryLimit(3);


.. function:: last.explicitComponents([v])

  Property for setting whether the widget should expect its components
  to be layed out explictly or not.

  If set to ``false``, the widget will append the components automatically.

  If set to ``true``, the widget will look for the relevant element's
  component child elements to decide where to draw each.

  Defaults to ``false``.

  .. code-block:: html

    <div id="foo">
      <div data-widget-component="title"></div>
      <div data-widget-component="last-value"></div>
      <div data-widget-component="sparkline"></div>
      <div data-widget-component="summary"></div>
     </div>

  .. code-block:: javascript

    var last = sapphire.widgets.last()
      .explicitComponents(true);

    d3.select("#foo")
      .datum({...})
      .call(last);

  The last widget's components are:

    - ``'title'``: title of the widget
    - ``'last-value'``: text showing the last given y value
    - ``'sparkline'``: the widget's sparkline summarising the changes in values
    - ``'summary'``: textual summary of the most recent change in value


.. _d3.select: https://github.com/mbostock/d3/wiki/Selections#selecting-elements
