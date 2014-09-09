``sapphire.grid``
=================

The layout used by :ref:`sapphire_dashboard` to position widgets.

.. function:: sapphire.grid()

  Creates a new grid layout.


.. function:: grid(data)

  Calculates the positioning and dimensions for grid items using ``data``.

  The resulting layout contains the following properties:

    - ``data``: A reference to the actual datum associated to this layout
    - ``row``: The row index for where the item starts
    - ``col``: The column index for where the item starts
    - ``rowspan``: The number of rows that the item spans
    - ``colspan``: The number of columns that the item spans
    - ``x``: The *x* position of the item in the grid calculated using
      ``col`` and :func:`grid.scale`
    - ``y``: The *y* position of the item in the grid calculated using
      ``row`` and :func:`grid.scale`
    - ``width``: The width of the item in the grid calculated using
      ``colspan``, :func:`grid.scale` and :func:`grid.padding`
    - ``height``: The height of the item in the grid calculated using
      ``rowspan``, :func:`grid.scale` and :func:`grid.padding`

  If two grid items intersect each other, the layout will move the item
  found later in ``data`` below the item found earlier in ``data``. This will
  have a 'domino' effect, where any new intersections caused by the move will be
  resolved using the same rule.

  .. code-block:: javascript

    var grid = sapphire.grid();

    grid([
      colspan: 1,
      rowspan: 1
    }, {
      colspan: 2,
      rowspan: 3
    }, {
      colspan: 1,
      rowspan: 1
    }]);


.. function:: grid.col([accessor])

  Property for the :ref:`accessor <accessors>` to use to access the column
  index to use for each datum. If the accessor returns ``null`` or
  ``undefined``, the grid layout will choose the next column position for the
  item, progressing in a left-to-right fashion.

  The default accessor tries look up the ``col`` property of each datum,
  returning ``null`` if the property does not exist, is undefined, or if the
  datum is not an object.

  .. code-block:: javascript

    var grid = sapphire.grid()
      .col(function(d) { return d[0]; })


.. function:: grid.row([accessor])

  Property for the :ref:`accessor <accessors>` to use to access the row index
  to use for each datum. If the accessor returns ``null`` or ``undefined``, the
  grid layout will choose the next fitting position row for the item.

  The default accessor tries look up the ``row`` property of each datum,
  returning ``null`` if the property does not exist, is undefined, or if the
  datum is not an object.

  .. code-block:: javascript

    var grid = sapphire.grid()
      .row(function(d) { return d[1]; })


.. function:: grid.colspan([accessor])

  Property for the :ref:`accessor <accessors>` to use to access the number of
  columns to span for each datum.

  The default accessor tries look up the ``colspan`` property of each datum,
  returning ``1`` if the property does not exist, is undefined, or if the
  datum is not an object.

  .. code-block:: javascript

    var grid = sapphire.grid()
      .colspan(function(d) { return d.width; })


.. function:: grid.rowspan([accessor])

  Property for the :ref:`accessor <accessors>` to use to access the number of
  rows to span for each datum.

  The default accessor tries look up the ``rowspan`` property of each datum,
  returning ``1`` if the property does not exist, is undefined, or if the
  datum is not an object.

  .. code-block:: javascript

    var grid = sapphire.grid()
      .rowspan(function(d) { return d.height; })


.. function:: grid.scale([v])

  Property for the scaling factor to use in the layout. Grid dimensions and
  positioning properties (``x``, ``y``, ``width`` and ``height``) are
  calculated by multiplying the corresponding grid properties (``col``,
  ``row``, ``colspan`` and ``rowspan``) by this factor. Defaults to ``10``.

  .. code-block:: javascript

    var grid = sapphire.grid()
      .scale(10)


.. function:: grid.padding([v])

  Property for the padding to use in the layout. The grid items' dimensions
  (``width`` and ``height``) will be decreased by double this value, and the
  items will have their positioning (``x`` and ``y``) offset by this value.
  Defaults to ``5``.

  .. code-block:: javascript

    var grid = sapphire.grid()
      .padding(5)


.. function:: grid.numcols([v])

  Property for the number of columns the grid's width is divided up into.
  Defaults to ``8``.

  .. code-block:: javascript

    var grid = sapphire.grid()
      .numcols(4)


.. function:: grid.indexOffset(index)

  Calculates the x or y offset of the given row or column index using
  :func:`grid.scale` and :func:`grid.padding`. Inverse of
  :func:`grid.offsetIndex`.

  .. code-block:: javascript

    var grid = sapphire.grid()
      .scale(10)
      .padding(4);

    grid.indexOffset(3);  // (10 * 3) + 4


.. function:: grid.spanLength(span)

  Calculates the width or height of the given row or column span using
  :func:`grid.scale` and :func:`grid.padding`. Inverse of
  :func:`grid.lengthSpan`.

  .. code-block:: javascript

    var grid = sapphire.grid()
      .scale(10)
      .padding(4);

    grid.spanLength(3);  // (10 * 3) - (2 * 4)


.. function:: grid.offsetIndex(offset)

  Calculates the column or row index of the given x or y offset using
  :func:`grid.scale` and :func:`grid.padding`. Inverse of
  :func:`grid.indexOffset`.

  .. code-block:: javascript

    var grid = sapphire.grid()
      .scale(10)
      .padding(4);

    grid.indexOffset((10 * 3) + 4);  // 3


.. function:: grid.lengthSpan(length)

  Calculates the column or row span of the given width or height using
  :func:`grid.scale` and :func:`grid.padding`. Inverse of
  :func:`grid.spanLength`.

  .. code-block:: javascript

    var grid = sapphire.grid()
      .scale(10)
      .padding(4);

    grid.lengthSpan((10 * 3) - (2 * 4));  // 3
