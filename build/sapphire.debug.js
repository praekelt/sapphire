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

},{"./view":4,"./widgets":5}],2:[function(_dereq_,module,exports){
module.exports = strain()
  .prop('col')
  .set(d3.functor)
  .default(function(d) {
    return access(d, 'col');
  })

  .prop('row')
  .set(d3.functor)
  .default(function(d) {
    return access(d, 'row');
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
    return access(d, 'colspan', 1);
  })

  .prop('rowspan')
  .set(d3.functor)
  .default(function(d) {
    return access(d, 'rowspan', 1);
  })

  .invoke(function(data) {
    var self = this;
    var best = counter().numcols(this.numcols());

    data = (data || []).map(function(d, i) {
      d = {
        data: d,
        col: ensure(self.col().call(self, d, i), best.col()), 
        row: ensure(self.row().call(self, d, i), best.row()),
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

    data.forEach(function(d) {
      root.visit(uncollide(d));
      d.x = d.col * self.scale();
      d.y = d.row * self.scale();
      d.width = (d.colspan * self.scale()) - self.padding();
      d.height = (d.rowspan * self.scale()) - self.padding();
    });

    return data;
  });


var counter = strain()
  .prop('numcols')

  .prop('rowspan')
  .default(0)

  .prop('col')
  .default(0)

  .prop('row')
  .default(0)

  .meth('inc', function(d) {
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


function box(d) {
  return {
    x1: d.col,
    x2: d.col + d.colspan - 1,
    y1: d.row,
    y2: d.row + d.rowspan - 1
  };
}


function uncollide(a) {
  var boxA = box(a);
  
  return function(node, x1, y1, x2, y2) {
    var b = node.point;

    if (b && a !== b && intersection(boxA, box(b))) {
      b.row = boxA.y2 + 1;
    }

    return !intersection(boxA, {
      x1: x1, 
      y1: y1, 
      x2: x2,
      y2: y2
    });
  };
}


function intersection(a, b) {
  return ((a.x1 <= b.x1 && b.x1 <= a.x2) && (a.y1 <= b.y1 && b.y1 <= a.y2))
      || ((b.x1 <= a.x1 && a.x1 <= b.x2) && (b.y1 <= a.y1 && a.y1 <= b.y2));
}


function access(d, name, defaultval) {
  if (arguments.length < 3) {
    defaultval = null;
  }

  return typeof d == 'object' && name in d
    ? d[name]
    : defaultval;
}


function ensure(v, defaultval) {
  return v === null
    ? defaultval
    : v;
}

},{}],3:[function(_dereq_,module,exports){
exports.view = _dereq_('./view');
exports.grid = _dereq_('./grid');
exports.widgets = _dereq_('./widgets');
exports.dashboard = _dereq_('./dashboard');

},{"./dashboard":1,"./grid":2,"./view":4,"./widgets":5}],4:[function(_dereq_,module,exports){
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
    this.meth('draw', function(datum) {
      if (arguments.length) {
        this.el().datum(datum);
      }

      return fn.call(this);
    });
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

},{}],5:[function(_dereq_,module,exports){
exports.lastvalue = _dereq_('./lastvalue');

},{"./lastvalue":6}],6:[function(_dereq_,module,exports){
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

},{"../view":4}]},{},[3])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy9kYXNoYm9hcmQuanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvZ3JpZC5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy9pbmRleC5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy92aWV3LmpzIiwiL2hvbWUvanVzdGluL3ByYWVrZWx0L3NhcHBoaXJlL3NyYy9zY3JpcHRzL3dpZGdldHMvaW5kZXguanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvd2lkZ2V0cy9sYXN0dmFsdWUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciB3aWRnZXRzID0gcmVxdWlyZSgnLi93aWRnZXRzJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL3ZpZXcnKS5leHRlbmQoKVxuICAucHJvcCgndHlwZXMnKVxuXG4gIC5jb25mcHJvcCgndGl0bGUnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC50aXRsZShmdW5jdGlvbihkKSB7IHJldHVybiBkLnRpdGxlOyB9KVxuXG4gIC5jb25mcHJvcCgna2V5JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAua2V5KGZ1bmN0aW9uKGQsIGkpIHtcbiAgICByZXR1cm4gJ2tleScgaW4gZFxuICAgICAgPyBkLmtleVxuICAgICAgOiBpO1xuICB9KVxuXG4gIC5jb25mcHJvcCgndHlwZScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLnR5cGUoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50eXBlOyB9KVxuXG4gIC5jb25mcHJvcCgnd2lkZ2V0cycpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLndpZGdldHMoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC53aWRnZXRzOyB9KVxuXG4gIC5pbml0KGZ1bmN0aW9uKCkge1xuICAgIHZhciB0eXBlcyA9IGQzLm1hcCgpO1xuXG4gICAgZDMua2V5cyh3aWRnZXRzKS5mb3JFYWNoKGZ1bmN0aW9uKGspIHtcbiAgICAgIHR5cGVzLnNldChrLCB3aWRnZXRzW2tdLmV4dGVuZCgpKTtcbiAgICB9KTtcblxuICAgIHRoaXMudHlwZXModHlwZXMpO1xuICB9KVxuXG4gIC5kcmF3KGZ1bmN0aW9uKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIHZhciB3aWRnZXRzID0gdGhpcy5lbCgpXG4gICAgICAuaHRtbChudWxsKVxuICAgICAgLmFwcGVuZCgnZGl2JylcbiAgICAgICAgLmRhdHVtKHRoaXMud2lkZ2V0cygpKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnd2lkZ2V0cycpO1xuXG4gICAgdmFyIHdpZGdldCA9IHdpZGdldHMuc2VsZWN0QWxsKCcud2lkZ2V0JylcbiAgICAgIC5kYXRhKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQ7IH0sIHRoaXMua2V5KCkpO1xuXG4gICAgd2lkZ2V0LmVudGVyKCkuYXBwZW5kKCdkaXYnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3dpZGdldCcpXG4gICAgICAuYXR0cignZGF0YS1rZXknLCB0aGlzLmtleSgpKTtcblxuICAgIHdpZGdldC5lYWNoKGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgIHZhciB0eXBlID0gc2VsZi50eXBlKCkuY2FsbCh0aGlzLCBkLCBpKTtcblxuICAgICAgaWYgKCFzZWxmLnR5cGVzKCkuaGFzKHR5cGUpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVucmVjb2duaXNlZCBkYXNoYm9hcmQgd2lkZ2V0IHR5cGUgJ1wiICsgdHlwZSArIFwiJ1wiKTtcbiAgICAgIH1cblxuICAgICAgc2VsZi50eXBlcygpXG4gICAgICAgIC5nZXQodHlwZSlcbiAgICAgICAgLm5ldyh0aGlzKTtcbiAgICB9KTtcblxuICAgIHdpZGdldC5leGl0KCkucmVtb3ZlKCk7XG4gIH0pO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBzdHJhaW4oKVxuICAucHJvcCgnY29sJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7XG4gICAgcmV0dXJuIGFjY2VzcyhkLCAnY29sJyk7XG4gIH0pXG5cbiAgLnByb3AoJ3JvdycpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkge1xuICAgIHJldHVybiBhY2Nlc3MoZCwgJ3JvdycpO1xuICB9KVxuXG4gIC5wcm9wKCdudW1jb2xzJylcbiAgLmRlZmF1bHQoOClcblxuICAucHJvcCgnc2NhbGUnKVxuICAuZGVmYXVsdCgxMClcblxuICAucHJvcCgncGFkZGluZycpXG4gIC5kZWZhdWx0KDUpXG5cbiAgLnByb3AoJ2NvbHNwYW4nKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHtcbiAgICByZXR1cm4gYWNjZXNzKGQsICdjb2xzcGFuJywgMSk7XG4gIH0pXG5cbiAgLnByb3AoJ3Jvd3NwYW4nKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHtcbiAgICByZXR1cm4gYWNjZXNzKGQsICdyb3dzcGFuJywgMSk7XG4gIH0pXG5cbiAgLmludm9rZShmdW5jdGlvbihkYXRhKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBiZXN0ID0gY291bnRlcigpLm51bWNvbHModGhpcy5udW1jb2xzKCkpO1xuXG4gICAgZGF0YSA9IChkYXRhIHx8IFtdKS5tYXAoZnVuY3Rpb24oZCwgaSkge1xuICAgICAgZCA9IHtcbiAgICAgICAgZGF0YTogZCxcbiAgICAgICAgY29sOiBlbnN1cmUoc2VsZi5jb2woKS5jYWxsKHNlbGYsIGQsIGkpLCBiZXN0LmNvbCgpKSwgXG4gICAgICAgIHJvdzogZW5zdXJlKHNlbGYucm93KCkuY2FsbChzZWxmLCBkLCBpKSwgYmVzdC5yb3coKSksXG4gICAgICAgIHJvd3NwYW46IHNlbGYucm93c3BhbigpLmNhbGwoc2VsZiwgZCwgaSksXG4gICAgICAgIGNvbHNwYW46IHNlbGYuY29sc3BhbigpLmNhbGwoc2VsZiwgZCwgaSlcbiAgICAgIH07XG5cbiAgICAgIGJlc3QuaW5jKGQpO1xuICAgICAgcmV0dXJuIGQ7XG4gICAgfSk7XG5cbiAgICB2YXIgcXVhZHRyZWUgPSBkMy5nZW9tLnF1YWR0cmVlKClcbiAgICAgIC54KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuY29sOyB9KVxuICAgICAgLnkoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5yb3c7IH0pO1xuXG4gICAgdmFyIHJvb3QgPSBxdWFkdHJlZShkYXRhKTtcblxuICAgIGRhdGEuZm9yRWFjaChmdW5jdGlvbihkKSB7XG4gICAgICByb290LnZpc2l0KHVuY29sbGlkZShkKSk7XG4gICAgICBkLnggPSBkLmNvbCAqIHNlbGYuc2NhbGUoKTtcbiAgICAgIGQueSA9IGQucm93ICogc2VsZi5zY2FsZSgpO1xuICAgICAgZC53aWR0aCA9IChkLmNvbHNwYW4gKiBzZWxmLnNjYWxlKCkpIC0gc2VsZi5wYWRkaW5nKCk7XG4gICAgICBkLmhlaWdodCA9IChkLnJvd3NwYW4gKiBzZWxmLnNjYWxlKCkpIC0gc2VsZi5wYWRkaW5nKCk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gZGF0YTtcbiAgfSk7XG5cblxudmFyIGNvdW50ZXIgPSBzdHJhaW4oKVxuICAucHJvcCgnbnVtY29scycpXG5cbiAgLnByb3AoJ3Jvd3NwYW4nKVxuICAuZGVmYXVsdCgwKVxuXG4gIC5wcm9wKCdjb2wnKVxuICAuZGVmYXVsdCgwKVxuXG4gIC5wcm9wKCdyb3cnKVxuICAuZGVmYXVsdCgwKVxuXG4gIC5tZXRoKCdpbmMnLCBmdW5jdGlvbihkKSB7XG4gICAgdmFyIGNvbCA9IGQuY29sICsgZC5jb2xzcGFuO1xuICAgIHZhciByb3cgPSB0aGlzLnJvdygpO1xuXG4gICAgaWYgKGNvbCA+PSB0aGlzLm51bWNvbHMoKSkge1xuICAgICAgY29sID0gMDtcbiAgICAgIHJvdyArPSB0aGlzLnJvd3NwYW4oKTtcbiAgICAgIHRoaXMucm93c3BhbigwKTtcbiAgICB9XG5cbiAgICB0aGlzXG4gICAgICAuY29sKGNvbClcbiAgICAgIC5yb3cocm93KVxuICAgICAgLnJvd3NwYW4oTWF0aC5tYXgodGhpcy5yb3dzcGFuKCksIGQucm93c3BhbikpO1xuICB9KTtcblxuXG5mdW5jdGlvbiBib3goZCkge1xuICByZXR1cm4ge1xuICAgIHgxOiBkLmNvbCxcbiAgICB4MjogZC5jb2wgKyBkLmNvbHNwYW4gLSAxLFxuICAgIHkxOiBkLnJvdyxcbiAgICB5MjogZC5yb3cgKyBkLnJvd3NwYW4gLSAxXG4gIH07XG59XG5cblxuZnVuY3Rpb24gdW5jb2xsaWRlKGEpIHtcbiAgdmFyIGJveEEgPSBib3goYSk7XG4gIFxuICByZXR1cm4gZnVuY3Rpb24obm9kZSwgeDEsIHkxLCB4MiwgeTIpIHtcbiAgICB2YXIgYiA9IG5vZGUucG9pbnQ7XG5cbiAgICBpZiAoYiAmJiBhICE9PSBiICYmIGludGVyc2VjdGlvbihib3hBLCBib3goYikpKSB7XG4gICAgICBiLnJvdyA9IGJveEEueTIgKyAxO1xuICAgIH1cblxuICAgIHJldHVybiAhaW50ZXJzZWN0aW9uKGJveEEsIHtcbiAgICAgIHgxOiB4MSwgXG4gICAgICB5MTogeTEsIFxuICAgICAgeDI6IHgyLFxuICAgICAgeTI6IHkyXG4gICAgfSk7XG4gIH07XG59XG5cblxuZnVuY3Rpb24gaW50ZXJzZWN0aW9uKGEsIGIpIHtcbiAgcmV0dXJuICgoYS54MSA8PSBiLngxICYmIGIueDEgPD0gYS54MikgJiYgKGEueTEgPD0gYi55MSAmJiBiLnkxIDw9IGEueTIpKVxuICAgICAgfHwgKChiLngxIDw9IGEueDEgJiYgYS54MSA8PSBiLngyKSAmJiAoYi55MSA8PSBhLnkxICYmIGEueTEgPD0gYi55MikpO1xufVxuXG5cbmZ1bmN0aW9uIGFjY2VzcyhkLCBuYW1lLCBkZWZhdWx0dmFsKSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoIDwgMykge1xuICAgIGRlZmF1bHR2YWwgPSBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHR5cGVvZiBkID09ICdvYmplY3QnICYmIG5hbWUgaW4gZFxuICAgID8gZFtuYW1lXVxuICAgIDogZGVmYXVsdHZhbDtcbn1cblxuXG5mdW5jdGlvbiBlbnN1cmUodiwgZGVmYXVsdHZhbCkge1xuICByZXR1cm4gdiA9PT0gbnVsbFxuICAgID8gZGVmYXVsdHZhbFxuICAgIDogdjtcbn1cbiIsImV4cG9ydHMudmlldyA9IHJlcXVpcmUoJy4vdmlldycpO1xuZXhwb3J0cy5ncmlkID0gcmVxdWlyZSgnLi9ncmlkJyk7XG5leHBvcnRzLndpZGdldHMgPSByZXF1aXJlKCcuL3dpZGdldHMnKTtcbmV4cG9ydHMuZGFzaGJvYXJkID0gcmVxdWlyZSgnLi9kYXNoYm9hcmQnKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gc3RyYWluKClcbiAgLnN0YXRpYygnaW5pdCcsIGZ1bmN0aW9uKGZuKSB7XG4gICAgc3RyYWluLmluaXQuY2FsbCh0aGlzLCBmdW5jdGlvbihlbCkge1xuICAgICAgaWYgKGVsKSB7XG4gICAgICAgIHRoaXMuZWwoZWwpO1xuICAgICAgfVxuXG4gICAgICBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgICBpZiAoZWwgJiYgdGhpcy5lbCgpLmRhdHVtKCkpIHtcbiAgICAgICAgdGhpcy5kcmF3KCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0pXG5cbiAgLnN0YXRpYygnY29uZnByb3AnLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgdGhpcy5wcm9wKG5hbWUpO1xuXG4gICAgdGhpcy5zdGF0aWMobmFtZSwgZnVuY3Rpb24odikge1xuICAgICAgdGhpcy5wcm9wKG5hbWUpLmRlZmF1bHQodik7XG4gICAgfSk7XG4gIH0pXG5cbiAgLnN0YXRpYygnZHJhdycsIGZ1bmN0aW9uKGZuKSB7XG4gICAgdGhpcy5tZXRoKCdkcmF3JywgZnVuY3Rpb24oZGF0dW0pIHtcbiAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgIHRoaXMuZWwoKS5kYXR1bShkYXR1bSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmbi5jYWxsKHRoaXMpO1xuICAgIH0pO1xuICB9KVxuXG4gIC5wcm9wKCdlbCcpXG4gIC5zZXQoZnVuY3Rpb24odikge1xuICAgIHJldHVybiAhKHYgaW5zdGFuY2VvZiBkMy5zZWxlY3Rpb24pXG4gICAgICA/IGQzLnNlbGVjdCh2KVxuICAgICAgOiB2O1xuICB9KVxuXG4gIC5pbml0KGZ1bmN0aW9uKCkge30pXG4gIC5kcmF3KGZ1bmN0aW9uKCkge30pXG5cbiAgLmludm9rZShmdW5jdGlvbihkYXR1bSkge1xuICAgIHJldHVybiB0aGlzLmRyYXcoZGF0dW0pO1xuICB9KTtcbiIsImV4cG9ydHMubGFzdHZhbHVlID0gcmVxdWlyZSgnLi9sYXN0dmFsdWUnKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi4vdmlldycpLmV4dGVuZCgpXG4gIC5jb25mcHJvcCgndGl0bGUnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC50aXRsZShmdW5jdGlvbihkKSB7IHJldHVybiBkLnRpdGxlOyB9KVxuXG4gIC5jb25mcHJvcCgndmFsdWVzJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAudmFsdWVzKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudmFsdWVzOyB9KVxuXG4gIC5jb25mcHJvcCgneCcpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLngoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC54OyB9KVxuXG4gIC5jb25mcHJvcCgneScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLnkoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC55OyB9KVxuXG4gIC5jb25mcHJvcCgnZm9ybWF0JylcbiAgLmZvcm1hdChkMy5mb3JtYXQoKSlcblxuICAuY29uZnByb3AoJ25vbmUnKVxuICAubm9uZSgwKVxuXG4gIC5kcmF3KGZ1bmN0aW9uKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIHRoaXMuZWwoKVxuICAgICAgLmh0bWwobnVsbClcbiAgICAgIC5hcHBlbmQoJ2RpdicpXG4gICAgICAgIC5kYXR1bSh0aGlzLnZhbHVlcygpKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAndmFsdWVzJylcbiAgICAgICAgLmFwcGVuZCgndGV4dCcpXG4gICAgICAgICAgLmRhdHVtKGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgICAgICAgIHJldHVybiBkW2QubGVuZ3RoIC0gMV07XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuYXR0cignY2xhc3MnLCAnbGFzdCcpXG4gICAgICAgICAgLnRleHQoZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICAgICAgdmFyIHYgPSBkXG4gICAgICAgICAgICAgID8gc2VsZi55KCkuY2FsbCh0aGlzLCBkLCBpKVxuICAgICAgICAgICAgICA6IHNlbGYubm9uZSgpO1xuXG4gICAgICAgICAgICAgIHJldHVybiBzZWxmLmZvcm1hdCgpKHYpO1xuICAgICAgICAgIH0pO1xuICB9KTtcbiJdfQ==
(3)
});
