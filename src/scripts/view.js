module.exports = strain()
  .static('draw', function(fn) {
    this.meth('_draw_', fn);
  })
  .draw(function() {})

  .static('enter', function(fn) {
    this.meth('_enter_', fn);
  })
  .enter(function() {})

  .meth('draw', function(el) {
    var datum;
    el = sapphire.utils.ensureEl(el);

    if (el.node()) {
      datum = el.datum();
    }

    if (el.node() && !el.node().hasChildNodes()) {
      this.enter.apply(this, arguments);
    }

    var parent = this._type_._super_.prototype;
    if ('_draw_' in parent) {
      parent._draw_.apply(this, arguments);
    }

    this._draw_.apply(this, arguments);

    if (typeof datum != 'undefined') {
      el.datum(datum);
    }
  })

  .meth('enter', function(el) {
    el = sapphire.utils.ensureEl(el);

    var parent = this._type_._super_.prototype;
    if ('_enter_' in parent) {
      parent._enter_.apply(this, arguments);
    }

    this._enter_.apply(this, arguments);
  })

  .invoke(function() {
    return this.draw.apply(this, arguments);
  });
