``sapphire.widgets.widget``
===========================

The base widget type to extend to define a widget type.
:func:`sapphire.widgets.widget` extends :func:`sapphire.view`, so methods such
as `view.extend` and :func:`view.draw` are also available on widget types.

.. function:: sapphire.widgets.widget()

  Creates a new widget.


.. function:: widget(el)

  Draws the widget by applying it to the given selection.

  .. code-block:: javascript

    var widget = widget.widgets.widget();

    d3.select('#widget')
      .datum({title: 'A widget'})
      .call(widget);


.. function:: widget.width([v])

  Accessor for the widget's width. Used if the widget is standalone (see
  :func:`widget.standalone`). Defaults to ``100``.

  .. code-block:: javascript

    var widget = sapphire.widget()
      .width(100);


.. function:: widget.colspan([v])

  Property for the widget's default column span in a dashboard. Used if the
  widget is not standalone (see :func:`widget.standalone` and
  :func:`dashboard.colspan`). Defaults to ``1``.

  Note that widgets may exceed this width, depending on the behaviour of the
  widget type.

  .. code-block:: javascript

    var widget = sapphire.widget()
      .colspan(1);


.. function:: widget.height([v])

  Accessor for the widget's height. Used if the widget is standalone (see
  :func:`widget.standalone`). Defaults to ``100``.

  Note that widgets may exceed this height, depending on the behaviour of the
  widget type. For example, :func:`sapphire.widgets.lines` has a dynamic height
  to support the dynamic height of its legend table.

  .. code-block:: javascript

    var widget = sapphire.widget()
      .height(1);


.. function:: widget.rowspan([v])

  Property for the widget's default row span in a dashboard. Used if the widget
  is not standalone (see :func:`widget.standalone` and
  :func:`dashboard.rowspan`). Defaults to ``1``.

  .. code-block:: javascript

    var widget = sapphire.widget()
      .rowspan(1);


.. function:: widget.standalone([v])

  Property for setting whether this is a standalone widget, or a widget
  contained inside a dashboard. Automatically set to ``false`` when used with
  :func:`sapphire.dashboard`. Defaults to ``true``.

  .. code-block:: javascript

    var widget = sapphire.widget()
      .standalone(true);


.. _d3.select: https://github.com/mbostock/d3/wiki/Selections#selecting-elements
.. _d3.map: https://github.com/mbostock/d3/wiki/Arrays#maps
