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
    this.meth('_draw_', fn);
  })

  .meth('_draw_', function() {})

  .meth('draw', function(datum) {
    if (arguments.length) {
      this.el().datum(datum);
    }

    var parent = this._type_._super_.prototype;
    if ('_draw_' in parent) {
      parent._draw_.call(this);
    }

    return this._draw_();
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
    return this.draw(datum);
  });
