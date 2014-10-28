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

  Property for the :ref:`accessor <accessors>` to use to access the
  widget's width. Used if the widget is standalone. Defaults to ``100``.

  .. code-block:: javascript

    var widget = sapphire.widget()
      .width(100);


.. function:: widget.height([v])

  Property for the :ref:`accessor <accessors>` the widget's height. Used
  if the widget is standalone.  Defaults to ``100``.

  Note that widgets may exceed this height, depending on the behaviour of the
  widget type. For example, :func:`sapphire.widgets.lines` has a dynamic height
  to support the dynamic height of its legend table.

  .. code-block:: javascript

    var widget = sapphire.widget()
      .height(1);


.. _d3.select: https://github.com/mbostock/d3/wiki/Selections#selecting-elements
