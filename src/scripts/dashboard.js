var widgets = require('./widgets');


module.exports = require('./view').extend()
  .prop('types')

  .confprop('title')
  .set(d3.functor)
  .title(function(d) { return d.title; })

  .confprop('key')
  .set(d3.functor)
  .key(function(d, i) {
    return 'key' in d
      ? d.key
      : i;
  })

  .confprop('type')
  .set(d3.functor)
  .type(function(d) { return d.type; })

  .confprop('widgets')
  .set(d3.functor)
  .widgets(function(d) { return d.widgets; })

  .init(function() {
    var types = d3.map();

    d3.keys(widgets).forEach(function(k) {
      types.set(k, widgets[k].extend());
    });

    this.types(types);
  })

  .draw(function() {
    var self = this;

    var widgets = this.el().selectAll('.widgets')
      .data(function(d, i) {
        return [self.widgets().call(this, d, i)];
      });

    widgets.enter().append('div')
      .attr('class', 'widgets');

    var widget = widgets.selectAll('.widget')
      .data(function(d) { return d; }, this.key());

    widget.enter().append('div')
      .attr('class', 'widget')
      .attr('data-key', this.key());

    widget.each(function(d, i) {
      var type = self.type().call(this, d, i);

      if (!self.types().has(type)) {
        throw new Error("Unrecognised dashboard widget type '" + type + "'");
      }

      self.types()
        .get(type)
        .new(this)
        .draw();
    });

    widget.exit().remove();
  });
