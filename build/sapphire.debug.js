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

    if (this.el().node() && !this.el().node().hasChildNodes()) {
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
  })

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy9kYXNoYm9hcmQuanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvZ3JpZC5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy9pbmRleC5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy91dGlscy5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy92aWV3LmpzIiwiL2hvbWUvanVzdGluL3ByYWVrZWx0L3NhcHBoaXJlL3NyYy9zY3JpcHRzL3dpZGdldHMvaW5kZXguanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvd2lkZ2V0cy9sYXN0dmFsdWUuanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvd2lkZ2V0cy93aWRnZXQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckVBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xudmFyIGxheW91dCA9IHJlcXVpcmUoJy4vZ3JpZCcpO1xudmFyIHdpZGdldHMgPSByZXF1aXJlKCcuL3dpZGdldHMnKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vdmlldycpLmV4dGVuZCgpXG4gIC5wcm9wKCd0eXBlcycpXG5cbiAgLmNvbmZwcm9wKCd0aXRsZScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLnRpdGxlKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGl0bGU7IH0pXG5cbiAgLmNvbmZwcm9wKCdrZXknKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5rZXkoZnVuY3Rpb24oZCwgaSkge1xuICAgIHJldHVybiAna2V5JyBpbiBkXG4gICAgICA/IGQua2V5XG4gICAgICA6IGk7XG4gIH0pXG5cbiAgLmNvbmZwcm9wKCd0eXBlJylcbiAgLnNldChmdW5jdGlvbihmbikge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBmbiA9IGQzLmZ1bmN0b3IoZm4pO1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgIHZhciBuYW1lID0gZm4uY2FsbCh0aGlzLCBkLCBpKTtcblxuICAgICAgaWYgKCFzZWxmLnR5cGVzKCkuaGFzKG5hbWUpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVucmVjb2duaXNlZCBkYXNoYm9hcmQgd2lkZ2V0IHR5cGUgJ1wiICsgbmFtZSArIFwiJ1wiKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHNlbGYudHlwZXMoKS5nZXQobmFtZSk7XG4gICAgfTtcbiAgfSlcbiAgLnR5cGUoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50eXBlOyB9KVxuXG4gIC5jb25mcHJvcCgnd2lkZ2V0cycpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLndpZGdldHMoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC53aWRnZXRzOyB9KVxuXG4gIC5wcm9wKCdjb2wnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHtcbiAgICByZXR1cm4gdXRpbHMuYWNjZXNzKGQsICdjb2wnKTtcbiAgfSlcblxuICAucHJvcCgncm93JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7XG4gICAgcmV0dXJuIHV0aWxzLmFjY2VzcyhkLCAncm93Jyk7XG4gIH0pXG5cbiAgLmNvbmZwcm9wKCdjb2xzcGFuJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuY29sc3BhbihmdW5jdGlvbihkKSB7XG4gICAgcmV0dXJuIHV0aWxzLmFjY2VzcyhkLCAnY29sc3BhbicpO1xuICB9KVxuXG4gIC5jb25mcHJvcCgncm93c3BhbicpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLnJvd3NwYW4oZnVuY3Rpb24oZCkge1xuICAgIHJldHVybiB1dGlscy5hY2Nlc3MoZCwgJ3Jvd3NwYW4nKTtcbiAgfSlcblxuICAuY29uZnByb3AoJ251bWNvbHMnKVxuICAubnVtY29scyg4KVxuXG4gIC5jb25mcHJvcCgncGFkZGluZycpXG4gIC5wYWRkaW5nKDUpXG5cbiAgLmluaXQoZnVuY3Rpb24oKSB7XG4gICAgdmFyIHR5cGVzID0gZDMubWFwKCk7XG5cbiAgICBkMy5rZXlzKHdpZGdldHMpLmZvckVhY2goZnVuY3Rpb24oaykge1xuICAgICAgdHlwZXMuc2V0KGssIHdpZGdldHNba10uZXh0ZW5kKCkpO1xuICAgIH0pO1xuXG4gICAgdGhpcy50eXBlcyh0eXBlcyk7XG4gIH0pXG5cbiAgLmRyYXcoZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgdmFyIGdyaWQgPSBsYXlvdXQoKVxuICAgICAgLnNjYWxlKDEwMClcbiAgICAgIC5udW1jb2xzKHRoaXMubnVtY29scygpKVxuICAgICAgLnBhZGRpbmcodGhpcy5wYWRkaW5nKCkpXG4gICAgICAuY29sKGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgICAgcmV0dXJuIHNlbGYuY29sKCkuY2FsbChzZWxmLCBkLCBpKTtcbiAgICAgIH0pXG4gICAgICAucm93KGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgICAgcmV0dXJuIHNlbGYucm93KCkuY2FsbChzZWxmLCBkLCBpKTtcbiAgICAgIH0pXG4gICAgICAuY29sc3BhbihmdW5jdGlvbihkLCBpKSB7XG4gICAgICAgIHZhciB2ID0gc2VsZi5jb2xzcGFuKCkuY2FsbChzZWxmLCBkLCBpKTtcbiAgICAgICAgdmFyIHR5cGUgPSBzZWxmLnR5cGUoKS5jYWxsKHRoaXMsIGQsIGkpO1xuICAgICAgICByZXR1cm4gdXRpbHMuZW5zdXJlKHYsIHR5cGUuY29sc3Bhbik7XG4gICAgICB9KVxuICAgICAgLnJvd3NwYW4oZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICB2YXIgdiA9IHNlbGYucm93c3BhbigpLmNhbGwoc2VsZiwgZCwgaSk7XG4gICAgICAgIHZhciB0eXBlID0gc2VsZi50eXBlKCkuY2FsbCh0aGlzLCBkLCBpKTtcbiAgICAgICAgcmV0dXJuIHV0aWxzLmVuc3VyZSh2LCB0eXBlLnJvd3NwYW4pO1xuICAgICAgfSk7XG5cbiAgICB0aGlzLmVsKCkuYXR0cignY2xhc3MnLCAnZGFzaGJvYXJkJyk7XG5cbiAgICB2YXIgd2lkZ2V0cyA9IHRoaXMuZWwoKS5zZWxlY3RBbGwoJy53aWRnZXRzJylcbiAgICAgIC5kYXRhKGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgICAgcmV0dXJuIFtzZWxmLndpZGdldHMoKS5jYWxsKHRoaXMsIGQsIGkpXTtcbiAgICAgIH0pO1xuXG4gICAgd2lkZ2V0cy5lbnRlcigpLmFwcGVuZCgnZGl2JylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd3aWRnZXRzJyk7XG5cbiAgICB2YXIgd2lkZ2V0ID0gd2lkZ2V0cy5zZWxlY3RBbGwoJy53aWRnZXQnKVxuICAgICAgLmRhdGEoZnVuY3Rpb24oZCkgeyByZXR1cm4gZDsgfSwgdGhpcy5rZXkoKSk7XG5cbiAgICB3aWRnZXQuZW50ZXIoKS5hcHBlbmQoJ2RpdicpO1xuICAgIHZhciBncmlkRWxzID0gZ3JpZCh3aWRnZXQuZGF0YSgpKTtcblxuICAgIHdpZGdldFxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3dpZGdldCcpXG4gICAgICAuYXR0cignZGF0YS1rZXknLCB0aGlzLmtleSgpKVxuICAgICAgLmVhY2goZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICB2YXIgZ3JpZEVsID0gZ3JpZEVsc1tpXTtcblxuICAgICAgICBkMy5zZWxlY3QodGhpcylcbiAgICAgICAgICAuc3R5bGUoJ2xlZnQnLCBncmlkRWwueCArICdweCcpXG4gICAgICAgICAgLnN0eWxlKCd0b3AnLCBncmlkRWwueSArICdweCcpO1xuXG4gICAgICAgIHNlbGYudHlwZSgpXG4gICAgICAgICAgLmNhbGwodGhpcywgZCwgaSlcbiAgICAgICAgICAubmV3KHRoaXMpXG4gICAgICAgICAgLndpZHRoKGdyaWRFbC53aWR0aClcbiAgICAgICAgICAuaGVpZ2h0KGdyaWRFbC5oZWlnaHQpXG4gICAgICAgICAgLmRyYXcoKTtcbiAgICAgIH0pO1xuXG4gICAgd2lkZ2V0LmV4aXQoKS5yZW1vdmUoKTtcbiAgfSk7XG4iLCJ2YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG5cblxudmFyIGdyaWQgPSBtb2R1bGUuZXhwb3J0cyA9IHN0cmFpbigpXG4gIC5wcm9wKCdjb2wnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHtcbiAgICByZXR1cm4gdXRpbHMuYWNjZXNzKGQsICdjb2wnKTtcbiAgfSlcblxuICAucHJvcCgncm93JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7XG4gICAgcmV0dXJuIHV0aWxzLmFjY2VzcyhkLCAncm93Jyk7XG4gIH0pXG5cbiAgLnByb3AoJ251bWNvbHMnKVxuICAuZGVmYXVsdCg4KVxuXG4gIC5wcm9wKCdzY2FsZScpXG4gIC5kZWZhdWx0KDEwKVxuXG4gIC5wcm9wKCdwYWRkaW5nJylcbiAgLmRlZmF1bHQoNSlcblxuICAucHJvcCgnY29sc3BhbicpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkge1xuICAgIHJldHVybiB1dGlscy5hY2Nlc3MoZCwgJ2NvbHNwYW4nLCAxKTtcbiAgfSlcblxuICAucHJvcCgncm93c3BhbicpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkge1xuICAgIHJldHVybiB1dGlscy5hY2Nlc3MoZCwgJ3Jvd3NwYW4nLCAxKTtcbiAgfSlcblxuICAuaW52b2tlKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIGJlc3QgPSBjb3VudGVyKCkubnVtY29scyh0aGlzLm51bWNvbHMoKSk7XG5cbiAgICBkYXRhID0gKGRhdGEgfHwgW10pLm1hcChmdW5jdGlvbihkLCBpKSB7XG4gICAgICBkID0ge1xuICAgICAgICBkYXRhOiBkLFxuICAgICAgICBjb2w6IHV0aWxzLmVuc3VyZShzZWxmLmNvbCgpLmNhbGwoc2VsZiwgZCwgaSksIGJlc3QuY29sKCkpLCBcbiAgICAgICAgcm93OiB1dGlscy5lbnN1cmUoc2VsZi5yb3coKS5jYWxsKHNlbGYsIGQsIGkpLCBiZXN0LnJvdygpKSxcbiAgICAgICAgcm93c3Bhbjogc2VsZi5yb3dzcGFuKCkuY2FsbChzZWxmLCBkLCBpKSxcbiAgICAgICAgY29sc3Bhbjogc2VsZi5jb2xzcGFuKCkuY2FsbChzZWxmLCBkLCBpKVxuICAgICAgfTtcblxuICAgICAgYmVzdC5pbmMoZCk7XG4gICAgICByZXR1cm4gZDtcbiAgICB9KTtcblxuICAgIHZhciBxdWFkdHJlZSA9IGQzLmdlb20ucXVhZHRyZWUoKVxuICAgICAgLngoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5jb2w7IH0pXG4gICAgICAueShmdW5jdGlvbihkKSB7IHJldHVybiBkLnJvdzsgfSk7XG5cbiAgICB2YXIgcm9vdCA9IHF1YWR0cmVlKGRhdGEpO1xuICAgIHZhciBkYmxQYWRkaW5nID0gdGhpcy5wYWRkaW5nKCkgKiAyO1xuXG4gICAgZGF0YS5mb3JFYWNoKGZ1bmN0aW9uKGQpIHtcbiAgICAgIHJvb3QudmlzaXQoZ3JpZC51bmNvbGxpZGUoZCkpO1xuICAgICAgZC54ID0gKGQuY29sICogc2VsZi5zY2FsZSgpKSArIHNlbGYucGFkZGluZygpO1xuICAgICAgZC55ID0gKGQucm93ICogc2VsZi5zY2FsZSgpKSArIHNlbGYucGFkZGluZygpO1xuICAgICAgZC53aWR0aCA9IChkLmNvbHNwYW4gKiBzZWxmLnNjYWxlKCkpIC0gZGJsUGFkZGluZztcbiAgICAgIGQuaGVpZ2h0ID0gKGQucm93c3BhbiAqIHNlbGYuc2NhbGUoKSkgLSBkYmxQYWRkaW5nO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGRhdGE7XG4gIH0pXG5cbiAgLnN0YXRpYyhmdW5jdGlvbiBib3goZCkge1xuICAgIHJldHVybiB7XG4gICAgICB4MTogZC5jb2wsXG4gICAgICB4MjogZC5jb2wgKyBkLmNvbHNwYW4gLSAxLFxuICAgICAgeTE6IGQucm93LFxuICAgICAgeTI6IGQucm93ICsgZC5yb3dzcGFuIC0gMVxuICAgIH07XG4gIH0pXG5cbiAgLnN0YXRpYyhmdW5jdGlvbiB1bmNvbGxpZGUoYSkge1xuICAgIHZhciBib3hBID0gZ3JpZC5ib3goYSk7XG4gICAgXG4gICAgcmV0dXJuIGZ1bmN0aW9uKG5vZGUsIHgxLCB5MSwgeDIsIHkyKSB7XG4gICAgICB2YXIgYiA9IG5vZGUucG9pbnQ7XG5cbiAgICAgIGlmIChiICYmIGEgIT09IGIgJiYgZ3JpZC5pbnRlcnNlY3Rpb24oYm94QSwgZ3JpZC5ib3goYikpKSB7XG4gICAgICAgIGIucm93ID0gYm94QS55MiArIDE7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiAhZ3JpZC5pbnRlcnNlY3Rpb24oYm94QSwge1xuICAgICAgICB4MTogeDEsIFxuICAgICAgICB5MTogeTEsIFxuICAgICAgICB4MjogeDIsXG4gICAgICAgIHkyOiB5MlxuICAgICAgfSk7XG4gICAgfTtcbiAgfSlcblxuICAuc3RhdGljKGZ1bmN0aW9uIGludGVyc2VjdGlvbihhLCBiKSB7XG4gICAgcmV0dXJuICgoYS54MSA8PSBiLngxICYmIGIueDEgPD0gYS54MikgJiYgKGEueTEgPD0gYi55MSAmJiBiLnkxIDw9IGEueTIpKVxuICAgICAgICB8fCAoKGIueDEgPD0gYS54MSAmJiBhLngxIDw9IGIueDIpICYmIChiLnkxIDw9IGEueTEgJiYgYS55MSA8PSBiLnkyKSlcbiAgICAgICAgfHwgKChhLngxIDw9IGIueDIgJiYgYi54MiA8PSBhLngyKSAmJiAoYS55MSA8PSBiLnkxICYmIGIueTEgPD0gYS55MikpXG4gICAgICAgIHx8ICgoYi54MSA8PSBhLngyICYmIGEueDIgPD0gYi54MikgJiYgKGIueTEgPD0gYS55MSAmJiBhLnkxIDw9IGIueTIpKTtcbiAgfSk7XG5cblxudmFyIGNvdW50ZXIgPSBzdHJhaW4oKVxuICAucHJvcCgnbnVtY29scycpXG5cbiAgLnByb3AoJ3Jvd3NwYW4nKVxuICAuZGVmYXVsdCgwKVxuXG4gIC5wcm9wKCdjb2wnKVxuICAuZGVmYXVsdCgwKVxuXG4gIC5wcm9wKCdyb3cnKVxuICAuZGVmYXVsdCgwKVxuXG4gIC5tZXRoKGZ1bmN0aW9uIGluYyhkKSB7XG4gICAgdmFyIGNvbCA9IGQuY29sICsgZC5jb2xzcGFuO1xuICAgIHZhciByb3cgPSB0aGlzLnJvdygpO1xuXG4gICAgaWYgKGNvbCA+PSB0aGlzLm51bWNvbHMoKSkge1xuICAgICAgY29sID0gMDtcbiAgICAgIHJvdyArPSB0aGlzLnJvd3NwYW4oKTtcbiAgICAgIHRoaXMucm93c3BhbigwKTtcbiAgICB9XG5cbiAgICB0aGlzXG4gICAgICAuY29sKGNvbClcbiAgICAgIC5yb3cocm93KVxuICAgICAgLnJvd3NwYW4oTWF0aC5tYXgodGhpcy5yb3dzcGFuKCksIGQucm93c3BhbikpO1xuICB9KTtcbiIsImV4cG9ydHMudXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG5leHBvcnRzLnZpZXcgPSByZXF1aXJlKCcuL3ZpZXcnKTtcbmV4cG9ydHMuZ3JpZCA9IHJlcXVpcmUoJy4vZ3JpZCcpO1xuZXhwb3J0cy53aWRnZXRzID0gcmVxdWlyZSgnLi93aWRnZXRzJyk7XG5leHBvcnRzLmRhc2hib2FyZCA9IHJlcXVpcmUoJy4vZGFzaGJvYXJkJyk7XG4iLCJ2YXIgdXRpbHMgPSBleHBvcnRzO1xuXG5cbnV0aWxzLmFjY2VzcyA9IGZ1bmN0aW9uKGQsIG5hbWUsIGRlZmF1bHR2YWwpIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCAzKSB7XG4gICAgZGVmYXVsdHZhbCA9IG51bGw7XG4gIH1cblxuICBpZiAodHlwZW9mIGQgIT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4gZGVmYXVsdHZhbDtcbiAgfVxuXG4gIHZhciB2YWwgPSBkW25hbWVdO1xuICByZXR1cm4gdHlwZW9mIHZhbCA9PSAndW5kZWZpbmVkJ1xuICAgID8gZGVmYXVsdHZhbFxuICAgIDogdmFsO1xufTtcblxuXG51dGlscy5lbnN1cmUgPSBmdW5jdGlvbih2LCBkZWZhdWx0dmFsKSB7XG4gIHJldHVybiB2ID09PSBudWxsIHx8IHR5cGVvZiB2ID09ICd1bmRlZmluZWQnXG4gICAgPyBkZWZhdWx0dmFsXG4gICAgOiB2O1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gc3RyYWluKClcbiAgLnN0YXRpYygnaW5pdCcsIGZ1bmN0aW9uKGZuKSB7XG4gICAgc3RyYWluLmluaXQuY2FsbCh0aGlzLCBmdW5jdGlvbihlbCkge1xuICAgICAgaWYgKGVsKSB7XG4gICAgICAgIHRoaXMuZWwoZWwpO1xuICAgICAgfVxuXG4gICAgICBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH0pO1xuICB9KVxuXG4gIC5zdGF0aWMoJ2NvbmZwcm9wJywgZnVuY3Rpb24obmFtZSkge1xuICAgIHRoaXMucHJvcChuYW1lKTtcblxuICAgIHRoaXMuc3RhdGljKG5hbWUsIGZ1bmN0aW9uKHYpIHtcbiAgICAgIHRoaXMucHJvcChuYW1lKS5kZWZhdWx0KHYpO1xuICAgIH0pO1xuICB9KVxuXG4gIC5zdGF0aWMoJ2RyYXcnLCBmdW5jdGlvbihmbikge1xuICAgIHRoaXMubWV0aCgnX2RyYXdfJywgZm4pO1xuICB9KVxuXG4gIC5zdGF0aWMoJ2VudGVyJywgZnVuY3Rpb24oZm4pIHtcbiAgICB0aGlzLm1ldGgoJ19lbnRlcl8nLCBmbik7XG4gIH0pXG5cbiAgLm1ldGgoJ19kcmF3XycsIGZ1bmN0aW9uKCkge30pXG4gIC5tZXRoKCdfZW50ZXJfJywgZnVuY3Rpb24oKSB7fSlcblxuICAubWV0aCgnZHJhdycsIGZ1bmN0aW9uKGRhdHVtKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgIHRoaXMuZWwoKS5kYXR1bShkYXR1bSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuZWwoKS5ub2RlKCkgJiYgIXRoaXMuZWwoKS5ub2RlKCkuaGFzQ2hpbGROb2RlcygpKSB7XG4gICAgICB0aGlzLmVudGVyKCk7XG4gICAgfVxuXG4gICAgdmFyIHBhcmVudCA9IHRoaXMuX3R5cGVfLl9zdXBlcl8ucHJvdG90eXBlO1xuICAgIGlmICgnX2RyYXdfJyBpbiBwYXJlbnQpIHtcbiAgICAgIHBhcmVudC5fZHJhd18uY2FsbCh0aGlzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fZHJhd18oKTtcbiAgfSlcblxuICAubWV0aCgnZW50ZXInLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgcGFyZW50ID0gdGhpcy5fdHlwZV8uX3N1cGVyXy5wcm90b3R5cGU7XG5cbiAgICBpZiAoJ19lbnRlcl8nIGluIHBhcmVudCkge1xuICAgICAgcGFyZW50Ll9lbnRlcl8uY2FsbCh0aGlzKTtcbiAgICB9XG5cbiAgICB0aGlzLl9lbnRlcl8oKTtcbiAgfSlcblxuICAucHJvcCgnZWwnKVxuICAuc2V0KGZ1bmN0aW9uKHYpIHtcbiAgICByZXR1cm4gISh2IGluc3RhbmNlb2YgZDMuc2VsZWN0aW9uKVxuICAgICAgPyBkMy5zZWxlY3QodilcbiAgICAgIDogdjtcbiAgfSlcblxuICAuaW5pdChmdW5jdGlvbigpIHt9KVxuXG4gIC5pbnZva2UoZnVuY3Rpb24oZGF0dW0pIHtcbiAgICByZXR1cm4gdGhpcy5kcmF3KGRhdHVtKTtcbiAgfSk7XG4iLCJleHBvcnRzLndpZGdldCA9IHJlcXVpcmUoJy4vd2lkZ2V0Jyk7XG5leHBvcnRzLmxhc3R2YWx1ZSA9IHJlcXVpcmUoJy4vbGFzdHZhbHVlJyk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vd2lkZ2V0JykuZXh0ZW5kKClcbiAgLmNvbmZwcm9wKCd0aXRsZScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLnRpdGxlKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGl0bGU7IH0pXG5cbiAgLmNvbmZwcm9wKCd2YWx1ZXMnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC52YWx1ZXMoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC52YWx1ZXM7IH0pXG5cbiAgLmNvbmZwcm9wKCd4JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAueChmdW5jdGlvbihkKSB7IHJldHVybiBkLng7IH0pXG5cbiAgLmNvbmZwcm9wKCd5JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAueShmdW5jdGlvbihkKSB7IHJldHVybiBkLnk7IH0pXG5cbiAgLmNvbmZwcm9wKCdmb3JtYXQnKVxuICAuZm9ybWF0KGQzLmZvcm1hdCgpKVxuXG4gIC5jb25mcHJvcCgnbm9uZScpXG4gIC5ub25lKDApXG5cbiAgLmRyYXcoZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgdGhpcy5lbCgpXG4gICAgICAuaHRtbChudWxsKVxuICAgICAgLmFwcGVuZCgnZGl2JylcbiAgICAgICAgLmRhdHVtKHRoaXMudmFsdWVzKCkpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICd2YWx1ZXMnKVxuICAgICAgICAuYXBwZW5kKCd0ZXh0JylcbiAgICAgICAgICAuZGF0dW0oZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICAgICAgcmV0dXJuIGRbZC5sZW5ndGggLSAxXTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5hdHRyKCdjbGFzcycsICdsYXN0JylcbiAgICAgICAgICAudGV4dChmdW5jdGlvbihkLCBpKSB7XG4gICAgICAgICAgICB2YXIgdiA9IGRcbiAgICAgICAgICAgICAgPyBzZWxmLnkoKS5jYWxsKHRoaXMsIGQsIGkpXG4gICAgICAgICAgICAgIDogc2VsZi5ub25lKCk7XG5cbiAgICAgICAgICAgICAgcmV0dXJuIHNlbGYuZm9ybWF0KCkodik7XG4gICAgICAgICAgfSk7XG4gIH0pO1xuIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuLi92aWV3JykuZXh0ZW5kKClcbiAgLnN0YXRpYygnY29sc3BhbicsIDEpXG4gIC5zdGF0aWMoJ3Jvd3NwYW4nLCAxKVxuXG4gIC5jb25mcHJvcCgnd2lkdGgnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC53aWR0aCgyMDApXG5cbiAgLmNvbmZwcm9wKCdoZWlnaHQnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5oZWlnaHQoMjAwKVxuXG4gIC5kcmF3KGZ1bmN0aW9uKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIHRoaXMuZWwoKVxuICAgICAgLnN0eWxlKCd3aWR0aCcsIGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgICAgcmV0dXJuIHNlbGYud2lkdGgoKS5jYWxsKHRoaXMsIGQsIGkpICsgJ3B4JztcbiAgICAgIH0pXG4gICAgICAuc3R5bGUoJ2hlaWdodCcsIGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgICAgcmV0dXJuIHNlbGYuaGVpZ2h0KCkuY2FsbCh0aGlzLCBkLCBpKSArICdweCc7XG4gICAgICB9KTtcbiAgfSk7XG4iXX0=
(3)
});
