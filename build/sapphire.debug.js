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


module.exports = strain()
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
    var halfPadding = this.padding() / 2;

    data.forEach(function(d) {
      root.visit(uncollide(d));
      d.x = (d.col * self.scale()) + halfPadding;
      d.y = (d.row * self.scale()) + halfPadding;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy9kYXNoYm9hcmQuanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvZ3JpZC5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy9pbmRleC5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy91dGlscy5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy92aWV3LmpzIiwiL2hvbWUvanVzdGluL3ByYWVrZWx0L3NhcHBoaXJlL3NyYy9zY3JpcHRzL3dpZGdldHMvaW5kZXguanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvd2lkZ2V0cy9sYXN0dmFsdWUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlDQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIHdpZGdldHMgPSByZXF1aXJlKCcuL3dpZGdldHMnKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vdmlldycpLmV4dGVuZCgpXG4gIC5wcm9wKCd0eXBlcycpXG5cbiAgLmNvbmZwcm9wKCd0aXRsZScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLnRpdGxlKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGl0bGU7IH0pXG5cbiAgLmNvbmZwcm9wKCdrZXknKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5rZXkoZnVuY3Rpb24oZCwgaSkge1xuICAgIHJldHVybiAna2V5JyBpbiBkXG4gICAgICA/IGQua2V5XG4gICAgICA6IGk7XG4gIH0pXG5cbiAgLmNvbmZwcm9wKCd0eXBlJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAudHlwZShmdW5jdGlvbihkKSB7IHJldHVybiBkLnR5cGU7IH0pXG5cbiAgLmNvbmZwcm9wKCd3aWRnZXRzJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAud2lkZ2V0cyhmdW5jdGlvbihkKSB7IHJldHVybiBkLndpZGdldHM7IH0pXG5cbiAgLmluaXQoZnVuY3Rpb24oKSB7XG4gICAgdmFyIHR5cGVzID0gZDMubWFwKCk7XG5cbiAgICBkMy5rZXlzKHdpZGdldHMpLmZvckVhY2goZnVuY3Rpb24oaykge1xuICAgICAgdHlwZXMuc2V0KGssIHdpZGdldHNba10uZXh0ZW5kKCkpO1xuICAgIH0pO1xuXG4gICAgdGhpcy50eXBlcyh0eXBlcyk7XG4gIH0pXG5cbiAgLmRyYXcoZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgdmFyIHdpZGdldHMgPSB0aGlzLmVsKClcbiAgICAgIC5odG1sKG51bGwpXG4gICAgICAuYXBwZW5kKCdkaXYnKVxuICAgICAgICAuZGF0dW0odGhpcy53aWRnZXRzKCkpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICd3aWRnZXRzJyk7XG5cbiAgICB2YXIgd2lkZ2V0ID0gd2lkZ2V0cy5zZWxlY3RBbGwoJy53aWRnZXQnKVxuICAgICAgLmRhdGEoZnVuY3Rpb24oZCkgeyByZXR1cm4gZDsgfSwgdGhpcy5rZXkoKSk7XG5cbiAgICB3aWRnZXQuZW50ZXIoKS5hcHBlbmQoJ2RpdicpXG4gICAgICAuYXR0cignY2xhc3MnLCAnd2lkZ2V0JylcbiAgICAgIC5hdHRyKCdkYXRhLWtleScsIHRoaXMua2V5KCkpO1xuXG4gICAgd2lkZ2V0LmVhY2goZnVuY3Rpb24oZCwgaSkge1xuICAgICAgdmFyIHR5cGUgPSBzZWxmLnR5cGUoKS5jYWxsKHRoaXMsIGQsIGkpO1xuXG4gICAgICBpZiAoIXNlbGYudHlwZXMoKS5oYXModHlwZSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5yZWNvZ25pc2VkIGRhc2hib2FyZCB3aWRnZXQgdHlwZSAnXCIgKyB0eXBlICsgXCInXCIpO1xuICAgICAgfVxuXG4gICAgICBzZWxmLnR5cGVzKClcbiAgICAgICAgLmdldCh0eXBlKVxuICAgICAgICAubmV3KHRoaXMpO1xuICAgIH0pO1xuXG4gICAgd2lkZ2V0LmV4aXQoKS5yZW1vdmUoKTtcbiAgfSk7XG4iLCJ2YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBzdHJhaW4oKVxuICAucHJvcCgnY29sJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7XG4gICAgcmV0dXJuIHV0aWxzLmFjY2VzcyhkLCAnY29sJyk7XG4gIH0pXG5cbiAgLnByb3AoJ3JvdycpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkge1xuICAgIHJldHVybiB1dGlscy5hY2Nlc3MoZCwgJ3JvdycpO1xuICB9KVxuXG4gIC5wcm9wKCdudW1jb2xzJylcbiAgLmRlZmF1bHQoOClcblxuICAucHJvcCgnc2NhbGUnKVxuICAuZGVmYXVsdCgxMClcblxuICAucHJvcCgncGFkZGluZycpXG4gIC5kZWZhdWx0KDUpXG5cbiAgLnByb3AoJ2NvbHNwYW4nKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHtcbiAgICByZXR1cm4gdXRpbHMuYWNjZXNzKGQsICdjb2xzcGFuJywgMSk7XG4gIH0pXG5cbiAgLnByb3AoJ3Jvd3NwYW4nKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHtcbiAgICByZXR1cm4gdXRpbHMuYWNjZXNzKGQsICdyb3dzcGFuJywgMSk7XG4gIH0pXG5cbiAgLmludm9rZShmdW5jdGlvbihkYXRhKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBiZXN0ID0gY291bnRlcigpLm51bWNvbHModGhpcy5udW1jb2xzKCkpO1xuXG4gICAgZGF0YSA9IChkYXRhIHx8IFtdKS5tYXAoZnVuY3Rpb24oZCwgaSkge1xuICAgICAgZCA9IHtcbiAgICAgICAgZGF0YTogZCxcbiAgICAgICAgY29sOiB1dGlscy5lbnN1cmUoc2VsZi5jb2woKS5jYWxsKHNlbGYsIGQsIGkpLCBiZXN0LmNvbCgpKSwgXG4gICAgICAgIHJvdzogdXRpbHMuZW5zdXJlKHNlbGYucm93KCkuY2FsbChzZWxmLCBkLCBpKSwgYmVzdC5yb3coKSksXG4gICAgICAgIHJvd3NwYW46IHNlbGYucm93c3BhbigpLmNhbGwoc2VsZiwgZCwgaSksXG4gICAgICAgIGNvbHNwYW46IHNlbGYuY29sc3BhbigpLmNhbGwoc2VsZiwgZCwgaSlcbiAgICAgIH07XG5cbiAgICAgIGJlc3QuaW5jKGQpO1xuICAgICAgcmV0dXJuIGQ7XG4gICAgfSk7XG5cbiAgICB2YXIgcXVhZHRyZWUgPSBkMy5nZW9tLnF1YWR0cmVlKClcbiAgICAgIC54KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuY29sOyB9KVxuICAgICAgLnkoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5yb3c7IH0pO1xuXG4gICAgdmFyIHJvb3QgPSBxdWFkdHJlZShkYXRhKTtcbiAgICB2YXIgaGFsZlBhZGRpbmcgPSB0aGlzLnBhZGRpbmcoKSAvIDI7XG5cbiAgICBkYXRhLmZvckVhY2goZnVuY3Rpb24oZCkge1xuICAgICAgcm9vdC52aXNpdCh1bmNvbGxpZGUoZCkpO1xuICAgICAgZC54ID0gKGQuY29sICogc2VsZi5zY2FsZSgpKSArIGhhbGZQYWRkaW5nO1xuICAgICAgZC55ID0gKGQucm93ICogc2VsZi5zY2FsZSgpKSArIGhhbGZQYWRkaW5nO1xuICAgICAgZC53aWR0aCA9IChkLmNvbHNwYW4gKiBzZWxmLnNjYWxlKCkpIC0gc2VsZi5wYWRkaW5nKCk7XG4gICAgICBkLmhlaWdodCA9IChkLnJvd3NwYW4gKiBzZWxmLnNjYWxlKCkpIC0gc2VsZi5wYWRkaW5nKCk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gZGF0YTtcbiAgfSk7XG5cblxudmFyIGNvdW50ZXIgPSBzdHJhaW4oKVxuICAucHJvcCgnbnVtY29scycpXG5cbiAgLnByb3AoJ3Jvd3NwYW4nKVxuICAuZGVmYXVsdCgwKVxuXG4gIC5wcm9wKCdjb2wnKVxuICAuZGVmYXVsdCgwKVxuXG4gIC5wcm9wKCdyb3cnKVxuICAuZGVmYXVsdCgwKVxuXG4gIC5tZXRoKCdpbmMnLCBmdW5jdGlvbihkKSB7XG4gICAgdmFyIGNvbCA9IGQuY29sICsgZC5jb2xzcGFuO1xuICAgIHZhciByb3cgPSB0aGlzLnJvdygpO1xuXG4gICAgaWYgKGNvbCA+PSB0aGlzLm51bWNvbHMoKSkge1xuICAgICAgY29sID0gMDtcbiAgICAgIHJvdyArPSB0aGlzLnJvd3NwYW4oKTtcbiAgICAgIHRoaXMucm93c3BhbigwKTtcbiAgICB9XG5cbiAgICB0aGlzXG4gICAgICAuY29sKGNvbClcbiAgICAgIC5yb3cocm93KVxuICAgICAgLnJvd3NwYW4oTWF0aC5tYXgodGhpcy5yb3dzcGFuKCksIGQucm93c3BhbikpO1xuICB9KTtcblxuXG5mdW5jdGlvbiBib3goZCkge1xuICByZXR1cm4ge1xuICAgIHgxOiBkLmNvbCxcbiAgICB4MjogZC5jb2wgKyBkLmNvbHNwYW4gLSAxLFxuICAgIHkxOiBkLnJvdyxcbiAgICB5MjogZC5yb3cgKyBkLnJvd3NwYW4gLSAxXG4gIH07XG59XG5cblxuZnVuY3Rpb24gdW5jb2xsaWRlKGEpIHtcbiAgdmFyIGJveEEgPSBib3goYSk7XG4gIFxuICByZXR1cm4gZnVuY3Rpb24obm9kZSwgeDEsIHkxLCB4MiwgeTIpIHtcbiAgICB2YXIgYiA9IG5vZGUucG9pbnQ7XG5cbiAgICBpZiAoYiAmJiBhICE9PSBiICYmIGludGVyc2VjdGlvbihib3hBLCBib3goYikpKSB7XG4gICAgICBiLnJvdyA9IGJveEEueTIgKyAxO1xuICAgIH1cblxuICAgIHJldHVybiAhaW50ZXJzZWN0aW9uKGJveEEsIHtcbiAgICAgIHgxOiB4MSwgXG4gICAgICB5MTogeTEsIFxuICAgICAgeDI6IHgyLFxuICAgICAgeTI6IHkyXG4gICAgfSk7XG4gIH07XG59XG5cblxuZnVuY3Rpb24gaW50ZXJzZWN0aW9uKGEsIGIpIHtcbiAgcmV0dXJuICgoYS54MSA8PSBiLngxICYmIGIueDEgPD0gYS54MikgJiYgKGEueTEgPD0gYi55MSAmJiBiLnkxIDw9IGEueTIpKVxuICAgICAgfHwgKChiLngxIDw9IGEueDEgJiYgYS54MSA8PSBiLngyKSAmJiAoYi55MSA8PSBhLnkxICYmIGEueTEgPD0gYi55MikpO1xufVxuIiwiZXhwb3J0cy51dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcbmV4cG9ydHMudmlldyA9IHJlcXVpcmUoJy4vdmlldycpO1xuZXhwb3J0cy5ncmlkID0gcmVxdWlyZSgnLi9ncmlkJyk7XG5leHBvcnRzLndpZGdldHMgPSByZXF1aXJlKCcuL3dpZGdldHMnKTtcbmV4cG9ydHMuZGFzaGJvYXJkID0gcmVxdWlyZSgnLi9kYXNoYm9hcmQnKTtcbiIsInZhciB1dGlscyA9IGV4cG9ydHM7XG5cblxudXRpbHMuYWNjZXNzID0gZnVuY3Rpb24oZCwgbmFtZSwgZGVmYXVsdHZhbCkge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDMpIHtcbiAgICBkZWZhdWx0dmFsID0gbnVsbDtcbiAgfVxuXG4gIGlmICh0eXBlb2YgZCAhPSAnb2JqZWN0Jykge1xuICAgIHJldHVybiBkZWZhdWx0dmFsO1xuICB9XG5cbiAgdmFyIHZhbCA9IGRbbmFtZV07XG4gIHJldHVybiB0eXBlb2YgdmFsID09ICd1bmRlZmluZWQnXG4gICAgPyBkZWZhdWx0dmFsXG4gICAgOiB2YWw7XG59O1xuXG5cbnV0aWxzLmVuc3VyZSA9IGZ1bmN0aW9uKHYsIGRlZmF1bHR2YWwpIHtcbiAgcmV0dXJuIHYgPT09IG51bGwgfHwgdHlwZW9mIHYgPT0gJ3VuZGVmaW5lZCdcbiAgICA/IGRlZmF1bHR2YWxcbiAgICA6IHY7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBzdHJhaW4oKVxuICAuc3RhdGljKCdpbml0JywgZnVuY3Rpb24oZm4pIHtcbiAgICBzdHJhaW4uaW5pdC5jYWxsKHRoaXMsIGZ1bmN0aW9uKGVsKSB7XG4gICAgICBpZiAoZWwpIHtcbiAgICAgICAgdGhpcy5lbChlbCk7XG4gICAgICB9XG5cbiAgICAgIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICAgIGlmIChlbCAmJiB0aGlzLmVsKCkuZGF0dW0oKSkge1xuICAgICAgICB0aGlzLmRyYXcoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSlcblxuICAuc3RhdGljKCdjb25mcHJvcCcsIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICB0aGlzLnByb3AobmFtZSk7XG5cbiAgICB0aGlzLnN0YXRpYyhuYW1lLCBmdW5jdGlvbih2KSB7XG4gICAgICB0aGlzLnByb3AobmFtZSkuZGVmYXVsdCh2KTtcbiAgICB9KTtcbiAgfSlcblxuICAuc3RhdGljKCdkcmF3JywgZnVuY3Rpb24oZm4pIHtcbiAgICB0aGlzLm1ldGgoJ2RyYXcnLCBmdW5jdGlvbihkYXR1bSkge1xuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgdGhpcy5lbCgpLmRhdHVtKGRhdHVtKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGZuLmNhbGwodGhpcyk7XG4gICAgfSk7XG4gIH0pXG5cbiAgLnByb3AoJ2VsJylcbiAgLnNldChmdW5jdGlvbih2KSB7XG4gICAgcmV0dXJuICEodiBpbnN0YW5jZW9mIGQzLnNlbGVjdGlvbilcbiAgICAgID8gZDMuc2VsZWN0KHYpXG4gICAgICA6IHY7XG4gIH0pXG5cbiAgLmluaXQoZnVuY3Rpb24oKSB7fSlcbiAgLmRyYXcoZnVuY3Rpb24oKSB7fSlcblxuICAuaW52b2tlKGZ1bmN0aW9uKGRhdHVtKSB7XG4gICAgcmV0dXJuIHRoaXMuZHJhdyhkYXR1bSk7XG4gIH0pO1xuIiwiZXhwb3J0cy5sYXN0dmFsdWUgPSByZXF1aXJlKCcuL2xhc3R2YWx1ZScpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuLi92aWV3JykuZXh0ZW5kKClcbiAgLmNvbmZwcm9wKCd0aXRsZScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLnRpdGxlKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGl0bGU7IH0pXG5cbiAgLmNvbmZwcm9wKCd2YWx1ZXMnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC52YWx1ZXMoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC52YWx1ZXM7IH0pXG5cbiAgLmNvbmZwcm9wKCd4JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAueChmdW5jdGlvbihkKSB7IHJldHVybiBkLng7IH0pXG5cbiAgLmNvbmZwcm9wKCd5JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAueShmdW5jdGlvbihkKSB7IHJldHVybiBkLnk7IH0pXG5cbiAgLmNvbmZwcm9wKCdmb3JtYXQnKVxuICAuZm9ybWF0KGQzLmZvcm1hdCgpKVxuXG4gIC5jb25mcHJvcCgnbm9uZScpXG4gIC5ub25lKDApXG5cbiAgLmRyYXcoZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgdGhpcy5lbCgpXG4gICAgICAuaHRtbChudWxsKVxuICAgICAgLmFwcGVuZCgnZGl2JylcbiAgICAgICAgLmRhdHVtKHRoaXMudmFsdWVzKCkpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICd2YWx1ZXMnKVxuICAgICAgICAuYXBwZW5kKCd0ZXh0JylcbiAgICAgICAgICAuZGF0dW0oZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICAgICAgcmV0dXJuIGRbZC5sZW5ndGggLSAxXTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5hdHRyKCdjbGFzcycsICdsYXN0JylcbiAgICAgICAgICAudGV4dChmdW5jdGlvbihkLCBpKSB7XG4gICAgICAgICAgICB2YXIgdiA9IGRcbiAgICAgICAgICAgICAgPyBzZWxmLnkoKS5jYWxsKHRoaXMsIGQsIGkpXG4gICAgICAgICAgICAgIDogc2VsZi5ub25lKCk7XG5cbiAgICAgICAgICAgICAgcmV0dXJuIHNlbGYuZm9ybWF0KCkodik7XG4gICAgICAgICAgfSk7XG4gIH0pO1xuIl19
(3)
});
