// sapphire 0.0.0


(function(factory) {
  if (typeof define === 'function' && define.amd) {
    define(["d3", "strain"], factory);
  } else if (typeof exports === 'object') {
    factory(["d3", "strain"].map(require));
  } else {
    factory(d3, strain);
  }
}(function(d3, strain) {
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
(3)
});
}));
