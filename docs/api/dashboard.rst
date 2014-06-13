.. _saphire.dashboard

``sapphire.dashboard``
======================

Component for drawing a dashboard of widgets laid out in a grid.

.. function:: sapphire.dashboard([el])

  Creates a new dashboard. ``el`` can be any argument accepted by d3.select_.
  If ``el`` is not given, it needs to be set using :func:`view.el` before the
  dashboard can be drawn. If ``el`` has a datum bound to it, the dashboard will
  be drawn upon creation.


.. function:: dashboard([datum])

  Draws the dashboard. If ``datum`` is given, it will be bound to the dashboard's
  current element before drawing the dashboard.

  .. code-block:: javascript

    var dashboard = sapphire.dashboard('#lastvalue');

    dashboard({
      widgets: [{
        title: 'A lastvalue widget',
        type: 'lastvalue',
        values [{
          x: 123,
          y: 345
        }, {
          x: 567,
          y: 789
        }]
      }]
    });


.. function:: dashboard.title([accessor])

  Property for the :ref:`accessor <accessors>` to use to access the dashboard's
  title from the bound datum. Defaults to ``function(d) { return d.title; }``.

  .. code-block:: javascript

    var dashboard = sapphire.dashboard('#dashboard')
      .title(function(d, i) {
        return d.heading;
      });

    dashboard({
      ...
      heading 'A Small Dashboard',
      ...
    });


.. function:: dashboard.widgets([accessor])

  Property for the :ref:`accessor <accessors>` to use to access widget data
  from the bound datum. Defaults to ``function(d) { return d.widgets; }``.

  .. code-block:: javascript

    var dashboard = sapphire.dashboard('#dashboard')
      .widgets(function(d, i) {
        return d.things;
      });

    dashboard({
      ...
      things: [{
        type: 'lastvalue',
        title: 'Default lastvalue',
        values: [{
          x: 123,
          y: 345
        }, {
          x: 567,
          y: 789
        }]
      }]
      ...
    });


.. function:: dashboard.type([accessor])

  Property for the :ref:`accessor <accessors>` to use to access the widget type
  from each widget datum. Should evaluate to a string matching a widget type
  recognised by the dashboard. Defaults to ``function(d) { return d.type; }``.

  .. code-block:: javascript

    var dashboard = sapphire.dashboard('#dashboard')
      .type(function(d) {
        return d.typename;
      });

    dashboard.types().set('dummy', sapphire.view.extend()
      .draw(function() {
        this.el().text(function(d) { return d.text; });
      }));

    dashboard({
      ...
      widgets: [{
        typename: 'dummy',
        text: 'foo'
      }]
    });


.. function:: dashboard.key([accessor])

  Property for the :ref:`accessor <accessors>` to use to access the key to use
  to control how the widget data is joined to elements.
  
  .. code-block:: javascript

    var dashboard = sapphire.dashboard(el);

    dashboard({
      widgets: [{
        key: 'a',
        ...
      }, {
        key: 'b',
        ...
      }]
    });

  The default accessor will use each widget datum's ``key`` property if it
  exists, falling back to the widget datum's index in the array of widget data
  if it does not find the property.


.. function:: dashboard.types()

  Property for the dashboard's recognised widget types. Managed as a d3.map_.

  .. code-block:: javascript

    var dashboard = sapphire.dashboard('#dashboard');
    dashboard.types().get('lastvalue');
    dashboard.types().set('dummy', sapphire.view.extend());


.. function:: dashboard.col([accessor])

  Property for the :ref:`accessor <accessors>` to use to access the column
  index for each widget. If the accessor returns ``null`` or ``undefined``, the
  dashboard rely on its :func:`grid layout <sapphire.grid>` to choose the next column position for the widget.

  The default accessor looks up the ``col`` property of each datum, returning
  ``null`` if the property does not exist, is undefined, or if the datum is not
  an object.

  .. code-block:: javascript

    var dashboard = sapphire.dashboard()
      .col(function(d) {
        return d.x;
      });


.. function:: dashboard.row([accessor])

  Property for the :ref:`accessor <accessors>` to use to access the row index
  for each widget. If the accessor returns ``null`` or ``undefined``, the
  dashboard rely on its :func:`grid layout <sapphire.grid>` to choose the next
  row position for the widget.

  The default accessor looks up the ``row`` property of each datum, returning
  ``null`` if the property does not exist, is undefined, or if the datum is not
  an object.

  .. code-block:: javascript

    var dashboard = sapphire.dashboard()
      .row(function(d) {
        return d.y;
      });


.. function:: dashboard.colspan([accessor])

  Property for the :ref:`accessor <accessors>` to use to access the number of
  columns to span for each datum. If the accessor returns ``null`` or
  ``undefined``, the dashboard will fall back to the relevant widget type's
  ``colspan`` property.

  The default accessor looks up the ``colspan`` property of each datum.

  .. code-block:: javascript

    var dashboard = sapphire.dashboard()
      .colspan(function(d) {
        return d.width;
      });


.. function:: dashboard.rowspan([accessor])

  Property for the :ref:`accessor <accessors>` to use to access the number of
  rows to span for each datum. If the accessor returns ``null`` or
  ``undefined``, the dashboard will fall back to the relevant widget type's
  ``rowspan`` property.

  The default accessor looks up the ``rowspan`` property of each datum.

  .. code-block:: javascript

    var dashboard = sapphire.dashboard()
      .rowspan(function(d) {
        return d.height;
      });


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
      .numcols(4)


.. _d3.select: https://github.com/mbostock/d3/wiki/Selections#selecting-elements
.. _d3.map: https://github.com/mbostock/d3/wiki/Arrays#maps
