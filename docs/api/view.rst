``sapphire.view``
=================

A lightweight view component used as a base for sapphire's other components.
The component is defined using strain_, so strain methods such as ``.extend()``
and ``.prop()`` are also available on view components.

.. function:: sapphire.view([el])

  Creates a new view. ``el`` can be any argument accepted by d3.select_.
  If ``el`` is not given, it needs to be set using :func:`view.el` before the
  view can be drawn. If ``el`` has a datum bound to it, the view will be
  drawn upon creation.


.. function:: sapphire.view.confprop(name)

  Defines a configurable property on the view type. The property's default can
  then be configured using ``name`` as a method on the type, and the property
  can be get or set on newly created views.

  .. code-block:: javascript

    var viewtype = sapphire.view.extend()
      .confprop('foo')
      .foo(23);

    var view = viewtype(); console.log(view.foo());  // 23
    console.log(view.foo(42).foo());  // 42


.. function:: sapphire.view.draw(fn)

  Defines a new draw method for the view type using the given function. The
  default drawing function is a no-op, this should be overriden with the
  drawing instructions specific to a component.

  .. code-block:: javascript

    var viewtype = sapphire.view.extend()
      .draw(function() {
        this.el().text(function(d) { return d.text; });
      }));


.. function:: view([datum])

  Draws the view. If ``datum`` is given, it will be bound to the view's current
  element before drawing the view.

  .. code-block:: javascript

    var view = sapphire.view.extend()
      .draw(function() {
        this.el().text(function(d) { return d.text; });
      }));
      .new();

    view({text: 'foo'});


.. function:: view.draw([datum])

  Identical to :func:`view`.


.. function:: view.el([el])

  Property for the view's current element the view's current element. ``el``
  can be any argument accepted by d3.select_.

  .. code-block:: javascript

    var view = sapphire.view()
      .el('body');

    console.log(d3.select('body').node() === view.el().node());  // true


.. _d3.select: https://github.com/mbostock/d3/wiki/Selections#selecting-elements
.. _strain: https://github.com/justinvdm/strain
