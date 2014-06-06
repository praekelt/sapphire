!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.sapphire=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
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

    var widgets = this.el()
      .html(null)
      .append('div')
        .datum(this.widgets())
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
        .new(this);
    });

    widget.exit().remove();
  });

},{"./view":5,"./widgets":6}],2:[function(_dereq_,module,exports){
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

},{}],6:[function(_dereq_,module,exports){
exports.lastvalue = _dereq_('./lastvalue');

},{"./lastvalue":7}],7:[function(_dereq_,module,exports){
module.exports = _dereq_('../view').extend()
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

},{"../view":5}]},{},[3])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy9kYXNoYm9hcmQuanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvZ3JpZC5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy9pbmRleC5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy91dGlscy5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy92aWV3LmpzIiwiL2hvbWUvanVzdGluL3ByYWVrZWx0L3NhcHBoaXJlL3NyYy9zY3JpcHRzL3dpZGdldHMvaW5kZXguanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvd2lkZ2V0cy9sYXN0dmFsdWUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2REE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciB3aWRnZXRzID0gcmVxdWlyZSgnLi93aWRnZXRzJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL3ZpZXcnKS5leHRlbmQoKVxuICAucHJvcCgndHlwZXMnKVxuXG4gIC5jb25mcHJvcCgndGl0bGUnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC50aXRsZShmdW5jdGlvbihkKSB7IHJldHVybiBkLnRpdGxlOyB9KVxuXG4gIC5jb25mcHJvcCgna2V5JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAua2V5KGZ1bmN0aW9uKGQsIGkpIHtcbiAgICByZXR1cm4gJ2tleScgaW4gZFxuICAgICAgPyBkLmtleVxuICAgICAgOiBpO1xuICB9KVxuXG4gIC5jb25mcHJvcCgndHlwZScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLnR5cGUoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50eXBlOyB9KVxuXG4gIC5jb25mcHJvcCgnd2lkZ2V0cycpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLndpZGdldHMoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC53aWRnZXRzOyB9KVxuXG4gIC5pbml0KGZ1bmN0aW9uKCkge1xuICAgIHZhciB0eXBlcyA9IGQzLm1hcCgpO1xuXG4gICAgZDMua2V5cyh3aWRnZXRzKS5mb3JFYWNoKGZ1bmN0aW9uKGspIHtcbiAgICAgIHR5cGVzLnNldChrLCB3aWRnZXRzW2tdLmV4dGVuZCgpKTtcbiAgICB9KTtcblxuICAgIHRoaXMudHlwZXModHlwZXMpO1xuICB9KVxuXG4gIC5kcmF3KGZ1bmN0aW9uKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIHZhciB3aWRnZXRzID0gdGhpcy5lbCgpXG4gICAgICAuaHRtbChudWxsKVxuICAgICAgLmFwcGVuZCgnZGl2JylcbiAgICAgICAgLmRhdHVtKHRoaXMud2lkZ2V0cygpKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnd2lkZ2V0cycpO1xuXG4gICAgdmFyIHdpZGdldCA9IHdpZGdldHMuc2VsZWN0QWxsKCcud2lkZ2V0JylcbiAgICAgIC5kYXRhKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQ7IH0sIHRoaXMua2V5KCkpO1xuXG4gICAgd2lkZ2V0LmVudGVyKCkuYXBwZW5kKCdkaXYnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3dpZGdldCcpXG4gICAgICAuYXR0cignZGF0YS1rZXknLCB0aGlzLmtleSgpKTtcblxuICAgIHdpZGdldC5lYWNoKGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgIHZhciB0eXBlID0gc2VsZi50eXBlKCkuY2FsbCh0aGlzLCBkLCBpKTtcblxuICAgICAgaWYgKCFzZWxmLnR5cGVzKCkuaGFzKHR5cGUpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVucmVjb2duaXNlZCBkYXNoYm9hcmQgd2lkZ2V0IHR5cGUgJ1wiICsgdHlwZSArIFwiJ1wiKTtcbiAgICAgIH1cblxuICAgICAgc2VsZi50eXBlcygpXG4gICAgICAgIC5nZXQodHlwZSlcbiAgICAgICAgLm5ldyh0aGlzKTtcbiAgICB9KTtcblxuICAgIHdpZGdldC5leGl0KCkucmVtb3ZlKCk7XG4gIH0pO1xuIiwidmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xuXG5cbnZhciBncmlkID0gbW9kdWxlLmV4cG9ydHMgPSBzdHJhaW4oKVxuICAucHJvcCgnY29sJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7XG4gICAgcmV0dXJuIHV0aWxzLmFjY2VzcyhkLCAnY29sJyk7XG4gIH0pXG5cbiAgLnByb3AoJ3JvdycpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkge1xuICAgIHJldHVybiB1dGlscy5hY2Nlc3MoZCwgJ3JvdycpO1xuICB9KVxuXG4gIC5wcm9wKCdudW1jb2xzJylcbiAgLmRlZmF1bHQoOClcblxuICAucHJvcCgnc2NhbGUnKVxuICAuZGVmYXVsdCgxMClcblxuICAucHJvcCgncGFkZGluZycpXG4gIC5kZWZhdWx0KDUpXG5cbiAgLnByb3AoJ2NvbHNwYW4nKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHtcbiAgICByZXR1cm4gdXRpbHMuYWNjZXNzKGQsICdjb2xzcGFuJywgMSk7XG4gIH0pXG5cbiAgLnByb3AoJ3Jvd3NwYW4nKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHtcbiAgICByZXR1cm4gdXRpbHMuYWNjZXNzKGQsICdyb3dzcGFuJywgMSk7XG4gIH0pXG5cbiAgLmludm9rZShmdW5jdGlvbihkYXRhKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBiZXN0ID0gY291bnRlcigpLm51bWNvbHModGhpcy5udW1jb2xzKCkpO1xuXG4gICAgZGF0YSA9IChkYXRhIHx8IFtdKS5tYXAoZnVuY3Rpb24oZCwgaSkge1xuICAgICAgZCA9IHtcbiAgICAgICAgZGF0YTogZCxcbiAgICAgICAgY29sOiB1dGlscy5lbnN1cmUoc2VsZi5jb2woKS5jYWxsKHNlbGYsIGQsIGkpLCBiZXN0LmNvbCgpKSwgXG4gICAgICAgIHJvdzogdXRpbHMuZW5zdXJlKHNlbGYucm93KCkuY2FsbChzZWxmLCBkLCBpKSwgYmVzdC5yb3coKSksXG4gICAgICAgIHJvd3NwYW46IHNlbGYucm93c3BhbigpLmNhbGwoc2VsZiwgZCwgaSksXG4gICAgICAgIGNvbHNwYW46IHNlbGYuY29sc3BhbigpLmNhbGwoc2VsZiwgZCwgaSlcbiAgICAgIH07XG5cbiAgICAgIGJlc3QuaW5jKGQpO1xuICAgICAgcmV0dXJuIGQ7XG4gICAgfSk7XG5cbiAgICB2YXIgcXVhZHRyZWUgPSBkMy5nZW9tLnF1YWR0cmVlKClcbiAgICAgIC54KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuY29sOyB9KVxuICAgICAgLnkoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5yb3c7IH0pO1xuXG4gICAgdmFyIHJvb3QgPSBxdWFkdHJlZShkYXRhKTtcbiAgICB2YXIgZGJsUGFkZGluZyA9IHRoaXMucGFkZGluZygpICogMjtcblxuICAgIGRhdGEuZm9yRWFjaChmdW5jdGlvbihkKSB7XG4gICAgICByb290LnZpc2l0KGdyaWQudW5jb2xsaWRlKGQpKTtcbiAgICAgIGQueCA9IChkLmNvbCAqIHNlbGYuc2NhbGUoKSkgKyBzZWxmLnBhZGRpbmcoKTtcbiAgICAgIGQueSA9IChkLnJvdyAqIHNlbGYuc2NhbGUoKSkgKyBzZWxmLnBhZGRpbmcoKTtcbiAgICAgIGQud2lkdGggPSAoZC5jb2xzcGFuICogc2VsZi5zY2FsZSgpKSAtIGRibFBhZGRpbmc7XG4gICAgICBkLmhlaWdodCA9IChkLnJvd3NwYW4gKiBzZWxmLnNjYWxlKCkpIC0gZGJsUGFkZGluZztcbiAgICB9KTtcblxuICAgIHJldHVybiBkYXRhO1xuICB9KVxuXG4gIC5zdGF0aWMoZnVuY3Rpb24gYm94KGQpIHtcbiAgICByZXR1cm4ge1xuICAgICAgeDE6IGQuY29sLFxuICAgICAgeDI6IGQuY29sICsgZC5jb2xzcGFuIC0gMSxcbiAgICAgIHkxOiBkLnJvdyxcbiAgICAgIHkyOiBkLnJvdyArIGQucm93c3BhbiAtIDFcbiAgICB9O1xuICB9KVxuXG4gIC5zdGF0aWMoZnVuY3Rpb24gdW5jb2xsaWRlKGEpIHtcbiAgICB2YXIgYm94QSA9IGdyaWQuYm94KGEpO1xuICAgIFxuICAgIHJldHVybiBmdW5jdGlvbihub2RlLCB4MSwgeTEsIHgyLCB5Mikge1xuICAgICAgdmFyIGIgPSBub2RlLnBvaW50O1xuXG4gICAgICBpZiAoYiAmJiBhICE9PSBiICYmIGdyaWQuaW50ZXJzZWN0aW9uKGJveEEsIGdyaWQuYm94KGIpKSkge1xuICAgICAgICBiLnJvdyA9IGJveEEueTIgKyAxO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gIWdyaWQuaW50ZXJzZWN0aW9uKGJveEEsIHtcbiAgICAgICAgeDE6IHgxLCBcbiAgICAgICAgeTE6IHkxLCBcbiAgICAgICAgeDI6IHgyLFxuICAgICAgICB5MjogeTJcbiAgICAgIH0pO1xuICAgIH07XG4gIH0pXG5cbiAgLnN0YXRpYyhmdW5jdGlvbiBpbnRlcnNlY3Rpb24oYSwgYikge1xuICAgIHJldHVybiAoKGEueDEgPD0gYi54MSAmJiBiLngxIDw9IGEueDIpICYmIChhLnkxIDw9IGIueTEgJiYgYi55MSA8PSBhLnkyKSlcbiAgICAgICAgfHwgKChiLngxIDw9IGEueDEgJiYgYS54MSA8PSBiLngyKSAmJiAoYi55MSA8PSBhLnkxICYmIGEueTEgPD0gYi55MikpXG4gICAgICAgIHx8ICgoYS54MSA8PSBiLngyICYmIGIueDIgPD0gYS54MikgJiYgKGEueTEgPD0gYi55MSAmJiBiLnkxIDw9IGEueTIpKVxuICAgICAgICB8fCAoKGIueDEgPD0gYS54MiAmJiBhLngyIDw9IGIueDIpICYmIChiLnkxIDw9IGEueTEgJiYgYS55MSA8PSBiLnkyKSk7XG4gIH0pO1xuXG5cbnZhciBjb3VudGVyID0gc3RyYWluKClcbiAgLnByb3AoJ251bWNvbHMnKVxuXG4gIC5wcm9wKCdyb3dzcGFuJylcbiAgLmRlZmF1bHQoMClcblxuICAucHJvcCgnY29sJylcbiAgLmRlZmF1bHQoMClcblxuICAucHJvcCgncm93JylcbiAgLmRlZmF1bHQoMClcblxuICAubWV0aChmdW5jdGlvbiBpbmMoZCkge1xuICAgIHZhciBjb2wgPSBkLmNvbCArIGQuY29sc3BhbjtcbiAgICB2YXIgcm93ID0gdGhpcy5yb3coKTtcblxuICAgIGlmIChjb2wgPj0gdGhpcy5udW1jb2xzKCkpIHtcbiAgICAgIGNvbCA9IDA7XG4gICAgICByb3cgKz0gdGhpcy5yb3dzcGFuKCk7XG4gICAgICB0aGlzLnJvd3NwYW4oMCk7XG4gICAgfVxuXG4gICAgdGhpc1xuICAgICAgLmNvbChjb2wpXG4gICAgICAucm93KHJvdylcbiAgICAgIC5yb3dzcGFuKE1hdGgubWF4KHRoaXMucm93c3BhbigpLCBkLnJvd3NwYW4pKTtcbiAgfSk7XG4iLCJleHBvcnRzLnV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xuZXhwb3J0cy52aWV3ID0gcmVxdWlyZSgnLi92aWV3Jyk7XG5leHBvcnRzLmdyaWQgPSByZXF1aXJlKCcuL2dyaWQnKTtcbmV4cG9ydHMud2lkZ2V0cyA9IHJlcXVpcmUoJy4vd2lkZ2V0cycpO1xuZXhwb3J0cy5kYXNoYm9hcmQgPSByZXF1aXJlKCcuL2Rhc2hib2FyZCcpO1xuIiwidmFyIHV0aWxzID0gZXhwb3J0cztcblxuXG51dGlscy5hY2Nlc3MgPSBmdW5jdGlvbihkLCBuYW1lLCBkZWZhdWx0dmFsKSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoIDwgMykge1xuICAgIGRlZmF1bHR2YWwgPSBudWxsO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBkICE9ICdvYmplY3QnKSB7XG4gICAgcmV0dXJuIGRlZmF1bHR2YWw7XG4gIH1cblxuICB2YXIgdmFsID0gZFtuYW1lXTtcbiAgcmV0dXJuIHR5cGVvZiB2YWwgPT0gJ3VuZGVmaW5lZCdcbiAgICA/IGRlZmF1bHR2YWxcbiAgICA6IHZhbDtcbn07XG5cblxudXRpbHMuZW5zdXJlID0gZnVuY3Rpb24odiwgZGVmYXVsdHZhbCkge1xuICByZXR1cm4gdiA9PT0gbnVsbCB8fCB0eXBlb2YgdiA9PSAndW5kZWZpbmVkJ1xuICAgID8gZGVmYXVsdHZhbFxuICAgIDogdjtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHN0cmFpbigpXG4gIC5zdGF0aWMoJ2luaXQnLCBmdW5jdGlvbihmbikge1xuICAgIHN0cmFpbi5pbml0LmNhbGwodGhpcywgZnVuY3Rpb24oZWwpIHtcbiAgICAgIGlmIChlbCkge1xuICAgICAgICB0aGlzLmVsKGVsKTtcbiAgICAgIH1cblxuICAgICAgZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgICAgaWYgKGVsICYmIHRoaXMuZWwoKS5kYXR1bSgpKSB7XG4gICAgICAgIHRoaXMuZHJhdygpO1xuICAgICAgfVxuICAgIH0pO1xuICB9KVxuXG4gIC5zdGF0aWMoJ2NvbmZwcm9wJywgZnVuY3Rpb24obmFtZSkge1xuICAgIHRoaXMucHJvcChuYW1lKTtcblxuICAgIHRoaXMuc3RhdGljKG5hbWUsIGZ1bmN0aW9uKHYpIHtcbiAgICAgIHRoaXMucHJvcChuYW1lKS5kZWZhdWx0KHYpO1xuICAgIH0pO1xuICB9KVxuXG4gIC5zdGF0aWMoJ2RyYXcnLCBmdW5jdGlvbihmbikge1xuICAgIHRoaXMubWV0aCgnX2RyYXdfJywgZm4pO1xuICB9KVxuXG4gIC5tZXRoKCdfZHJhd18nLCBmdW5jdGlvbigpIHt9KVxuXG4gIC5tZXRoKCdkcmF3JywgZnVuY3Rpb24oZGF0dW0pIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgdGhpcy5lbCgpLmRhdHVtKGRhdHVtKTtcbiAgICB9XG5cbiAgICB2YXIgcGFyZW50ID0gdGhpcy5fdHlwZV8uX3N1cGVyXy5wcm90b3R5cGU7XG4gICAgaWYgKCdfZHJhd18nIGluIHBhcmVudCkge1xuICAgICAgcGFyZW50Ll9kcmF3Xy5jYWxsKHRoaXMpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9kcmF3XygpO1xuICB9KVxuXG4gIC5wcm9wKCdlbCcpXG4gIC5zZXQoZnVuY3Rpb24odikge1xuICAgIHJldHVybiAhKHYgaW5zdGFuY2VvZiBkMy5zZWxlY3Rpb24pXG4gICAgICA/IGQzLnNlbGVjdCh2KVxuICAgICAgOiB2O1xuICB9KVxuXG4gIC5pbml0KGZ1bmN0aW9uKCkge30pXG4gIC5kcmF3KGZ1bmN0aW9uKCkge30pXG5cbiAgLmludm9rZShmdW5jdGlvbihkYXR1bSkge1xuICAgIHJldHVybiB0aGlzLmRyYXcoZGF0dW0pO1xuICB9KTtcbiIsImV4cG9ydHMubGFzdHZhbHVlID0gcmVxdWlyZSgnLi9sYXN0dmFsdWUnKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi4vdmlldycpLmV4dGVuZCgpXG4gIC5jb25mcHJvcCgndGl0bGUnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC50aXRsZShmdW5jdGlvbihkKSB7IHJldHVybiBkLnRpdGxlOyB9KVxuXG4gIC5jb25mcHJvcCgndmFsdWVzJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAudmFsdWVzKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudmFsdWVzOyB9KVxuXG4gIC5jb25mcHJvcCgneCcpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLngoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC54OyB9KVxuXG4gIC5jb25mcHJvcCgneScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLnkoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC55OyB9KVxuXG4gIC5jb25mcHJvcCgnZm9ybWF0JylcbiAgLmZvcm1hdChkMy5mb3JtYXQoKSlcblxuICAuY29uZnByb3AoJ25vbmUnKVxuICAubm9uZSgwKVxuXG4gIC5kcmF3KGZ1bmN0aW9uKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIHRoaXMuZWwoKVxuICAgICAgLmh0bWwobnVsbClcbiAgICAgIC5hcHBlbmQoJ2RpdicpXG4gICAgICAgIC5kYXR1bSh0aGlzLnZhbHVlcygpKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAndmFsdWVzJylcbiAgICAgICAgLmFwcGVuZCgndGV4dCcpXG4gICAgICAgICAgLmRhdHVtKGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgICAgICAgIHJldHVybiBkW2QubGVuZ3RoIC0gMV07XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuYXR0cignY2xhc3MnLCAnbGFzdCcpXG4gICAgICAgICAgLnRleHQoZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICAgICAgdmFyIHYgPSBkXG4gICAgICAgICAgICAgID8gc2VsZi55KCkuY2FsbCh0aGlzLCBkLCBpKVxuICAgICAgICAgICAgICA6IHNlbGYubm9uZSgpO1xuXG4gICAgICAgICAgICAgIHJldHVybiBzZWxmLmZvcm1hdCgpKHYpO1xuICAgICAgICAgIH0pO1xuICB9KTtcbiJdfQ==
(3)
});
