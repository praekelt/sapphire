var strain = require('strain');


module.exports = strain()
  .static('draw', function(fn) {
    this.meth('_draw_', fn);
  })
  .draw(function() {})

  .meth('draw', function(el) {
    el = sapphire.utils.ensureEl(el);

    var datum;
    if (el.node()) datum = el.datum();
    this._draw_.apply(this, arguments);
    if (typeof datum != 'undefined') el.datum(datum);
  })

  .invoke(function() {
    return this.draw.apply(this, arguments);
  });
