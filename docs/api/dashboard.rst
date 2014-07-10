.. _saphire.dashboard

``sapphire.dashboard``
======================

Component for drawing a dashboard of widgets laid out in a grid.

.. function:: sapphire.dashboard()

  Creates a new dashboard.


.. function:: dashboard(el)
  Draws the dashboard by applying it to the given selection. ``el`` can be a
  d3 selection, or any argument accepted by d3.select_.

  .. code-block:: javascript

    var dashboard = sapphire.dashboard();

    d3.select('#dashboard')
      .datum({
        widgets: [{
          title: 'A last widget',
          type: 'last',
          values [{
            x: 123,
            y: 345
          }, {
            x: 567,
            y: 789
          }]
        }]
      })
      .call(dashboard);


.. function:: dashboard.title([accessor])

  Property for the :ref:`accessor <accessors>` to use to access the dashboard's
  title from the bound datum. Defaults to ``function(d) { return d.title; }``.

  .. code-block:: javascript

    var dashboard = sapphire.dashboard()
      .title(function(d, i) {
        return d.heading;
      });

    d3.select('#dashboard')
      .datum({
        ...
        heading 'A Small Dashboard',
        ...
      })
      .call(dashboard);


.. function:: dashboard.widgets([accessor])

  Property for the :ref:`accessor <accessors>` to use to access widget data
  from the bound datum. Defaults to ``function(d) { return d.widgets; }``.

  .. code-block:: javascript

    var dashboard = sapphire.dashboard()
      .widgets(function(d, i) {
        return d.things;
      });

    d3.select('#dashboard')
      .datum({
        ...
        things: [{
          type: 'last',
          title: 'Default last',
          values: [{
            x: 123,
            y: 345
          }, {
            x: 567,
            y: 789
          }]
        }]
        ...
      })
      .call(dashboard);


.. function:: dashboard.type([accessor])

  Property for the :ref:`accessor <accessors>` to use to access the widget type
  from each widget datum. Should evaluate to a string matching a widget type
  recognised by the dashboard. Defaults to ``function(d) { return d.type; }``.

  .. code-block:: javascript

    var dashboard = sapphire.dashboard()
      .type(function(d) {
        return d.typename;
      });

    dashboard.types().set('dummy', sapphire.view.extend()
      .draw(function() {
        this.el().text(function(d) { return d.text; });
      }));

    d3.select('#dashboard')
      .datum({
        ...
        widgets: [{
          typename: 'dummy',
          text: 'foo'
        }]
      })
      .call(dashboard);


.. function:: dashboard.key([accessor])

  Property for the :ref:`accessor <accessors>` to use to access the key to use
  to control how the widget data is joined to elements.
  
  .. code-block:: javascript

    var dashboard = sapphire.dashboard()
      .key(function(d) { return d.name; });

    d3.select('#dashboard')
      .datum({
        widgets: [{
          key: 'a',
          ...
        }, {
          key: 'b',
          ...
        }]
      })
      .call(dashboard);

  The default accessor will use each widget datum's ``key`` property if it
  exists, falling back to the widget datum's index in the array of widget data
  if it does not find the property.


.. function:: dashboard.types()

  Property for the dashboard's recognised widget types. Managed as a d3.map_.

  .. code-block:: javascript

    var dashboard = sapphire.dashboard();
    dashboard.types().get('last');
    dashboard.types().set('dummy', sapphire.view.extend().new());


.. function:: dashboard.col([accessor])

  Property for the :ref:`accessor <accessors>` to use to access the column
  index for each widget. If the accessor returns ``null`` or ``undefined``, the
  dashboard relies on its :func:`grid layout <sapphire.grid>` to choose the
  next column position for the widget.

  The default accessor looks up the ``col`` property of each datum, returning
  ``null`` if the property does not exist, is undefined, or if the datum is not
  an object.

  .. code-block:: javascript

    var dashboard = sapphire.dashboard()
      .col(function(d) {
        return d.x;
      });

    d3.select('#dashboard')
      .datum({
        widgets: [{
          x: 2,
          ...
        }, {
          x: 3,
          ...
        }]
      })
      .call(dashboard);


.. function:: dashboard.row([accessor])

  Property for the :ref:`accessor <accessors>` to use to access the row index
  for each widget. If the accessor returns ``null`` or ``undefined``, the
  dashboard relies on its :func:`grid layout <sapphire.grid>` to choose the
  next row position for the widget.

  The default accessor looks up the ``row`` property of each datum, returning
  ``null`` if the property does not exist, is undefined, or if the datum is not
  an object.

  .. code-block:: javascript

    var dashboard = sapphire.dashboard()
      .row(function(d) {
        return d.y;
      });

    d3.select('#dashboard')
      .datum({
        widgets: [{
          y: 2,
          ...
        }, {
          y: 3,
          ...
        }]
      })
      .call(dashboard);


.. function:: dashboard.colspan([accessor])

  Property for the :ref:`accessor <accessors>` to use to access the *minimum*
  number of columns to span for each widget. Each widget's column span is
  recalculated after the widget is drawn, so a widget may exceed the span given,
  depending on the behaviour of the widget's type.
  
  If the accessor returns ``null`` or ``undefined``, the dashboard will fall
  back to the relevant widget type's ``colspan`` property. The default accessor
  looks up the ``colspan`` property of each datum.

  .. code-block:: javascript

    var dashboard = sapphire.dashboard()
      .colspan(function(d) {
        return d.width;
      });

    d3.select('#dashboard')
      .datum({
        widgets: [{
          width: 2,
          ...
        }, {
          width: 3,
          ...
        }]
      })
      .call(dashboard);


.. function:: dashboard.rowspan([accessor])

  Property for the :ref:`accessor <accessors>` to use to access the *minimum*
  number of rows to span for each widget. Each widget's row span is
  recalculated after the widget is drawn, so a widget may exceed the span
  given, depending on the behaviour of the widget's type.
  
  If the accessor returns ``null`` or ``undefined``, the dashboard will fall
  back to the relevant widget type's ``rowspan`` property. The default accessor
  looks up the ``rowspan`` property of each datum.

  The default accessor looks up the ``rowspan`` property of each datum.

  .. code-block:: javascript

    var dashboard = sapphire.dashboard()
      .rowspan(function(d) {
        return d.height;
      });

    d3.select('#dashboard')
      .datum({
        widgets: [{
          height: 2,
          ...
        }, {
          height: 3,
          ...
        }]
      })
      .call(dashboard);


.. function:: dashboard.padding([v])

  Property for amount of padding for the dashboard's widgets. Defaults to ``10``.

  .. code-block:: javascript

    var dashboard = sapphire.dashboard()
      .padding(5);


.. function:: dashboard.numcols([v])

  Property for the number of columns the dashboard grid's width is divided up
  into. Defaults to ``8``.

  .. code-block:: javascript

    var dashboard = sapphire.dashboard()
      .numcols(4);


.. function:: dashboard.scale([v])

  Property for the row and column scale to use when calculating each widget's
  (x, y) offset, width and height from its column, row, column span and row
  span respectively. Defaults to ``100``.

  .. code-block:: javascript

    var dashboard = sapphire.dashboard()
      .scale(50);


.. _d3.select: https://github.com/mbostock/d3/wiki/Selections#selecting-elements
.. _d3.map: https://github.com/mbostock/d3/wiki/Arrays#maps
