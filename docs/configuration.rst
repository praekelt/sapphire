configuration
=============

.. _accessors:

accessors
---------

Similar to d3, sapphire allows accessors to be given to specify the values of
dashboard and widget properties.

Accessors be can specified as their actual values: 

.. code-block:: javascript

  var dashboard = sapphire.dashboard('#dashboard')
    .title('A Humble Dashboard');

Or as a function that, given the current datum (``d``), index (``i``) and element
(``this``), returns the desired value:


.. code-block:: javascript

  var dashboard = sapphire.dashboard('#dashboard')
    .title(function(d, i) {
      return d.title;
    });


type configuration
------------------

Typically, components of the same type are likely to need the same accessors.
This can make configuring the components cumbersome:

.. code-block:: javascript

  var a = sapphire.lastvalue('#a')
    .values(function(d) {
      return d.datapoints;
    })
    .y(function(d) {
      return d.value;
    });


  var b = sapphire.lastvalue('#b')
    .values(function(d) {
      return d.datapoints;
    })
    .y(function(d) {
      return d.value;
    });


  var c = sapphire.lastvalue('#c')
    .values(function(d) {
      return d.datapoints;
    })
    .y(function(d) {
      return d.value;
    });

Sapphire allows default accessors to be configured on the component type to
remove this repetition:

.. code-block:: javascript

  sapphire.lastvalue
    .values(function(d) {
      return d.datapoints;
    })
    .y(function(d) {
      return d.value;
    });

  var a = sapphire.lastvalue('#a');
  var b = sapphire.lastvalue('#b');
  var c = sapphire.lastvalue('#c');

If you need to apply different configuration to different widgets of the same
type, you can achieve this by making derivatives of the bundled widget type:

.. code-block:: javascript

  var jedi = sapphire.lastvalue.extend()
    .values(function(d) {
      return d.jedi.datapoints;
    })
    .y(function(d) {
      return d.jedi.value;
    });


  var sith = sapphire.lastvalue.extend()
    .values(function(d) {
      return d.sith.datapoints;
    })
    .y(function(d) {
      return d.sith.value;
    });

  var jedi1 = jedi('#jedi1');
  var jedi2 = jedi('#jedi2');
  var sith1 = sith('#sith1');
  var sith2 = sith('#sith2');


dashboard configuration
-----------------------

Each dashboard uses its own derivatives of the bundled widget types. This means
that configuring a dashboard's widget types won't affect the actual bundled
widget types:

.. code-block:: javascript

  var dashboard = sapphire.dashboard('#dashboard');

  dashboard.types().get('lastvalue')
    .values(function(d) {
      return d.datapoints;
    })
    .y(function(d) {
      return d.value;
    });

  dashboard({
    widgets: [{
      type: 'lastvalue',
      title: 'Configured lastvalue',
      datapoints: [{
        x: 123,
        value: 345
      }, {
        x: 567,
        value: 789
      }]
    }]
  });

  dashboard = sapphire.dashboard('#dashboard');

  dashboard({
    widgets: [{
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
  });

Finally, you can also add your own widget types to a dashboard:

.. code-block:: javascript

  var dashboard = sapphire.dashboard('#dashboard');

  dashboard.types().set('dummy', sapphire.view.extend()
    .draw(function() {
      this.el().text(function(d) { return d.text; });
    }));

  dashboard({
    title: 'A Small Dashboard',
    widgets: [{
      type: 'dummy',
      text: 'foo'
    }]
  });
