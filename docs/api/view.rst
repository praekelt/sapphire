``sapphire.view``
=================

A lightweight view component used as a base for sapphire's other components.
The component is defined using strain_, so strain methods such as ``.extend()``
and ``.prop()`` are also available on view components.

.. function:: sapphire.view()

  Creates a new view.


.. function:: sapphire.view.draw(fn)

  Defines a new draw method for the view type using the given function. The
  default drawing function is a no-op, this should be overriden with the
  drawing instructions specific to a component.

  .. code-block:: javascript

    var viewtype = sapphire.view.extend()
      .draw(function(el) {
        el.text(function(d) { return d.text; });
      });


.. function:: sapphire.view.enter(fn)

  Defines a new enter method for the view type using the given function that
  will be called on the first :func:`draw`. The default enter function is a
  no-op, this can be overriden with the drawing instructions specific to a
  component, if necessary.

  .. code-block:: javascript

    var viewtype = sapphire.view.extend()
      .enter(function(el) {
        el.append('div')
          .attr('class', 'foo');
      })
      .draw(function(el) {
        el.select('.foo')
          .text('bar');
      });


.. function:: view(el)

  Draws the view by applying it to the given selection. ``el`` can be a
  d3 selection, or any argument accepted by d3.select_.

  .. code-block:: javascript

    var view = sapphire.view.extend()
      .draw(function(el) {
        el.text(function(d) { return d.text; });
      }));
      .new();

    d3.select('body')
      .datum({text: 'foo'})
      .call(view);


.. function:: view.draw(el)

  Identical to :func:`view`.


.. _d3.select: https://github.com/mbostock/d3/wiki/Selections#selecting-elements
.. _strain: https://github.com/justinvdm/strain
