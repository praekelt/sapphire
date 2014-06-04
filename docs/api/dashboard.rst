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


.. _d3.select: https://github.com/mbostock/d3/wiki/Selections#selecting-elements
.. _d3.map: https://github.com/mbostock/d3/wiki/Arrays#maps
