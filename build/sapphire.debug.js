!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.sapphire=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
var utils = _dereq_('./utils');
var layout = _dereq_('./grid');
var widgets = _dereq_('./widgets');


module.exports = _dereq_('./view').extend()
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
  .set(function(fn) {
    var self = this;
    fn = d3.functor(fn);

    return function(d, i) {
      var name = fn.call(this, d, i);

      if (!self.types().has(name)) {
        throw new Error("Unrecognised dashboard widget type '" + name + "'");
      }

      return self.types().get(name);
    };
  })
  .type(function(d) { return d.type; })

  .confprop('widgets')
  .set(d3.functor)
  .widgets(function(d) { return d.widgets; })

  .prop('col')
  .set(d3.functor)
  .default(function(d) {
    return utils.access(d, 'col');
  })

  .prop('row')
  .set(d3.functor)
  .default(function(d) {
    return utils.access(d, 'row');
  })

  .confprop('colspan')
  .set(d3.functor)
  .colspan(function(d) {
    return utils.access(d, 'colspan');
  })

  .confprop('rowspan')
  .set(d3.functor)
  .rowspan(function(d) {
    return utils.access(d, 'rowspan');
  })

  .confprop('numcols')
  .numcols(8)

  .confprop('padding')
  .padding(5)

  .init(function() {
    var types = d3.map();

    d3.keys(widgets).forEach(function(k) {
      types.set(k, widgets[k].extend());
    });

    this.types(types);
  })

  .draw(function() {
    var self = this;

    var grid = layout()
      .scale(100)
      .numcols(this.numcols())
      .padding(this.padding())
      .col(function(d, i) {
        return self.col().call(self, d, i);
      })
      .row(function(d, i) {
        return self.row().call(self, d, i);
      })
      .colspan(function(d, i) {
        var v = self.colspan().call(self, d, i);
        var type = self.type().call(this, d, i);
        return utils.ensure(v, type.colspan);
      })
      .rowspan(function(d, i) {
        var v = self.rowspan().call(self, d, i);
        var type = self.type().call(this, d, i);
        return utils.ensure(v, type.rowspan);
      });

    this.el().attr('class', 'dashboard');

    var widgets = this.el().selectAll('.widgets')
      .data(function(d, i) {
        return [self.widgets().call(this, d, i)];
      });

    widgets.enter().append('div')
      .attr('class', 'widgets');

    var widget = widgets.selectAll('.widget')
      .data(function(d) { return d; }, this.key());

    widget.enter().append('div');
    var gridEls = grid(widget.data());

    widget
      .attr('class', 'widget')
      .attr('data-key', this.key())
      .each(function(d, i) {
        var gridEl = gridEls[i];

        d3.select(this)
          .style('left', gridEl.x + 'px')
          .style('top', gridEl.y + 'px');

        self.type()
          .call(this, d, i)
          .new(this)
          .width(gridEl.width)
          .height(gridEl.height)
          .draw();
      });

    widget.exit().remove();
  });

},{"./grid":2,"./utils":4,"./view":5,"./widgets":6}],2:[function(_dereq_,module,exports){
var utils = _dereq_('./utils');


var grid = module.exports = strain()
  .prop('col')
  .set(d3.functor)
  .default(function(d) {
    return utils.access(d, 'col');
  })

  .prop('row')
  .set(d3.functor)
  .default(function(d) {
    return utils.access(d, 'row');
  })

  .prop('numcols')
  .default(8)

  .prop('scale')
  .default(10)

  .prop('padding')
  .default(5)

  .prop('colspan')
  .set(d3.functor)
  .default(function(d) {
    return utils.access(d, 'colspan', 1);
  })

  .prop('rowspan')
  .set(d3.functor)
  .default(function(d) {
    return utils.access(d, 'rowspan', 1);
  })

  .invoke(function(data) {
    var self = this;
    var best = counter().numcols(this.numcols());

    data = (data || []).map(function(d, i) {
      d = {
        data: d,
        col: utils.ensure(self.col().call(self, d, i), best.col()), 
        row: utils.ensure(self.row().call(self, d, i), best.row()),
        rowspan: self.rowspan().call(self, d, i),
        colspan: self.colspan().call(self, d, i)
      };

      best.inc(d);
      return d;
    });

    var quadtree = d3.geom.quadtree()
      .x(function(d) { return d.col; })
      .y(function(d) { return d.row; });

    var root = quadtree(data);
    var dblPadding = this.padding() * 2;

    data.forEach(function(d) {
      root.visit(grid.uncollide(d));
      d.x = (d.col * self.scale()) + self.padding();
      d.y = (d.row * self.scale()) + self.padding();
      d.width = (d.colspan * self.scale()) - dblPadding;
      d.height = (d.rowspan * self.scale()) - dblPadding;
    });

    return data;
  })

  .static(function box(d) {
    return {
      x1: d.col,
      x2: d.col + d.colspan - 1,
      y1: d.row,
      y2: d.row + d.rowspan - 1
    };
  })

  .static(function uncollide(a) {
    var boxA = grid.box(a);
    
    return function(node, x1, y1, x2, y2) {
      var b = node.point;

      if (b && a !== b && grid.intersection(boxA, grid.box(b))) {
        b.row = boxA.y2 + 1;
      }

      return !grid.intersection(boxA, {
        x1: x1, 
        y1: y1, 
        x2: x2,
        y2: y2
      });
    };
  })

  .static(function intersection(a, b) {
    return ((a.x1 <= b.x1 && b.x1 <= a.x2) && (a.y1 <= b.y1 && b.y1 <= a.y2))
        || ((b.x1 <= a.x1 && a.x1 <= b.x2) && (b.y1 <= a.y1 && a.y1 <= b.y2))
        || ((a.x1 <= b.x2 && b.x2 <= a.x2) && (a.y1 <= b.y1 && b.y1 <= a.y2))
        || ((b.x1 <= a.x2 && a.x2 <= b.x2) && (b.y1 <= a.y1 && a.y1 <= b.y2));
  });


var counter = strain()
  .prop('numcols')

  .prop('rowspan')
  .default(0)

  .prop('col')
  .default(0)

  .prop('row')
  .default(0)

  .meth(function inc(d) {
    var col = d.col + d.colspan;
    var row = this.row();

    if (col >= this.numcols()) {
      col = 0;
      row += this.rowspan();
      this.rowspan(0);
    }

    this
      .col(col)
      .row(row)
      .rowspan(Math.max(this.rowspan(), d.rowspan));
  });

},{"./utils":4}],3:[function(_dereq_,module,exports){
exports.utils = _dereq_('./utils');
exports.view = _dereq_('./view');
exports.grid = _dereq_('./grid');
exports.widgets = _dereq_('./widgets');
exports.dashboard = _dereq_('./dashboard');

},{"./dashboard":1,"./grid":2,"./utils":4,"./view":5,"./widgets":6}],4:[function(_dereq_,module,exports){
var utils = exports;


utils.access = function(d, name, defaultval) {
  if (arguments.length < 3) {
    defaultval = null;
  }

  if (typeof d != 'object') {
    return defaultval;
  }

  var val = d[name];
  return typeof val == 'undefined'
    ? defaultval
    : val;
};


utils.ensure = function(v, defaultval) {
  return v === null || typeof v == 'undefined'
    ? defaultval
    : v;
};

},{}],5:[function(_dereq_,module,exports){
module.exports = strain()
  .static('init', function(fn) {
    strain.init.call(this, function(el) {
      if (el) {
        this.el(el);
      }

      fn.apply(this, arguments);
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

  .static('enter', function(fn) {
    this.meth('_enter_', fn);
  })

  .meth('_draw_', function() {})
  .meth('_enter_', function() {})

  .meth('draw', function(datum) {
    if (arguments.length) {
      this.el().datum(datum);
    }

    if (!this.entered()) {
      this.enter();
    }

    var parent = this._type_._super_.prototype;
    if ('_draw_' in parent) {
      parent._draw_.call(this);
    }

    return this._draw_();
  })

  .meth('enter', function() {
    var parent = this._type_._super_.prototype;

    if ('_enter_' in parent) {
      parent._enter_.call(this);
    }

    this._enter_();
    this.entered(true);
  })

  .prop('entered')
  .default(false)

  .prop('el')
  .set(function(v) {
    return !(v instanceof d3.selection)
      ? d3.select(v)
      : v;
  })

  .init(function() {})

  .invoke(function(datum) {
    return this.draw(datum);
  });

},{}],6:[function(_dereq_,module,exports){
exports.widget = _dereq_('./widget');
exports.lastvalue = _dereq_('./lastvalue');

},{"./lastvalue":7,"./widget":8}],7:[function(_dereq_,module,exports){
module.exports = _dereq_('./widget').extend()
  .confprop('title')
  .set(d3.functor)
  .title(function(d) { return d.title; })

  .confprop('values')
  .set(d3.functor)
  .values(function(d) { return d.values; })

  .confprop('x')
  .set(d3.functor)
  .x(function(d) { return d.x; })

  .confprop('y')
  .set(d3.functor)
  .y(function(d) { return d.y; })

  .confprop('format')
  .format(d3.format())

  .confprop('none')
  .none(0)

  .draw(function() {
    var self = this;

    this.el()
      .html(null)
      .append('div')
        .datum(this.values())
        .attr('class', 'values')
        .append('text')
          .datum(function(d, i) {
            return d[d.length - 1];
          })
          .attr('class', 'last')
          .text(function(d, i) {
            var v = d
              ? self.y().call(this, d, i)
              : self.none();

              return self.format()(v);
          });
  });

},{"./widget":8}],8:[function(_dereq_,module,exports){
module.exports = _dereq_('../view').extend()
  .static('colspan', 1)
  .static('rowspan', 1)

  .confprop('width')
  .set(d3.functor)
  .width(200)

  .confprop('height')
  .set(d3.functor)
  .height(200)

  .draw(function() {
    var self = this;

    this.el()
      .style('width', function(d, i) {
        return self.width().call(this, d, i) + 'px';
      })
      .style('height', function(d, i) {
        return self.height().call(this, d, i) + 'px';
      });
  });

},{"../view":5}]},{},[3])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy9kYXNoYm9hcmQuanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvZ3JpZC5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy9pbmRleC5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy91dGlscy5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy92aWV3LmpzIiwiL2hvbWUvanVzdGluL3ByYWVrZWx0L3NhcHBoaXJlL3NyYy9zY3JpcHRzL3dpZGdldHMvaW5kZXguanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvd2lkZ2V0cy9sYXN0dmFsdWUuanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvd2lkZ2V0cy93aWRnZXQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RUE7QUFDQTtBQUNBOztBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG52YXIgbGF5b3V0ID0gcmVxdWlyZSgnLi9ncmlkJyk7XG52YXIgd2lkZ2V0cyA9IHJlcXVpcmUoJy4vd2lkZ2V0cycpO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi92aWV3JykuZXh0ZW5kKClcbiAgLnByb3AoJ3R5cGVzJylcblxuICAuY29uZnByb3AoJ3RpdGxlJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAudGl0bGUoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50aXRsZTsgfSlcblxuICAuY29uZnByb3AoJ2tleScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmtleShmdW5jdGlvbihkLCBpKSB7XG4gICAgcmV0dXJuICdrZXknIGluIGRcbiAgICAgID8gZC5rZXlcbiAgICAgIDogaTtcbiAgfSlcblxuICAuY29uZnByb3AoJ3R5cGUnKVxuICAuc2V0KGZ1bmN0aW9uKGZuKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIGZuID0gZDMuZnVuY3Rvcihmbik7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24oZCwgaSkge1xuICAgICAgdmFyIG5hbWUgPSBmbi5jYWxsKHRoaXMsIGQsIGkpO1xuXG4gICAgICBpZiAoIXNlbGYudHlwZXMoKS5oYXMobmFtZSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5yZWNvZ25pc2VkIGRhc2hib2FyZCB3aWRnZXQgdHlwZSAnXCIgKyBuYW1lICsgXCInXCIpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gc2VsZi50eXBlcygpLmdldChuYW1lKTtcbiAgICB9O1xuICB9KVxuICAudHlwZShmdW5jdGlvbihkKSB7IHJldHVybiBkLnR5cGU7IH0pXG5cbiAgLmNvbmZwcm9wKCd3aWRnZXRzJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAud2lkZ2V0cyhmdW5jdGlvbihkKSB7IHJldHVybiBkLndpZGdldHM7IH0pXG5cbiAgLnByb3AoJ2NvbCcpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkge1xuICAgIHJldHVybiB1dGlscy5hY2Nlc3MoZCwgJ2NvbCcpO1xuICB9KVxuXG4gIC5wcm9wKCdyb3cnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHtcbiAgICByZXR1cm4gdXRpbHMuYWNjZXNzKGQsICdyb3cnKTtcbiAgfSlcblxuICAuY29uZnByb3AoJ2NvbHNwYW4nKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5jb2xzcGFuKGZ1bmN0aW9uKGQpIHtcbiAgICByZXR1cm4gdXRpbHMuYWNjZXNzKGQsICdjb2xzcGFuJyk7XG4gIH0pXG5cbiAgLmNvbmZwcm9wKCdyb3dzcGFuJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAucm93c3BhbihmdW5jdGlvbihkKSB7XG4gICAgcmV0dXJuIHV0aWxzLmFjY2VzcyhkLCAncm93c3BhbicpO1xuICB9KVxuXG4gIC5jb25mcHJvcCgnbnVtY29scycpXG4gIC5udW1jb2xzKDgpXG5cbiAgLmNvbmZwcm9wKCdwYWRkaW5nJylcbiAgLnBhZGRpbmcoNSlcblxuICAuaW5pdChmdW5jdGlvbigpIHtcbiAgICB2YXIgdHlwZXMgPSBkMy5tYXAoKTtcblxuICAgIGQzLmtleXMod2lkZ2V0cykuZm9yRWFjaChmdW5jdGlvbihrKSB7XG4gICAgICB0eXBlcy5zZXQoaywgd2lkZ2V0c1trXS5leHRlbmQoKSk7XG4gICAgfSk7XG5cbiAgICB0aGlzLnR5cGVzKHR5cGVzKTtcbiAgfSlcblxuICAuZHJhdyhmdW5jdGlvbigpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICB2YXIgZ3JpZCA9IGxheW91dCgpXG4gICAgICAuc2NhbGUoMTAwKVxuICAgICAgLm51bWNvbHModGhpcy5udW1jb2xzKCkpXG4gICAgICAucGFkZGluZyh0aGlzLnBhZGRpbmcoKSlcbiAgICAgIC5jb2woZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICByZXR1cm4gc2VsZi5jb2woKS5jYWxsKHNlbGYsIGQsIGkpO1xuICAgICAgfSlcbiAgICAgIC5yb3coZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICByZXR1cm4gc2VsZi5yb3coKS5jYWxsKHNlbGYsIGQsIGkpO1xuICAgICAgfSlcbiAgICAgIC5jb2xzcGFuKGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgICAgdmFyIHYgPSBzZWxmLmNvbHNwYW4oKS5jYWxsKHNlbGYsIGQsIGkpO1xuICAgICAgICB2YXIgdHlwZSA9IHNlbGYudHlwZSgpLmNhbGwodGhpcywgZCwgaSk7XG4gICAgICAgIHJldHVybiB1dGlscy5lbnN1cmUodiwgdHlwZS5jb2xzcGFuKTtcbiAgICAgIH0pXG4gICAgICAucm93c3BhbihmdW5jdGlvbihkLCBpKSB7XG4gICAgICAgIHZhciB2ID0gc2VsZi5yb3dzcGFuKCkuY2FsbChzZWxmLCBkLCBpKTtcbiAgICAgICAgdmFyIHR5cGUgPSBzZWxmLnR5cGUoKS5jYWxsKHRoaXMsIGQsIGkpO1xuICAgICAgICByZXR1cm4gdXRpbHMuZW5zdXJlKHYsIHR5cGUucm93c3Bhbik7XG4gICAgICB9KTtcblxuICAgIHRoaXMuZWwoKS5hdHRyKCdjbGFzcycsICdkYXNoYm9hcmQnKTtcblxuICAgIHZhciB3aWRnZXRzID0gdGhpcy5lbCgpLnNlbGVjdEFsbCgnLndpZGdldHMnKVxuICAgICAgLmRhdGEoZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICByZXR1cm4gW3NlbGYud2lkZ2V0cygpLmNhbGwodGhpcywgZCwgaSldO1xuICAgICAgfSk7XG5cbiAgICB3aWRnZXRzLmVudGVyKCkuYXBwZW5kKCdkaXYnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3dpZGdldHMnKTtcblxuICAgIHZhciB3aWRnZXQgPSB3aWRnZXRzLnNlbGVjdEFsbCgnLndpZGdldCcpXG4gICAgICAuZGF0YShmdW5jdGlvbihkKSB7IHJldHVybiBkOyB9LCB0aGlzLmtleSgpKTtcblxuICAgIHdpZGdldC5lbnRlcigpLmFwcGVuZCgnZGl2Jyk7XG4gICAgdmFyIGdyaWRFbHMgPSBncmlkKHdpZGdldC5kYXRhKCkpO1xuXG4gICAgd2lkZ2V0XG4gICAgICAuYXR0cignY2xhc3MnLCAnd2lkZ2V0JylcbiAgICAgIC5hdHRyKCdkYXRhLWtleScsIHRoaXMua2V5KCkpXG4gICAgICAuZWFjaChmdW5jdGlvbihkLCBpKSB7XG4gICAgICAgIHZhciBncmlkRWwgPSBncmlkRWxzW2ldO1xuXG4gICAgICAgIGQzLnNlbGVjdCh0aGlzKVxuICAgICAgICAgIC5zdHlsZSgnbGVmdCcsIGdyaWRFbC54ICsgJ3B4JylcbiAgICAgICAgICAuc3R5bGUoJ3RvcCcsIGdyaWRFbC55ICsgJ3B4Jyk7XG5cbiAgICAgICAgc2VsZi50eXBlKClcbiAgICAgICAgICAuY2FsbCh0aGlzLCBkLCBpKVxuICAgICAgICAgIC5uZXcodGhpcylcbiAgICAgICAgICAud2lkdGgoZ3JpZEVsLndpZHRoKVxuICAgICAgICAgIC5oZWlnaHQoZ3JpZEVsLmhlaWdodClcbiAgICAgICAgICAuZHJhdygpO1xuICAgICAgfSk7XG5cbiAgICB3aWRnZXQuZXhpdCgpLnJlbW92ZSgpO1xuICB9KTtcbiIsInZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcblxuXG52YXIgZ3JpZCA9IG1vZHVsZS5leHBvcnRzID0gc3RyYWluKClcbiAgLnByb3AoJ2NvbCcpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkge1xuICAgIHJldHVybiB1dGlscy5hY2Nlc3MoZCwgJ2NvbCcpO1xuICB9KVxuXG4gIC5wcm9wKCdyb3cnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHtcbiAgICByZXR1cm4gdXRpbHMuYWNjZXNzKGQsICdyb3cnKTtcbiAgfSlcblxuICAucHJvcCgnbnVtY29scycpXG4gIC5kZWZhdWx0KDgpXG5cbiAgLnByb3AoJ3NjYWxlJylcbiAgLmRlZmF1bHQoMTApXG5cbiAgLnByb3AoJ3BhZGRpbmcnKVxuICAuZGVmYXVsdCg1KVxuXG4gIC5wcm9wKCdjb2xzcGFuJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7XG4gICAgcmV0dXJuIHV0aWxzLmFjY2VzcyhkLCAnY29sc3BhbicsIDEpO1xuICB9KVxuXG4gIC5wcm9wKCdyb3dzcGFuJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7XG4gICAgcmV0dXJuIHV0aWxzLmFjY2VzcyhkLCAncm93c3BhbicsIDEpO1xuICB9KVxuXG4gIC5pbnZva2UoZnVuY3Rpb24oZGF0YSkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgYmVzdCA9IGNvdW50ZXIoKS5udW1jb2xzKHRoaXMubnVtY29scygpKTtcblxuICAgIGRhdGEgPSAoZGF0YSB8fCBbXSkubWFwKGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgIGQgPSB7XG4gICAgICAgIGRhdGE6IGQsXG4gICAgICAgIGNvbDogdXRpbHMuZW5zdXJlKHNlbGYuY29sKCkuY2FsbChzZWxmLCBkLCBpKSwgYmVzdC5jb2woKSksIFxuICAgICAgICByb3c6IHV0aWxzLmVuc3VyZShzZWxmLnJvdygpLmNhbGwoc2VsZiwgZCwgaSksIGJlc3Qucm93KCkpLFxuICAgICAgICByb3dzcGFuOiBzZWxmLnJvd3NwYW4oKS5jYWxsKHNlbGYsIGQsIGkpLFxuICAgICAgICBjb2xzcGFuOiBzZWxmLmNvbHNwYW4oKS5jYWxsKHNlbGYsIGQsIGkpXG4gICAgICB9O1xuXG4gICAgICBiZXN0LmluYyhkKTtcbiAgICAgIHJldHVybiBkO1xuICAgIH0pO1xuXG4gICAgdmFyIHF1YWR0cmVlID0gZDMuZ2VvbS5xdWFkdHJlZSgpXG4gICAgICAueChmdW5jdGlvbihkKSB7IHJldHVybiBkLmNvbDsgfSlcbiAgICAgIC55KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQucm93OyB9KTtcblxuICAgIHZhciByb290ID0gcXVhZHRyZWUoZGF0YSk7XG4gICAgdmFyIGRibFBhZGRpbmcgPSB0aGlzLnBhZGRpbmcoKSAqIDI7XG5cbiAgICBkYXRhLmZvckVhY2goZnVuY3Rpb24oZCkge1xuICAgICAgcm9vdC52aXNpdChncmlkLnVuY29sbGlkZShkKSk7XG4gICAgICBkLnggPSAoZC5jb2wgKiBzZWxmLnNjYWxlKCkpICsgc2VsZi5wYWRkaW5nKCk7XG4gICAgICBkLnkgPSAoZC5yb3cgKiBzZWxmLnNjYWxlKCkpICsgc2VsZi5wYWRkaW5nKCk7XG4gICAgICBkLndpZHRoID0gKGQuY29sc3BhbiAqIHNlbGYuc2NhbGUoKSkgLSBkYmxQYWRkaW5nO1xuICAgICAgZC5oZWlnaHQgPSAoZC5yb3dzcGFuICogc2VsZi5zY2FsZSgpKSAtIGRibFBhZGRpbmc7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gZGF0YTtcbiAgfSlcblxuICAuc3RhdGljKGZ1bmN0aW9uIGJveChkKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHgxOiBkLmNvbCxcbiAgICAgIHgyOiBkLmNvbCArIGQuY29sc3BhbiAtIDEsXG4gICAgICB5MTogZC5yb3csXG4gICAgICB5MjogZC5yb3cgKyBkLnJvd3NwYW4gLSAxXG4gICAgfTtcbiAgfSlcblxuICAuc3RhdGljKGZ1bmN0aW9uIHVuY29sbGlkZShhKSB7XG4gICAgdmFyIGJveEEgPSBncmlkLmJveChhKTtcbiAgICBcbiAgICByZXR1cm4gZnVuY3Rpb24obm9kZSwgeDEsIHkxLCB4MiwgeTIpIHtcbiAgICAgIHZhciBiID0gbm9kZS5wb2ludDtcblxuICAgICAgaWYgKGIgJiYgYSAhPT0gYiAmJiBncmlkLmludGVyc2VjdGlvbihib3hBLCBncmlkLmJveChiKSkpIHtcbiAgICAgICAgYi5yb3cgPSBib3hBLnkyICsgMTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuICFncmlkLmludGVyc2VjdGlvbihib3hBLCB7XG4gICAgICAgIHgxOiB4MSwgXG4gICAgICAgIHkxOiB5MSwgXG4gICAgICAgIHgyOiB4MixcbiAgICAgICAgeTI6IHkyXG4gICAgICB9KTtcbiAgICB9O1xuICB9KVxuXG4gIC5zdGF0aWMoZnVuY3Rpb24gaW50ZXJzZWN0aW9uKGEsIGIpIHtcbiAgICByZXR1cm4gKChhLngxIDw9IGIueDEgJiYgYi54MSA8PSBhLngyKSAmJiAoYS55MSA8PSBiLnkxICYmIGIueTEgPD0gYS55MikpXG4gICAgICAgIHx8ICgoYi54MSA8PSBhLngxICYmIGEueDEgPD0gYi54MikgJiYgKGIueTEgPD0gYS55MSAmJiBhLnkxIDw9IGIueTIpKVxuICAgICAgICB8fCAoKGEueDEgPD0gYi54MiAmJiBiLngyIDw9IGEueDIpICYmIChhLnkxIDw9IGIueTEgJiYgYi55MSA8PSBhLnkyKSlcbiAgICAgICAgfHwgKChiLngxIDw9IGEueDIgJiYgYS54MiA8PSBiLngyKSAmJiAoYi55MSA8PSBhLnkxICYmIGEueTEgPD0gYi55MikpO1xuICB9KTtcblxuXG52YXIgY291bnRlciA9IHN0cmFpbigpXG4gIC5wcm9wKCdudW1jb2xzJylcblxuICAucHJvcCgncm93c3BhbicpXG4gIC5kZWZhdWx0KDApXG5cbiAgLnByb3AoJ2NvbCcpXG4gIC5kZWZhdWx0KDApXG5cbiAgLnByb3AoJ3JvdycpXG4gIC5kZWZhdWx0KDApXG5cbiAgLm1ldGgoZnVuY3Rpb24gaW5jKGQpIHtcbiAgICB2YXIgY29sID0gZC5jb2wgKyBkLmNvbHNwYW47XG4gICAgdmFyIHJvdyA9IHRoaXMucm93KCk7XG5cbiAgICBpZiAoY29sID49IHRoaXMubnVtY29scygpKSB7XG4gICAgICBjb2wgPSAwO1xuICAgICAgcm93ICs9IHRoaXMucm93c3BhbigpO1xuICAgICAgdGhpcy5yb3dzcGFuKDApO1xuICAgIH1cblxuICAgIHRoaXNcbiAgICAgIC5jb2woY29sKVxuICAgICAgLnJvdyhyb3cpXG4gICAgICAucm93c3BhbihNYXRoLm1heCh0aGlzLnJvd3NwYW4oKSwgZC5yb3dzcGFuKSk7XG4gIH0pO1xuIiwiZXhwb3J0cy51dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcbmV4cG9ydHMudmlldyA9IHJlcXVpcmUoJy4vdmlldycpO1xuZXhwb3J0cy5ncmlkID0gcmVxdWlyZSgnLi9ncmlkJyk7XG5leHBvcnRzLndpZGdldHMgPSByZXF1aXJlKCcuL3dpZGdldHMnKTtcbmV4cG9ydHMuZGFzaGJvYXJkID0gcmVxdWlyZSgnLi9kYXNoYm9hcmQnKTtcbiIsInZhciB1dGlscyA9IGV4cG9ydHM7XG5cblxudXRpbHMuYWNjZXNzID0gZnVuY3Rpb24oZCwgbmFtZSwgZGVmYXVsdHZhbCkge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDMpIHtcbiAgICBkZWZhdWx0dmFsID0gbnVsbDtcbiAgfVxuXG4gIGlmICh0eXBlb2YgZCAhPSAnb2JqZWN0Jykge1xuICAgIHJldHVybiBkZWZhdWx0dmFsO1xuICB9XG5cbiAgdmFyIHZhbCA9IGRbbmFtZV07XG4gIHJldHVybiB0eXBlb2YgdmFsID09ICd1bmRlZmluZWQnXG4gICAgPyBkZWZhdWx0dmFsXG4gICAgOiB2YWw7XG59O1xuXG5cbnV0aWxzLmVuc3VyZSA9IGZ1bmN0aW9uKHYsIGRlZmF1bHR2YWwpIHtcbiAgcmV0dXJuIHYgPT09IG51bGwgfHwgdHlwZW9mIHYgPT0gJ3VuZGVmaW5lZCdcbiAgICA/IGRlZmF1bHR2YWxcbiAgICA6IHY7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBzdHJhaW4oKVxuICAuc3RhdGljKCdpbml0JywgZnVuY3Rpb24oZm4pIHtcbiAgICBzdHJhaW4uaW5pdC5jYWxsKHRoaXMsIGZ1bmN0aW9uKGVsKSB7XG4gICAgICBpZiAoZWwpIHtcbiAgICAgICAgdGhpcy5lbChlbCk7XG4gICAgICB9XG5cbiAgICAgIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfSk7XG4gIH0pXG5cbiAgLnN0YXRpYygnY29uZnByb3AnLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgdGhpcy5wcm9wKG5hbWUpO1xuXG4gICAgdGhpcy5zdGF0aWMobmFtZSwgZnVuY3Rpb24odikge1xuICAgICAgdGhpcy5wcm9wKG5hbWUpLmRlZmF1bHQodik7XG4gICAgfSk7XG4gIH0pXG5cbiAgLnN0YXRpYygnZHJhdycsIGZ1bmN0aW9uKGZuKSB7XG4gICAgdGhpcy5tZXRoKCdfZHJhd18nLCBmbik7XG4gIH0pXG5cbiAgLnN0YXRpYygnZW50ZXInLCBmdW5jdGlvbihmbikge1xuICAgIHRoaXMubWV0aCgnX2VudGVyXycsIGZuKTtcbiAgfSlcblxuICAubWV0aCgnX2RyYXdfJywgZnVuY3Rpb24oKSB7fSlcbiAgLm1ldGgoJ19lbnRlcl8nLCBmdW5jdGlvbigpIHt9KVxuXG4gIC5tZXRoKCdkcmF3JywgZnVuY3Rpb24oZGF0dW0pIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgdGhpcy5lbCgpLmRhdHVtKGRhdHVtKTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuZW50ZXJlZCgpKSB7XG4gICAgICB0aGlzLmVudGVyKCk7XG4gICAgfVxuXG4gICAgdmFyIHBhcmVudCA9IHRoaXMuX3R5cGVfLl9zdXBlcl8ucHJvdG90eXBlO1xuICAgIGlmICgnX2RyYXdfJyBpbiBwYXJlbnQpIHtcbiAgICAgIHBhcmVudC5fZHJhd18uY2FsbCh0aGlzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fZHJhd18oKTtcbiAgfSlcblxuICAubWV0aCgnZW50ZXInLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgcGFyZW50ID0gdGhpcy5fdHlwZV8uX3N1cGVyXy5wcm90b3R5cGU7XG5cbiAgICBpZiAoJ19lbnRlcl8nIGluIHBhcmVudCkge1xuICAgICAgcGFyZW50Ll9lbnRlcl8uY2FsbCh0aGlzKTtcbiAgICB9XG5cbiAgICB0aGlzLl9lbnRlcl8oKTtcbiAgICB0aGlzLmVudGVyZWQodHJ1ZSk7XG4gIH0pXG5cbiAgLnByb3AoJ2VudGVyZWQnKVxuICAuZGVmYXVsdChmYWxzZSlcblxuICAucHJvcCgnZWwnKVxuICAuc2V0KGZ1bmN0aW9uKHYpIHtcbiAgICByZXR1cm4gISh2IGluc3RhbmNlb2YgZDMuc2VsZWN0aW9uKVxuICAgICAgPyBkMy5zZWxlY3QodilcbiAgICAgIDogdjtcbiAgfSlcblxuICAuaW5pdChmdW5jdGlvbigpIHt9KVxuXG4gIC5pbnZva2UoZnVuY3Rpb24oZGF0dW0pIHtcbiAgICByZXR1cm4gdGhpcy5kcmF3KGRhdHVtKTtcbiAgfSk7XG4iLCJleHBvcnRzLndpZGdldCA9IHJlcXVpcmUoJy4vd2lkZ2V0Jyk7XG5leHBvcnRzLmxhc3R2YWx1ZSA9IHJlcXVpcmUoJy4vbGFzdHZhbHVlJyk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vd2lkZ2V0JykuZXh0ZW5kKClcbiAgLmNvbmZwcm9wKCd0aXRsZScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLnRpdGxlKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGl0bGU7IH0pXG5cbiAgLmNvbmZwcm9wKCd2YWx1ZXMnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC52YWx1ZXMoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC52YWx1ZXM7IH0pXG5cbiAgLmNvbmZwcm9wKCd4JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAueChmdW5jdGlvbihkKSB7IHJldHVybiBkLng7IH0pXG5cbiAgLmNvbmZwcm9wKCd5JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAueShmdW5jdGlvbihkKSB7IHJldHVybiBkLnk7IH0pXG5cbiAgLmNvbmZwcm9wKCdmb3JtYXQnKVxuICAuZm9ybWF0KGQzLmZvcm1hdCgpKVxuXG4gIC5jb25mcHJvcCgnbm9uZScpXG4gIC5ub25lKDApXG5cbiAgLmRyYXcoZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgdGhpcy5lbCgpXG4gICAgICAuaHRtbChudWxsKVxuICAgICAgLmFwcGVuZCgnZGl2JylcbiAgICAgICAgLmRhdHVtKHRoaXMudmFsdWVzKCkpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICd2YWx1ZXMnKVxuICAgICAgICAuYXBwZW5kKCd0ZXh0JylcbiAgICAgICAgICAuZGF0dW0oZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICAgICAgcmV0dXJuIGRbZC5sZW5ndGggLSAxXTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5hdHRyKCdjbGFzcycsICdsYXN0JylcbiAgICAgICAgICAudGV4dChmdW5jdGlvbihkLCBpKSB7XG4gICAgICAgICAgICB2YXIgdiA9IGRcbiAgICAgICAgICAgICAgPyBzZWxmLnkoKS5jYWxsKHRoaXMsIGQsIGkpXG4gICAgICAgICAgICAgIDogc2VsZi5ub25lKCk7XG5cbiAgICAgICAgICAgICAgcmV0dXJuIHNlbGYuZm9ybWF0KCkodik7XG4gICAgICAgICAgfSk7XG4gIH0pO1xuIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuLi92aWV3JykuZXh0ZW5kKClcbiAgLnN0YXRpYygnY29sc3BhbicsIDEpXG4gIC5zdGF0aWMoJ3Jvd3NwYW4nLCAxKVxuXG4gIC5jb25mcHJvcCgnd2lkdGgnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC53aWR0aCgyMDApXG5cbiAgLmNvbmZwcm9wKCdoZWlnaHQnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5oZWlnaHQoMjAwKVxuXG4gIC5kcmF3KGZ1bmN0aW9uKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIHRoaXMuZWwoKVxuICAgICAgLnN0eWxlKCd3aWR0aCcsIGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgICAgcmV0dXJuIHNlbGYud2lkdGgoKS5jYWxsKHRoaXMsIGQsIGkpICsgJ3B4JztcbiAgICAgIH0pXG4gICAgICAuc3R5bGUoJ2hlaWdodCcsIGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgICAgcmV0dXJuIHNlbGYuaGVpZ2h0KCkuY2FsbCh0aGlzLCBkLCBpKSArICdweCc7XG4gICAgICB9KTtcbiAgfSk7XG4iXX0=
(3)
});
