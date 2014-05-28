module.exports = strain()
  .static('init', function(fn) {
    strain.init.call(this, function(el) {
      if (el) {
        this.el(el);
      }

      fn.apply(this, arguments);

      if (el && this.el().datum()) {
        this.draw();
      }
    });
  })

  .static('confprop', function(name) {
    this.prop(name);

    this.static(name, function(v) {
      this.prop(name).default(v);
    });
  })

  .static('draw', function(fn) {
    this.meth('draw', fn);
  })

  .prop('el')
  .set(function(v) {
    return !(v instanceof d3.selection)
      ? d3.select(v)
      : v;
  })

  .init(function() {})
  .draw(function() {})

  .invoke(function(datum) {
    if (arguments.length) {
      d3.select(this.el().node()).datum(datum);
    }

    this.draw();
  });
