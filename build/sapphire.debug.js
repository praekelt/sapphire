!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.sapphire=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
var utils = _dereq_('./utils');
var layout = _dereq_('./grid');
var widgets = _dereq_('./widgets');


module.exports = _dereq_('./view').extend()
  .prop('types')

  .prop('title')
  .set(d3.functor)
  .default(function(d) { return d.title; })

  .prop('key')
  .set(d3.functor)
  .default(function(d, i) {
    return 'key' in d
      ? d.key
      : i;
  })

  .prop('type')
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
  .default(function(d) { return d.type; })

  .prop('widgets')
  .set(d3.functor)
  .default(function(d) { return d.widgets; })

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

  .prop('colspan')
  .set(d3.functor)
  .default(function(d) {
    return utils.access(d, 'colspan');
  })

  .prop('rowspan')
  .set(d3.functor)
  .default(function(d) {
    return utils.access(d, 'rowspan');
  })

  .prop('numcols')
  .default(8)

  .prop('padding')
  .default(5)

  .init(function() {
    var types = d3.map();

    d3.keys(widgets).forEach(function(k) {
      types.set(k, widgets[k].new());
    });

    this.types(types);
  })

  .enter(function(el) {
    el.attr('class', 'dashboard')
      .append('div')
        .attr('class', 'widgets');
  })

  .draw(function(el) {
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
        return utils.ensure(v, type.colspan());
      })
      .rowspan(function(d, i) {
        var v = self.rowspan().call(self, d, i);
        var type = self.type().call(this, d, i);
        return utils.ensure(v, type.rowspan());
      });

    var widget = el.select('.widgets').selectAll('.widget')
      .data(function(d, i) {
        return self.widgets().call(this, d, i);
      });

    widget.enter().append('div')
      .attr('class', 'widget');

    var gridEls = grid(widget.data());

    widget
      .attr('data-key', this.key())
      .each(function(d, i) {
        var type = self.type().call(this, d, i);
        var gridEl = gridEls[i];

        d3.select(this)
          .call(type)
          .style('left', gridEl.x + 'px')
          .style('top', gridEl.y + 'px')
          .style('width', gridEl.width + 'px')
          .style('height', gridEl.height + 'px');
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


utils.ensureEl = function(el) {
  return !(el instanceof d3.selection)
    ? d3.select(el)
    : el;
};

},{}],5:[function(_dereq_,module,exports){
module.exports = strain()
  .static(function draw(fn) {
    this.meth('_draw_', fn);
  })
  .draw(function() {})

  .static(function enter(fn) {
    this.meth('_enter_', fn);
  })
  .enter(function() {})

  .meth(function draw(el) {
    el = sapphire.utils.ensureEl(el);

    if (el.node() && !el.node().hasChildNodes()) {
      this.enter(el);
    }

    var parent = this._type_._super_.prototype;
    if ('_draw_' in parent) {
      parent._draw_.call(this, el);
    }

    return this._draw_(el);
  })

  .meth(function enter(el) {
    el = sapphire.utils.ensureEl(el);

    var parent = this._type_._super_.prototype;
    if ('_enter_' in parent) {
      parent._enter_.call(this, el);
    }

    this._enter_(el);
  })

  .invoke(function(el) {
    return this.draw(el);
  });

},{}],6:[function(_dereq_,module,exports){
exports.widget = _dereq_('./widget');
exports.lastvalue = _dereq_('./lastvalue');

},{"./lastvalue":7,"./widget":8}],7:[function(_dereq_,module,exports){
module.exports = _dereq_('./widget').extend()
  .prop('title')
  .set(d3.functor)
  .default(function(d) { return d.title; })

  .prop('values')
  .set(d3.functor)
  .default(function(d) { return d.values; })

  .prop('x')
  .set(d3.functor)
  .default(function(d) { return d.x; })

  .prop('y')
  .set(d3.functor)
  .default(function(d) { return d.y; })

  .prop('format')
  .default(d3.format())

  .prop('none')
  .default(0)

  .enter(function(el) {
    el.append('class', 'lastvalue')
      .append('div')
        .attr('class', 'last');
  })

  .draw(function(el) {
    var self = this;

    el.select('.last')
      .datum(function(d, i) {
        var values = self.values().call(this, d, i);
        return values[values.length - 1];
      })
      .text(function(d, i) {
        var v = d
          ? self.y().call(this, d, i)
          : self.none();

          return self.format()(v);
      });
  });

},{"./widget":8}],8:[function(_dereq_,module,exports){
module.exports = _dereq_('../view').extend()
  .prop('colspan')
  .default(1)

  .prop('rowspan')
  .default(1)

  .prop('width')
  .set(d3.functor)
  .default(200)

  .prop('height')
  .set(d3.functor)
  .default(200)

  .draw(function(el) {
    var self = this;

    el.style('width', function(d, i) {
        return self.width().call(this, d, i) + 'px';
      })
      .style('height', function(d, i) {
        return self.height().call(this, d, i) + 'px';
      });
  });

},{"../view":5}]},{},[3])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy9kYXNoYm9hcmQuanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvZ3JpZC5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy9pbmRleC5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy91dGlscy5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy92aWV3LmpzIiwiL2hvbWUvanVzdGluL3ByYWVrZWx0L3NhcHBoaXJlL3NyYy9zY3JpcHRzL3dpZGdldHMvaW5kZXguanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvd2lkZ2V0cy9sYXN0dmFsdWUuanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvd2lkZ2V0cy93aWRnZXQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcbnZhciBsYXlvdXQgPSByZXF1aXJlKCcuL2dyaWQnKTtcbnZhciB3aWRnZXRzID0gcmVxdWlyZSgnLi93aWRnZXRzJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL3ZpZXcnKS5leHRlbmQoKVxuICAucHJvcCgndHlwZXMnKVxuXG4gIC5wcm9wKCd0aXRsZScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50aXRsZTsgfSlcblxuICAucHJvcCgna2V5JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkLCBpKSB7XG4gICAgcmV0dXJuICdrZXknIGluIGRcbiAgICAgID8gZC5rZXlcbiAgICAgIDogaTtcbiAgfSlcblxuICAucHJvcCgndHlwZScpXG4gIC5zZXQoZnVuY3Rpb24oZm4pIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgZm4gPSBkMy5mdW5jdG9yKGZuKTtcblxuICAgIHJldHVybiBmdW5jdGlvbihkLCBpKSB7XG4gICAgICB2YXIgbmFtZSA9IGZuLmNhbGwodGhpcywgZCwgaSk7XG5cbiAgICAgIGlmICghc2VsZi50eXBlcygpLmhhcyhuYW1lKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbnJlY29nbmlzZWQgZGFzaGJvYXJkIHdpZGdldCB0eXBlICdcIiArIG5hbWUgKyBcIidcIik7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzZWxmLnR5cGVzKCkuZ2V0KG5hbWUpO1xuICAgIH07XG4gIH0pXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudHlwZTsgfSlcblxuICAucHJvcCgnd2lkZ2V0cycpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC53aWRnZXRzOyB9KVxuXG4gIC5wcm9wKCdjb2wnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHtcbiAgICByZXR1cm4gdXRpbHMuYWNjZXNzKGQsICdjb2wnKTtcbiAgfSlcblxuICAucHJvcCgncm93JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7XG4gICAgcmV0dXJuIHV0aWxzLmFjY2VzcyhkLCAncm93Jyk7XG4gIH0pXG5cbiAgLnByb3AoJ2NvbHNwYW4nKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHtcbiAgICByZXR1cm4gdXRpbHMuYWNjZXNzKGQsICdjb2xzcGFuJyk7XG4gIH0pXG5cbiAgLnByb3AoJ3Jvd3NwYW4nKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHtcbiAgICByZXR1cm4gdXRpbHMuYWNjZXNzKGQsICdyb3dzcGFuJyk7XG4gIH0pXG5cbiAgLnByb3AoJ251bWNvbHMnKVxuICAuZGVmYXVsdCg4KVxuXG4gIC5wcm9wKCdwYWRkaW5nJylcbiAgLmRlZmF1bHQoNSlcblxuICAuaW5pdChmdW5jdGlvbigpIHtcbiAgICB2YXIgdHlwZXMgPSBkMy5tYXAoKTtcblxuICAgIGQzLmtleXMod2lkZ2V0cykuZm9yRWFjaChmdW5jdGlvbihrKSB7XG4gICAgICB0eXBlcy5zZXQoaywgd2lkZ2V0c1trXS5uZXcoKSk7XG4gICAgfSk7XG5cbiAgICB0aGlzLnR5cGVzKHR5cGVzKTtcbiAgfSlcblxuICAuZW50ZXIoZnVuY3Rpb24oZWwpIHtcbiAgICBlbC5hdHRyKCdjbGFzcycsICdkYXNoYm9hcmQnKVxuICAgICAgLmFwcGVuZCgnZGl2JylcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ3dpZGdldHMnKTtcbiAgfSlcblxuICAuZHJhdyhmdW5jdGlvbihlbCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIHZhciBncmlkID0gbGF5b3V0KClcbiAgICAgIC5zY2FsZSgxMDApXG4gICAgICAubnVtY29scyh0aGlzLm51bWNvbHMoKSlcbiAgICAgIC5wYWRkaW5nKHRoaXMucGFkZGluZygpKVxuICAgICAgLmNvbChmdW5jdGlvbihkLCBpKSB7XG4gICAgICAgIHJldHVybiBzZWxmLmNvbCgpLmNhbGwoc2VsZiwgZCwgaSk7XG4gICAgICB9KVxuICAgICAgLnJvdyhmdW5jdGlvbihkLCBpKSB7XG4gICAgICAgIHJldHVybiBzZWxmLnJvdygpLmNhbGwoc2VsZiwgZCwgaSk7XG4gICAgICB9KVxuICAgICAgLmNvbHNwYW4oZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICB2YXIgdiA9IHNlbGYuY29sc3BhbigpLmNhbGwoc2VsZiwgZCwgaSk7XG4gICAgICAgIHZhciB0eXBlID0gc2VsZi50eXBlKCkuY2FsbCh0aGlzLCBkLCBpKTtcbiAgICAgICAgcmV0dXJuIHV0aWxzLmVuc3VyZSh2LCB0eXBlLmNvbHNwYW4oKSk7XG4gICAgICB9KVxuICAgICAgLnJvd3NwYW4oZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICB2YXIgdiA9IHNlbGYucm93c3BhbigpLmNhbGwoc2VsZiwgZCwgaSk7XG4gICAgICAgIHZhciB0eXBlID0gc2VsZi50eXBlKCkuY2FsbCh0aGlzLCBkLCBpKTtcbiAgICAgICAgcmV0dXJuIHV0aWxzLmVuc3VyZSh2LCB0eXBlLnJvd3NwYW4oKSk7XG4gICAgICB9KTtcblxuICAgIHZhciB3aWRnZXQgPSBlbC5zZWxlY3QoJy53aWRnZXRzJykuc2VsZWN0QWxsKCcud2lkZ2V0JylcbiAgICAgIC5kYXRhKGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgICAgcmV0dXJuIHNlbGYud2lkZ2V0cygpLmNhbGwodGhpcywgZCwgaSk7XG4gICAgICB9KTtcblxuICAgIHdpZGdldC5lbnRlcigpLmFwcGVuZCgnZGl2JylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd3aWRnZXQnKTtcblxuICAgIHZhciBncmlkRWxzID0gZ3JpZCh3aWRnZXQuZGF0YSgpKTtcblxuICAgIHdpZGdldFxuICAgICAgLmF0dHIoJ2RhdGEta2V5JywgdGhpcy5rZXkoKSlcbiAgICAgIC5lYWNoKGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgICAgdmFyIHR5cGUgPSBzZWxmLnR5cGUoKS5jYWxsKHRoaXMsIGQsIGkpO1xuICAgICAgICB2YXIgZ3JpZEVsID0gZ3JpZEVsc1tpXTtcblxuICAgICAgICBkMy5zZWxlY3QodGhpcylcbiAgICAgICAgICAuY2FsbCh0eXBlKVxuICAgICAgICAgIC5zdHlsZSgnbGVmdCcsIGdyaWRFbC54ICsgJ3B4JylcbiAgICAgICAgICAuc3R5bGUoJ3RvcCcsIGdyaWRFbC55ICsgJ3B4JylcbiAgICAgICAgICAuc3R5bGUoJ3dpZHRoJywgZ3JpZEVsLndpZHRoICsgJ3B4JylcbiAgICAgICAgICAuc3R5bGUoJ2hlaWdodCcsIGdyaWRFbC5oZWlnaHQgKyAncHgnKTtcbiAgICAgIH0pO1xuXG4gICAgd2lkZ2V0LmV4aXQoKS5yZW1vdmUoKTtcblxuICB9KTtcbiIsInZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcblxuXG52YXIgZ3JpZCA9IG1vZHVsZS5leHBvcnRzID0gc3RyYWluKClcbiAgLnByb3AoJ2NvbCcpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkge1xuICAgIHJldHVybiB1dGlscy5hY2Nlc3MoZCwgJ2NvbCcpO1xuICB9KVxuXG4gIC5wcm9wKCdyb3cnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHtcbiAgICByZXR1cm4gdXRpbHMuYWNjZXNzKGQsICdyb3cnKTtcbiAgfSlcblxuICAucHJvcCgnbnVtY29scycpXG4gIC5kZWZhdWx0KDgpXG5cbiAgLnByb3AoJ3NjYWxlJylcbiAgLmRlZmF1bHQoMTApXG5cbiAgLnByb3AoJ3BhZGRpbmcnKVxuICAuZGVmYXVsdCg1KVxuXG4gIC5wcm9wKCdjb2xzcGFuJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7XG4gICAgcmV0dXJuIHV0aWxzLmFjY2VzcyhkLCAnY29sc3BhbicsIDEpO1xuICB9KVxuXG4gIC5wcm9wKCdyb3dzcGFuJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7XG4gICAgcmV0dXJuIHV0aWxzLmFjY2VzcyhkLCAncm93c3BhbicsIDEpO1xuICB9KVxuXG4gIC5pbnZva2UoZnVuY3Rpb24oZGF0YSkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgYmVzdCA9IGNvdW50ZXIoKS5udW1jb2xzKHRoaXMubnVtY29scygpKTtcblxuICAgIGRhdGEgPSAoZGF0YSB8fCBbXSkubWFwKGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgIGQgPSB7XG4gICAgICAgIGRhdGE6IGQsXG4gICAgICAgIGNvbDogdXRpbHMuZW5zdXJlKHNlbGYuY29sKCkuY2FsbChzZWxmLCBkLCBpKSwgYmVzdC5jb2woKSksIFxuICAgICAgICByb3c6IHV0aWxzLmVuc3VyZShzZWxmLnJvdygpLmNhbGwoc2VsZiwgZCwgaSksIGJlc3Qucm93KCkpLFxuICAgICAgICByb3dzcGFuOiBzZWxmLnJvd3NwYW4oKS5jYWxsKHNlbGYsIGQsIGkpLFxuICAgICAgICBjb2xzcGFuOiBzZWxmLmNvbHNwYW4oKS5jYWxsKHNlbGYsIGQsIGkpXG4gICAgICB9O1xuXG4gICAgICBiZXN0LmluYyhkKTtcbiAgICAgIHJldHVybiBkO1xuICAgIH0pO1xuXG4gICAgdmFyIHF1YWR0cmVlID0gZDMuZ2VvbS5xdWFkdHJlZSgpXG4gICAgICAueChmdW5jdGlvbihkKSB7IHJldHVybiBkLmNvbDsgfSlcbiAgICAgIC55KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQucm93OyB9KTtcblxuICAgIHZhciByb290ID0gcXVhZHRyZWUoZGF0YSk7XG4gICAgdmFyIGRibFBhZGRpbmcgPSB0aGlzLnBhZGRpbmcoKSAqIDI7XG5cbiAgICBkYXRhLmZvckVhY2goZnVuY3Rpb24oZCkge1xuICAgICAgcm9vdC52aXNpdChncmlkLnVuY29sbGlkZShkKSk7XG4gICAgICBkLnggPSAoZC5jb2wgKiBzZWxmLnNjYWxlKCkpICsgc2VsZi5wYWRkaW5nKCk7XG4gICAgICBkLnkgPSAoZC5yb3cgKiBzZWxmLnNjYWxlKCkpICsgc2VsZi5wYWRkaW5nKCk7XG4gICAgICBkLndpZHRoID0gKGQuY29sc3BhbiAqIHNlbGYuc2NhbGUoKSkgLSBkYmxQYWRkaW5nO1xuICAgICAgZC5oZWlnaHQgPSAoZC5yb3dzcGFuICogc2VsZi5zY2FsZSgpKSAtIGRibFBhZGRpbmc7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gZGF0YTtcbiAgfSlcblxuICAuc3RhdGljKGZ1bmN0aW9uIGJveChkKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHgxOiBkLmNvbCxcbiAgICAgIHgyOiBkLmNvbCArIGQuY29sc3BhbiAtIDEsXG4gICAgICB5MTogZC5yb3csXG4gICAgICB5MjogZC5yb3cgKyBkLnJvd3NwYW4gLSAxXG4gICAgfTtcbiAgfSlcblxuICAuc3RhdGljKGZ1bmN0aW9uIHVuY29sbGlkZShhKSB7XG4gICAgdmFyIGJveEEgPSBncmlkLmJveChhKTtcbiAgICBcbiAgICByZXR1cm4gZnVuY3Rpb24obm9kZSwgeDEsIHkxLCB4MiwgeTIpIHtcbiAgICAgIHZhciBiID0gbm9kZS5wb2ludDtcblxuICAgICAgaWYgKGIgJiYgYSAhPT0gYiAmJiBncmlkLmludGVyc2VjdGlvbihib3hBLCBncmlkLmJveChiKSkpIHtcbiAgICAgICAgYi5yb3cgPSBib3hBLnkyICsgMTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuICFncmlkLmludGVyc2VjdGlvbihib3hBLCB7XG4gICAgICAgIHgxOiB4MSwgXG4gICAgICAgIHkxOiB5MSwgXG4gICAgICAgIHgyOiB4MixcbiAgICAgICAgeTI6IHkyXG4gICAgICB9KTtcbiAgICB9O1xuICB9KVxuXG4gIC5zdGF0aWMoZnVuY3Rpb24gaW50ZXJzZWN0aW9uKGEsIGIpIHtcbiAgICByZXR1cm4gKChhLngxIDw9IGIueDEgJiYgYi54MSA8PSBhLngyKSAmJiAoYS55MSA8PSBiLnkxICYmIGIueTEgPD0gYS55MikpXG4gICAgICAgIHx8ICgoYi54MSA8PSBhLngxICYmIGEueDEgPD0gYi54MikgJiYgKGIueTEgPD0gYS55MSAmJiBhLnkxIDw9IGIueTIpKVxuICAgICAgICB8fCAoKGEueDEgPD0gYi54MiAmJiBiLngyIDw9IGEueDIpICYmIChhLnkxIDw9IGIueTEgJiYgYi55MSA8PSBhLnkyKSlcbiAgICAgICAgfHwgKChiLngxIDw9IGEueDIgJiYgYS54MiA8PSBiLngyKSAmJiAoYi55MSA8PSBhLnkxICYmIGEueTEgPD0gYi55MikpO1xuICB9KTtcblxuXG52YXIgY291bnRlciA9IHN0cmFpbigpXG4gIC5wcm9wKCdudW1jb2xzJylcblxuICAucHJvcCgncm93c3BhbicpXG4gIC5kZWZhdWx0KDApXG5cbiAgLnByb3AoJ2NvbCcpXG4gIC5kZWZhdWx0KDApXG5cbiAgLnByb3AoJ3JvdycpXG4gIC5kZWZhdWx0KDApXG5cbiAgLm1ldGgoZnVuY3Rpb24gaW5jKGQpIHtcbiAgICB2YXIgY29sID0gZC5jb2wgKyBkLmNvbHNwYW47XG4gICAgdmFyIHJvdyA9IHRoaXMucm93KCk7XG5cbiAgICBpZiAoY29sID49IHRoaXMubnVtY29scygpKSB7XG4gICAgICBjb2wgPSAwO1xuICAgICAgcm93ICs9IHRoaXMucm93c3BhbigpO1xuICAgICAgdGhpcy5yb3dzcGFuKDApO1xuICAgIH1cblxuICAgIHRoaXNcbiAgICAgIC5jb2woY29sKVxuICAgICAgLnJvdyhyb3cpXG4gICAgICAucm93c3BhbihNYXRoLm1heCh0aGlzLnJvd3NwYW4oKSwgZC5yb3dzcGFuKSk7XG4gIH0pO1xuIiwiZXhwb3J0cy51dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcbmV4cG9ydHMudmlldyA9IHJlcXVpcmUoJy4vdmlldycpO1xuZXhwb3J0cy5ncmlkID0gcmVxdWlyZSgnLi9ncmlkJyk7XG5leHBvcnRzLndpZGdldHMgPSByZXF1aXJlKCcuL3dpZGdldHMnKTtcbmV4cG9ydHMuZGFzaGJvYXJkID0gcmVxdWlyZSgnLi9kYXNoYm9hcmQnKTtcbiIsInZhciB1dGlscyA9IGV4cG9ydHM7XG5cblxudXRpbHMuYWNjZXNzID0gZnVuY3Rpb24oZCwgbmFtZSwgZGVmYXVsdHZhbCkge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDMpIHtcbiAgICBkZWZhdWx0dmFsID0gbnVsbDtcbiAgfVxuXG4gIGlmICh0eXBlb2YgZCAhPSAnb2JqZWN0Jykge1xuICAgIHJldHVybiBkZWZhdWx0dmFsO1xuICB9XG5cbiAgdmFyIHZhbCA9IGRbbmFtZV07XG4gIHJldHVybiB0eXBlb2YgdmFsID09ICd1bmRlZmluZWQnXG4gICAgPyBkZWZhdWx0dmFsXG4gICAgOiB2YWw7XG59O1xuXG5cbnV0aWxzLmVuc3VyZSA9IGZ1bmN0aW9uKHYsIGRlZmF1bHR2YWwpIHtcbiAgcmV0dXJuIHYgPT09IG51bGwgfHwgdHlwZW9mIHYgPT0gJ3VuZGVmaW5lZCdcbiAgICA/IGRlZmF1bHR2YWxcbiAgICA6IHY7XG59O1xuXG5cbnV0aWxzLmVuc3VyZUVsID0gZnVuY3Rpb24oZWwpIHtcbiAgcmV0dXJuICEoZWwgaW5zdGFuY2VvZiBkMy5zZWxlY3Rpb24pXG4gICAgPyBkMy5zZWxlY3QoZWwpXG4gICAgOiBlbDtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHN0cmFpbigpXG4gIC5zdGF0aWMoZnVuY3Rpb24gZHJhdyhmbikge1xuICAgIHRoaXMubWV0aCgnX2RyYXdfJywgZm4pO1xuICB9KVxuICAuZHJhdyhmdW5jdGlvbigpIHt9KVxuXG4gIC5zdGF0aWMoZnVuY3Rpb24gZW50ZXIoZm4pIHtcbiAgICB0aGlzLm1ldGgoJ19lbnRlcl8nLCBmbik7XG4gIH0pXG4gIC5lbnRlcihmdW5jdGlvbigpIHt9KVxuXG4gIC5tZXRoKGZ1bmN0aW9uIGRyYXcoZWwpIHtcbiAgICBlbCA9IHNhcHBoaXJlLnV0aWxzLmVuc3VyZUVsKGVsKTtcblxuICAgIGlmIChlbC5ub2RlKCkgJiYgIWVsLm5vZGUoKS5oYXNDaGlsZE5vZGVzKCkpIHtcbiAgICAgIHRoaXMuZW50ZXIoZWwpO1xuICAgIH1cblxuICAgIHZhciBwYXJlbnQgPSB0aGlzLl90eXBlXy5fc3VwZXJfLnByb3RvdHlwZTtcbiAgICBpZiAoJ19kcmF3XycgaW4gcGFyZW50KSB7XG4gICAgICBwYXJlbnQuX2RyYXdfLmNhbGwodGhpcywgZWwpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9kcmF3XyhlbCk7XG4gIH0pXG5cbiAgLm1ldGgoZnVuY3Rpb24gZW50ZXIoZWwpIHtcbiAgICBlbCA9IHNhcHBoaXJlLnV0aWxzLmVuc3VyZUVsKGVsKTtcblxuICAgIHZhciBwYXJlbnQgPSB0aGlzLl90eXBlXy5fc3VwZXJfLnByb3RvdHlwZTtcbiAgICBpZiAoJ19lbnRlcl8nIGluIHBhcmVudCkge1xuICAgICAgcGFyZW50Ll9lbnRlcl8uY2FsbCh0aGlzLCBlbCk7XG4gICAgfVxuXG4gICAgdGhpcy5fZW50ZXJfKGVsKTtcbiAgfSlcblxuICAuaW52b2tlKGZ1bmN0aW9uKGVsKSB7XG4gICAgcmV0dXJuIHRoaXMuZHJhdyhlbCk7XG4gIH0pO1xuIiwiZXhwb3J0cy53aWRnZXQgPSByZXF1aXJlKCcuL3dpZGdldCcpO1xuZXhwb3J0cy5sYXN0dmFsdWUgPSByZXF1aXJlKCcuL2xhc3R2YWx1ZScpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL3dpZGdldCcpLmV4dGVuZCgpXG4gIC5wcm9wKCd0aXRsZScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50aXRsZTsgfSlcblxuICAucHJvcCgndmFsdWVzJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLnZhbHVlczsgfSlcblxuICAucHJvcCgneCcpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC54OyB9KVxuXG4gIC5wcm9wKCd5JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLnk7IH0pXG5cbiAgLnByb3AoJ2Zvcm1hdCcpXG4gIC5kZWZhdWx0KGQzLmZvcm1hdCgpKVxuXG4gIC5wcm9wKCdub25lJylcbiAgLmRlZmF1bHQoMClcblxuICAuZW50ZXIoZnVuY3Rpb24oZWwpIHtcbiAgICBlbC5hcHBlbmQoJ2NsYXNzJywgJ2xhc3R2YWx1ZScpXG4gICAgICAuYXBwZW5kKCdkaXYnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnbGFzdCcpO1xuICB9KVxuXG4gIC5kcmF3KGZ1bmN0aW9uKGVsKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgZWwuc2VsZWN0KCcubGFzdCcpXG4gICAgICAuZGF0dW0oZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICB2YXIgdmFsdWVzID0gc2VsZi52YWx1ZXMoKS5jYWxsKHRoaXMsIGQsIGkpO1xuICAgICAgICByZXR1cm4gdmFsdWVzW3ZhbHVlcy5sZW5ndGggLSAxXTtcbiAgICAgIH0pXG4gICAgICAudGV4dChmdW5jdGlvbihkLCBpKSB7XG4gICAgICAgIHZhciB2ID0gZFxuICAgICAgICAgID8gc2VsZi55KCkuY2FsbCh0aGlzLCBkLCBpKVxuICAgICAgICAgIDogc2VsZi5ub25lKCk7XG5cbiAgICAgICAgICByZXR1cm4gc2VsZi5mb3JtYXQoKSh2KTtcbiAgICAgIH0pO1xuICB9KTtcbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi4vdmlldycpLmV4dGVuZCgpXG4gIC5wcm9wKCdjb2xzcGFuJylcbiAgLmRlZmF1bHQoMSlcblxuICAucHJvcCgncm93c3BhbicpXG4gIC5kZWZhdWx0KDEpXG5cbiAgLnByb3AoJ3dpZHRoJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdCgyMDApXG5cbiAgLnByb3AoJ2hlaWdodCcpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoMjAwKVxuXG4gIC5kcmF3KGZ1bmN0aW9uKGVsKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgZWwuc3R5bGUoJ3dpZHRoJywgZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICByZXR1cm4gc2VsZi53aWR0aCgpLmNhbGwodGhpcywgZCwgaSkgKyAncHgnO1xuICAgICAgfSlcbiAgICAgIC5zdHlsZSgnaGVpZ2h0JywgZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICByZXR1cm4gc2VsZi5oZWlnaHQoKS5jYWxsKHRoaXMsIGQsIGkpICsgJ3B4JztcbiAgICAgIH0pO1xuICB9KTtcbiJdfQ==
(3)
});
