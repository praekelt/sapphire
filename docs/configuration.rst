configuration
=============

.. _accessors:

accessors
---------

Similar to d3, sapphire allows accessors to be given to specify the values of
dashboard and widget properties.

Accessors be can specified as their actual values: 

.. code-block:: javascript

  var dashboard = sapphire.dashboard()
    .title('A Humble Dashboard');

Or as a function that, given the current datum (``d``), index (``i``) and element
(``this``), returns the desired value:


.. code-block:: javascript

  var dashboard = sapphire.dashboard()
    .title(function(d, i) {
      return d.title;
    });


configuration
-------------

Dashboards and widgets can be thought of as 'configurable functions' that can
be applied to a d3 selection. Each dashboard has an instance of each widget
type bundled with sapphire. A dashboard widget can be retrieved and configured
using :func:`dashboard.types`.

.. code-block:: javascript

  var dashboard = sapphire.dashboard();

  dashboard.types().get('last')
    .values(function(d) {
      return d.datapoints;
    })
    .y(function(d) {
      return d.value;
    });

  d3.select('#dashboard')
    .datum(({
      widgets: [{
        type: 'last',
        title: 'Configured last',
        datapoints: [{
          x: 123,
          value: 345
        }, {
          x: 567,
          value: 789
        }]
      }]
    })
    .call(dashboard);

:func:`dashboard.types` can also be used to add new widget types to a dashboard:

.. code-block:: javascript

  var dashboard = sapphire.dashboard();

  var dummy = sapphire.widgets.widget.extend()
    .draw(function() {
      this.el().text(function(d) { return d.text; });
    }))

  dashboard.types().set('dummy', dummy());

  d3.select('#dashboard')
    .datum({
      title: 'A Small Dashboard',
      widgets: [{
        type: 'dummy',
        text: 'foo'
      }]
    })
    .call(dashboard);
