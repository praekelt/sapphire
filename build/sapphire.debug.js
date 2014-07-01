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


utils.translate = function(x, y) {
  return 'translate(' + x + ', ' + y + ')';
};


utils.ensureEl = function(el) {
  return !(el instanceof d3.selection)
    ? d3.select(el)
    : el;
};


utils.date = function(t) {
  return new Date(t);
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
var utils = _dereq_('../utils');


module.exports = _dereq_('./widget').extend()
  .prop('width')
  .default(400)

  .prop('colspan')
  .default(2)

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

  .prop('fvalue')
  .default(d3.format(',2s'))

  .prop('fdiff')
  .default(d3.format('+,2s'))

  .prop('ftime')
  .default(d3.time.format('%-d %b %-H:%M'))

  .prop('none')
  .default(0)

  .prop('sparkline')
  .prop('summary')

  .init(function() {
    this.sparkline(sparkline(this));
    this.summary(summary(this));
  })

  .enter(function(el) {
    el.attr('class', 'lastvalue');

    el.append('div')
      .attr('class', 'title');

    var values = el.append('div')
      .attr('class', 'values');

    values.append('div')
      .attr('class', 'last value');

    values.append('div')
      .attr('class', 'sparkline');

    values.append('div')
      .attr('class', 'summary');
  })

  .draw(function(el) {
    var self = this;
    var node = el.node();

    el.select('.title')
      .text(function(d, i) {
        return self.title().call(node, d, i);
      });

    var values = el.select('.values')
      .datum(function(d, i) {
        return self.values()
          .call(node, d, i)
          .map(function(d, i) {
            return {
              x: self.x().call(node, d, i),
              y: self.y().call(node, d, i)
            };
          });
      })
      .attr('class', function(d) {
        d = d.slice(-2);

        d = d.length > 1
          ? d[1].y - d[0].y
          : 0;

        if (d > 0) { return 'good values'; }
        if (d < 0) { return 'bad values'; }
        return 'neutral values';
      });

    values.select('.last.value')
      .datum(function(d, i) {
        d = d[d.length - 1];

        return !d
          ? self.none()
          : d.y;
      })
      .text(this.fvalue());

    values.select('.sparkline')
      .call(this.sparkline());

    values.select('.summary')
      .call(this.summary());
  });


var summary = _dereq_('../view').extend()
  .prop('lastvalue')

  .init(function(lastvalue) {
    this.lastvalue(lastvalue);
  })

  .enter(function(el) {
    el.append('span')
      .attr('class', 'diff');

    el.append('span')
      .attr('class', 'time');
  })

  .draw(function(el) {
    var lastvalue = this.lastvalue();
    if (el.datum().length < 2) { return; }

    el.select('.diff')
      .datum(function(d) {
        d = d.slice(-2);
        return d[1].y - d[0].y;
      })
      .text(lastvalue.fdiff());

    el.select('.time')
      .datum(function(d) {
        d = d.slice(-2);

        return [d[0].x, d[1].x]
          .map(utils.date)
          .map(lastvalue.ftime());
      })
      .text(function(d) {
        return [' from', d[0], 'to', d[1]].join(' ');
      });
  });


var sparkline = _dereq_('../view').extend()
  .prop('lastvalue')

  .prop('height').default(25)

  .prop('margin').default({
    top: 4,
    left: 4,
    bottom: 4,
    right: 4 
  })

  .init(function(lastvalue) {
    this.lastvalue(lastvalue);
  })

  .enter(function(el) {
    var svg = el.append('svg')
      .append('g');

    svg.append('path')
      .attr('class', 'rest path');

    svg.append('path')
      .attr('class', 'diff path');
  })

  .draw(function(el) {
    var margin = this.margin();
    var width = parseInt(el.style('width'));

    var fx = d3.scale.linear()
      .domain(d3.extent(el.datum(), function(d) { return d.x; }))
      .range([0, width - (margin.left + margin.right)]);

    var fy = d3.scale.linear()
      .domain(d3.extent(el.datum(), function(d) { return d.y; }))
      .range([this.height() - (margin.top + margin.bottom), 0]);

    var line = d3.svg.line()
      .x(function(d) { return fx(d.x); })
      .y(function(d) { return fy(d.y); });

    var svg = el.select('svg')
      .attr('width', width)
      .attr('height', this.height())
      .select('g')
        .attr('transform', utils.translate(margin.left, margin.top));

    svg.select('.rest.path')
      .attr('d', line);

    svg.select('.diff.path')
      .datum(function(d) { return d.slice(-2); })
      .attr('d', line);

    var dot = svg.selectAll('.dot')
      .data(function(d) { return d.slice(-1); });

    dot.enter().append('circle')
      .attr('class', 'dot')
      .attr('r', 4);

    dot
      .attr('cx', function(d) { return fx(d.x); })
      .attr('cy', function(d) { return fy(d.y); });

    dot.exit().remove();
  });

},{"../utils":4,"../view":5,"./widget":8}],8:[function(_dereq_,module,exports){
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy9kYXNoYm9hcmQuanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvZ3JpZC5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy9pbmRleC5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy91dGlscy5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy92aWV3LmpzIiwiL2hvbWUvanVzdGluL3ByYWVrZWx0L3NhcHBoaXJlL3NyYy9zY3JpcHRzL3dpZGdldHMvaW5kZXguanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvd2lkZ2V0cy9sYXN0dmFsdWUuanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvd2lkZ2V0cy93aWRnZXQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaE9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcbnZhciBsYXlvdXQgPSByZXF1aXJlKCcuL2dyaWQnKTtcbnZhciB3aWRnZXRzID0gcmVxdWlyZSgnLi93aWRnZXRzJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL3ZpZXcnKS5leHRlbmQoKVxuICAucHJvcCgndHlwZXMnKVxuXG4gIC5wcm9wKCd0aXRsZScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50aXRsZTsgfSlcblxuICAucHJvcCgna2V5JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkLCBpKSB7XG4gICAgcmV0dXJuICdrZXknIGluIGRcbiAgICAgID8gZC5rZXlcbiAgICAgIDogaTtcbiAgfSlcblxuICAucHJvcCgndHlwZScpXG4gIC5zZXQoZnVuY3Rpb24oZm4pIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgZm4gPSBkMy5mdW5jdG9yKGZuKTtcblxuICAgIHJldHVybiBmdW5jdGlvbihkLCBpKSB7XG4gICAgICB2YXIgbmFtZSA9IGZuLmNhbGwodGhpcywgZCwgaSk7XG5cbiAgICAgIGlmICghc2VsZi50eXBlcygpLmhhcyhuYW1lKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbnJlY29nbmlzZWQgZGFzaGJvYXJkIHdpZGdldCB0eXBlICdcIiArIG5hbWUgKyBcIidcIik7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzZWxmLnR5cGVzKCkuZ2V0KG5hbWUpO1xuICAgIH07XG4gIH0pXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudHlwZTsgfSlcblxuICAucHJvcCgnd2lkZ2V0cycpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC53aWRnZXRzOyB9KVxuXG4gIC5wcm9wKCdjb2wnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHtcbiAgICByZXR1cm4gdXRpbHMuYWNjZXNzKGQsICdjb2wnKTtcbiAgfSlcblxuICAucHJvcCgncm93JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7XG4gICAgcmV0dXJuIHV0aWxzLmFjY2VzcyhkLCAncm93Jyk7XG4gIH0pXG5cbiAgLnByb3AoJ2NvbHNwYW4nKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHtcbiAgICByZXR1cm4gdXRpbHMuYWNjZXNzKGQsICdjb2xzcGFuJyk7XG4gIH0pXG5cbiAgLnByb3AoJ3Jvd3NwYW4nKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHtcbiAgICByZXR1cm4gdXRpbHMuYWNjZXNzKGQsICdyb3dzcGFuJyk7XG4gIH0pXG5cbiAgLnByb3AoJ251bWNvbHMnKVxuICAuZGVmYXVsdCg4KVxuXG4gIC5wcm9wKCdwYWRkaW5nJylcbiAgLmRlZmF1bHQoNSlcblxuICAuaW5pdChmdW5jdGlvbigpIHtcbiAgICB2YXIgdHlwZXMgPSBkMy5tYXAoKTtcblxuICAgIGQzLmtleXMod2lkZ2V0cykuZm9yRWFjaChmdW5jdGlvbihrKSB7XG4gICAgICB0eXBlcy5zZXQoaywgd2lkZ2V0c1trXS5uZXcoKSk7XG4gICAgfSk7XG5cbiAgICB0aGlzLnR5cGVzKHR5cGVzKTtcbiAgfSlcblxuICAuZW50ZXIoZnVuY3Rpb24oZWwpIHtcbiAgICBlbC5hdHRyKCdjbGFzcycsICdkYXNoYm9hcmQnKVxuICAgICAgLmFwcGVuZCgnZGl2JylcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ3dpZGdldHMnKTtcbiAgfSlcblxuICAuZHJhdyhmdW5jdGlvbihlbCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIHZhciBncmlkID0gbGF5b3V0KClcbiAgICAgIC5zY2FsZSgxMDApXG4gICAgICAubnVtY29scyh0aGlzLm51bWNvbHMoKSlcbiAgICAgIC5wYWRkaW5nKHRoaXMucGFkZGluZygpKVxuICAgICAgLmNvbChmdW5jdGlvbihkLCBpKSB7XG4gICAgICAgIHJldHVybiBzZWxmLmNvbCgpLmNhbGwoc2VsZiwgZCwgaSk7XG4gICAgICB9KVxuICAgICAgLnJvdyhmdW5jdGlvbihkLCBpKSB7XG4gICAgICAgIHJldHVybiBzZWxmLnJvdygpLmNhbGwoc2VsZiwgZCwgaSk7XG4gICAgICB9KVxuICAgICAgLmNvbHNwYW4oZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICB2YXIgdiA9IHNlbGYuY29sc3BhbigpLmNhbGwoc2VsZiwgZCwgaSk7XG4gICAgICAgIHZhciB0eXBlID0gc2VsZi50eXBlKCkuY2FsbCh0aGlzLCBkLCBpKTtcbiAgICAgICAgcmV0dXJuIHV0aWxzLmVuc3VyZSh2LCB0eXBlLmNvbHNwYW4oKSk7XG4gICAgICB9KVxuICAgICAgLnJvd3NwYW4oZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICB2YXIgdiA9IHNlbGYucm93c3BhbigpLmNhbGwoc2VsZiwgZCwgaSk7XG4gICAgICAgIHZhciB0eXBlID0gc2VsZi50eXBlKCkuY2FsbCh0aGlzLCBkLCBpKTtcbiAgICAgICAgcmV0dXJuIHV0aWxzLmVuc3VyZSh2LCB0eXBlLnJvd3NwYW4oKSk7XG4gICAgICB9KTtcblxuICAgIHZhciB3aWRnZXQgPSBlbC5zZWxlY3QoJy53aWRnZXRzJykuc2VsZWN0QWxsKCcud2lkZ2V0JylcbiAgICAgIC5kYXRhKGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgICAgcmV0dXJuIHNlbGYud2lkZ2V0cygpLmNhbGwodGhpcywgZCwgaSk7XG4gICAgICB9KTtcblxuICAgIHdpZGdldC5lbnRlcigpLmFwcGVuZCgnZGl2JylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd3aWRnZXQnKTtcblxuICAgIHZhciBncmlkRWxzID0gZ3JpZCh3aWRnZXQuZGF0YSgpKTtcblxuICAgIHdpZGdldFxuICAgICAgLmF0dHIoJ2RhdGEta2V5JywgdGhpcy5rZXkoKSlcbiAgICAgIC5lYWNoKGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgICAgdmFyIHR5cGUgPSBzZWxmLnR5cGUoKS5jYWxsKHRoaXMsIGQsIGkpO1xuICAgICAgICB2YXIgZ3JpZEVsID0gZ3JpZEVsc1tpXTtcblxuICAgICAgICBkMy5zZWxlY3QodGhpcylcbiAgICAgICAgICAuY2FsbCh0eXBlKVxuICAgICAgICAgIC5zdHlsZSgnbGVmdCcsIGdyaWRFbC54ICsgJ3B4JylcbiAgICAgICAgICAuc3R5bGUoJ3RvcCcsIGdyaWRFbC55ICsgJ3B4JylcbiAgICAgICAgICAuc3R5bGUoJ3dpZHRoJywgZ3JpZEVsLndpZHRoICsgJ3B4JylcbiAgICAgICAgICAuc3R5bGUoJ2hlaWdodCcsIGdyaWRFbC5oZWlnaHQgKyAncHgnKTtcbiAgICAgIH0pO1xuXG4gICAgd2lkZ2V0LmV4aXQoKS5yZW1vdmUoKTtcblxuICB9KTtcbiIsInZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcblxuXG52YXIgZ3JpZCA9IG1vZHVsZS5leHBvcnRzID0gc3RyYWluKClcbiAgLnByb3AoJ2NvbCcpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkge1xuICAgIHJldHVybiB1dGlscy5hY2Nlc3MoZCwgJ2NvbCcpO1xuICB9KVxuXG4gIC5wcm9wKCdyb3cnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHtcbiAgICByZXR1cm4gdXRpbHMuYWNjZXNzKGQsICdyb3cnKTtcbiAgfSlcblxuICAucHJvcCgnbnVtY29scycpXG4gIC5kZWZhdWx0KDgpXG5cbiAgLnByb3AoJ3NjYWxlJylcbiAgLmRlZmF1bHQoMTApXG5cbiAgLnByb3AoJ3BhZGRpbmcnKVxuICAuZGVmYXVsdCg1KVxuXG4gIC5wcm9wKCdjb2xzcGFuJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7XG4gICAgcmV0dXJuIHV0aWxzLmFjY2VzcyhkLCAnY29sc3BhbicsIDEpO1xuICB9KVxuXG4gIC5wcm9wKCdyb3dzcGFuJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7XG4gICAgcmV0dXJuIHV0aWxzLmFjY2VzcyhkLCAncm93c3BhbicsIDEpO1xuICB9KVxuXG4gIC5pbnZva2UoZnVuY3Rpb24oZGF0YSkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgYmVzdCA9IGNvdW50ZXIoKS5udW1jb2xzKHRoaXMubnVtY29scygpKTtcblxuICAgIGRhdGEgPSAoZGF0YSB8fCBbXSkubWFwKGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgIGQgPSB7XG4gICAgICAgIGRhdGE6IGQsXG4gICAgICAgIGNvbDogdXRpbHMuZW5zdXJlKHNlbGYuY29sKCkuY2FsbChzZWxmLCBkLCBpKSwgYmVzdC5jb2woKSksIFxuICAgICAgICByb3c6IHV0aWxzLmVuc3VyZShzZWxmLnJvdygpLmNhbGwoc2VsZiwgZCwgaSksIGJlc3Qucm93KCkpLFxuICAgICAgICByb3dzcGFuOiBzZWxmLnJvd3NwYW4oKS5jYWxsKHNlbGYsIGQsIGkpLFxuICAgICAgICBjb2xzcGFuOiBzZWxmLmNvbHNwYW4oKS5jYWxsKHNlbGYsIGQsIGkpXG4gICAgICB9O1xuXG4gICAgICBiZXN0LmluYyhkKTtcbiAgICAgIHJldHVybiBkO1xuICAgIH0pO1xuXG4gICAgdmFyIHF1YWR0cmVlID0gZDMuZ2VvbS5xdWFkdHJlZSgpXG4gICAgICAueChmdW5jdGlvbihkKSB7IHJldHVybiBkLmNvbDsgfSlcbiAgICAgIC55KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQucm93OyB9KTtcblxuICAgIHZhciByb290ID0gcXVhZHRyZWUoZGF0YSk7XG4gICAgdmFyIGRibFBhZGRpbmcgPSB0aGlzLnBhZGRpbmcoKSAqIDI7XG5cbiAgICBkYXRhLmZvckVhY2goZnVuY3Rpb24oZCkge1xuICAgICAgcm9vdC52aXNpdChncmlkLnVuY29sbGlkZShkKSk7XG4gICAgICBkLnggPSAoZC5jb2wgKiBzZWxmLnNjYWxlKCkpICsgc2VsZi5wYWRkaW5nKCk7XG4gICAgICBkLnkgPSAoZC5yb3cgKiBzZWxmLnNjYWxlKCkpICsgc2VsZi5wYWRkaW5nKCk7XG4gICAgICBkLndpZHRoID0gKGQuY29sc3BhbiAqIHNlbGYuc2NhbGUoKSkgLSBkYmxQYWRkaW5nO1xuICAgICAgZC5oZWlnaHQgPSAoZC5yb3dzcGFuICogc2VsZi5zY2FsZSgpKSAtIGRibFBhZGRpbmc7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gZGF0YTtcbiAgfSlcblxuICAuc3RhdGljKGZ1bmN0aW9uIGJveChkKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHgxOiBkLmNvbCxcbiAgICAgIHgyOiBkLmNvbCArIGQuY29sc3BhbiAtIDEsXG4gICAgICB5MTogZC5yb3csXG4gICAgICB5MjogZC5yb3cgKyBkLnJvd3NwYW4gLSAxXG4gICAgfTtcbiAgfSlcblxuICAuc3RhdGljKGZ1bmN0aW9uIHVuY29sbGlkZShhKSB7XG4gICAgdmFyIGJveEEgPSBncmlkLmJveChhKTtcbiAgICBcbiAgICByZXR1cm4gZnVuY3Rpb24obm9kZSwgeDEsIHkxLCB4MiwgeTIpIHtcbiAgICAgIHZhciBiID0gbm9kZS5wb2ludDtcblxuICAgICAgaWYgKGIgJiYgYSAhPT0gYiAmJiBncmlkLmludGVyc2VjdGlvbihib3hBLCBncmlkLmJveChiKSkpIHtcbiAgICAgICAgYi5yb3cgPSBib3hBLnkyICsgMTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuICFncmlkLmludGVyc2VjdGlvbihib3hBLCB7XG4gICAgICAgIHgxOiB4MSwgXG4gICAgICAgIHkxOiB5MSwgXG4gICAgICAgIHgyOiB4MixcbiAgICAgICAgeTI6IHkyXG4gICAgICB9KTtcbiAgICB9O1xuICB9KVxuXG4gIC5zdGF0aWMoZnVuY3Rpb24gaW50ZXJzZWN0aW9uKGEsIGIpIHtcbiAgICByZXR1cm4gKChhLngxIDw9IGIueDEgJiYgYi54MSA8PSBhLngyKSAmJiAoYS55MSA8PSBiLnkxICYmIGIueTEgPD0gYS55MikpXG4gICAgICAgIHx8ICgoYi54MSA8PSBhLngxICYmIGEueDEgPD0gYi54MikgJiYgKGIueTEgPD0gYS55MSAmJiBhLnkxIDw9IGIueTIpKVxuICAgICAgICB8fCAoKGEueDEgPD0gYi54MiAmJiBiLngyIDw9IGEueDIpICYmIChhLnkxIDw9IGIueTEgJiYgYi55MSA8PSBhLnkyKSlcbiAgICAgICAgfHwgKChiLngxIDw9IGEueDIgJiYgYS54MiA8PSBiLngyKSAmJiAoYi55MSA8PSBhLnkxICYmIGEueTEgPD0gYi55MikpO1xuICB9KTtcblxuXG52YXIgY291bnRlciA9IHN0cmFpbigpXG4gIC5wcm9wKCdudW1jb2xzJylcblxuICAucHJvcCgncm93c3BhbicpXG4gIC5kZWZhdWx0KDApXG5cbiAgLnByb3AoJ2NvbCcpXG4gIC5kZWZhdWx0KDApXG5cbiAgLnByb3AoJ3JvdycpXG4gIC5kZWZhdWx0KDApXG5cbiAgLm1ldGgoZnVuY3Rpb24gaW5jKGQpIHtcbiAgICB2YXIgY29sID0gZC5jb2wgKyBkLmNvbHNwYW47XG4gICAgdmFyIHJvdyA9IHRoaXMucm93KCk7XG5cbiAgICBpZiAoY29sID49IHRoaXMubnVtY29scygpKSB7XG4gICAgICBjb2wgPSAwO1xuICAgICAgcm93ICs9IHRoaXMucm93c3BhbigpO1xuICAgICAgdGhpcy5yb3dzcGFuKDApO1xuICAgIH1cblxuICAgIHRoaXNcbiAgICAgIC5jb2woY29sKVxuICAgICAgLnJvdyhyb3cpXG4gICAgICAucm93c3BhbihNYXRoLm1heCh0aGlzLnJvd3NwYW4oKSwgZC5yb3dzcGFuKSk7XG4gIH0pO1xuIiwiZXhwb3J0cy51dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcbmV4cG9ydHMudmlldyA9IHJlcXVpcmUoJy4vdmlldycpO1xuZXhwb3J0cy5ncmlkID0gcmVxdWlyZSgnLi9ncmlkJyk7XG5leHBvcnRzLndpZGdldHMgPSByZXF1aXJlKCcuL3dpZGdldHMnKTtcbmV4cG9ydHMuZGFzaGJvYXJkID0gcmVxdWlyZSgnLi9kYXNoYm9hcmQnKTtcbiIsInZhciB1dGlscyA9IGV4cG9ydHM7XG5cblxudXRpbHMuYWNjZXNzID0gZnVuY3Rpb24oZCwgbmFtZSwgZGVmYXVsdHZhbCkge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDMpIHtcbiAgICBkZWZhdWx0dmFsID0gbnVsbDtcbiAgfVxuXG4gIGlmICh0eXBlb2YgZCAhPSAnb2JqZWN0Jykge1xuICAgIHJldHVybiBkZWZhdWx0dmFsO1xuICB9XG5cbiAgdmFyIHZhbCA9IGRbbmFtZV07XG4gIHJldHVybiB0eXBlb2YgdmFsID09ICd1bmRlZmluZWQnXG4gICAgPyBkZWZhdWx0dmFsXG4gICAgOiB2YWw7XG59O1xuXG5cbnV0aWxzLmVuc3VyZSA9IGZ1bmN0aW9uKHYsIGRlZmF1bHR2YWwpIHtcbiAgcmV0dXJuIHYgPT09IG51bGwgfHwgdHlwZW9mIHYgPT0gJ3VuZGVmaW5lZCdcbiAgICA/IGRlZmF1bHR2YWxcbiAgICA6IHY7XG59O1xuXG5cbnV0aWxzLnRyYW5zbGF0ZSA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgcmV0dXJuICd0cmFuc2xhdGUoJyArIHggKyAnLCAnICsgeSArICcpJztcbn07XG5cblxudXRpbHMuZW5zdXJlRWwgPSBmdW5jdGlvbihlbCkge1xuICByZXR1cm4gIShlbCBpbnN0YW5jZW9mIGQzLnNlbGVjdGlvbilcbiAgICA/IGQzLnNlbGVjdChlbClcbiAgICA6IGVsO1xufTtcblxuXG51dGlscy5kYXRlID0gZnVuY3Rpb24odCkge1xuICByZXR1cm4gbmV3IERhdGUodCk7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBzdHJhaW4oKVxuICAuc3RhdGljKGZ1bmN0aW9uIGRyYXcoZm4pIHtcbiAgICB0aGlzLm1ldGgoJ19kcmF3XycsIGZuKTtcbiAgfSlcbiAgLmRyYXcoZnVuY3Rpb24oKSB7fSlcblxuICAuc3RhdGljKGZ1bmN0aW9uIGVudGVyKGZuKSB7XG4gICAgdGhpcy5tZXRoKCdfZW50ZXJfJywgZm4pO1xuICB9KVxuICAuZW50ZXIoZnVuY3Rpb24oKSB7fSlcblxuICAubWV0aChmdW5jdGlvbiBkcmF3KGVsKSB7XG4gICAgZWwgPSBzYXBwaGlyZS51dGlscy5lbnN1cmVFbChlbCk7XG5cbiAgICBpZiAoZWwubm9kZSgpICYmICFlbC5ub2RlKCkuaGFzQ2hpbGROb2RlcygpKSB7XG4gICAgICB0aGlzLmVudGVyKGVsKTtcbiAgICB9XG5cbiAgICB2YXIgcGFyZW50ID0gdGhpcy5fdHlwZV8uX3N1cGVyXy5wcm90b3R5cGU7XG4gICAgaWYgKCdfZHJhd18nIGluIHBhcmVudCkge1xuICAgICAgcGFyZW50Ll9kcmF3Xy5jYWxsKHRoaXMsIGVsKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fZHJhd18oZWwpO1xuICB9KVxuXG4gIC5tZXRoKGZ1bmN0aW9uIGVudGVyKGVsKSB7XG4gICAgZWwgPSBzYXBwaGlyZS51dGlscy5lbnN1cmVFbChlbCk7XG5cbiAgICB2YXIgcGFyZW50ID0gdGhpcy5fdHlwZV8uX3N1cGVyXy5wcm90b3R5cGU7XG4gICAgaWYgKCdfZW50ZXJfJyBpbiBwYXJlbnQpIHtcbiAgICAgIHBhcmVudC5fZW50ZXJfLmNhbGwodGhpcywgZWwpO1xuICAgIH1cblxuICAgIHRoaXMuX2VudGVyXyhlbCk7XG4gIH0pXG5cbiAgLmludm9rZShmdW5jdGlvbihlbCkge1xuICAgIHJldHVybiB0aGlzLmRyYXcoZWwpO1xuICB9KTtcbiIsImV4cG9ydHMud2lkZ2V0ID0gcmVxdWlyZSgnLi93aWRnZXQnKTtcbmV4cG9ydHMubGFzdHZhbHVlID0gcmVxdWlyZSgnLi9sYXN0dmFsdWUnKTtcbiIsInZhciB1dGlscyA9IHJlcXVpcmUoJy4uL3V0aWxzJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL3dpZGdldCcpLmV4dGVuZCgpXG4gIC5wcm9wKCd3aWR0aCcpXG4gIC5kZWZhdWx0KDQwMClcblxuICAucHJvcCgnY29sc3BhbicpXG4gIC5kZWZhdWx0KDIpXG5cbiAgLnByb3AoJ3RpdGxlJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLnRpdGxlOyB9KVxuXG4gIC5wcm9wKCd2YWx1ZXMnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudmFsdWVzOyB9KVxuXG4gIC5wcm9wKCd4JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLng7IH0pXG5cbiAgLnByb3AoJ3knKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueTsgfSlcblxuICAucHJvcCgnZnZhbHVlJylcbiAgLmRlZmF1bHQoZDMuZm9ybWF0KCcsMnMnKSlcblxuICAucHJvcCgnZmRpZmYnKVxuICAuZGVmYXVsdChkMy5mb3JtYXQoJyssMnMnKSlcblxuICAucHJvcCgnZnRpbWUnKVxuICAuZGVmYXVsdChkMy50aW1lLmZvcm1hdCgnJS1kICViICUtSDolTScpKVxuXG4gIC5wcm9wKCdub25lJylcbiAgLmRlZmF1bHQoMClcblxuICAucHJvcCgnc3BhcmtsaW5lJylcbiAgLnByb3AoJ3N1bW1hcnknKVxuXG4gIC5pbml0KGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc3BhcmtsaW5lKHNwYXJrbGluZSh0aGlzKSk7XG4gICAgdGhpcy5zdW1tYXJ5KHN1bW1hcnkodGhpcykpO1xuICB9KVxuXG4gIC5lbnRlcihmdW5jdGlvbihlbCkge1xuICAgIGVsLmF0dHIoJ2NsYXNzJywgJ2xhc3R2YWx1ZScpO1xuXG4gICAgZWwuYXBwZW5kKCdkaXYnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3RpdGxlJyk7XG5cbiAgICB2YXIgdmFsdWVzID0gZWwuYXBwZW5kKCdkaXYnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3ZhbHVlcycpO1xuXG4gICAgdmFsdWVzLmFwcGVuZCgnZGl2JylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdsYXN0IHZhbHVlJyk7XG5cbiAgICB2YWx1ZXMuYXBwZW5kKCdkaXYnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3NwYXJrbGluZScpO1xuXG4gICAgdmFsdWVzLmFwcGVuZCgnZGl2JylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdzdW1tYXJ5Jyk7XG4gIH0pXG5cbiAgLmRyYXcoZnVuY3Rpb24oZWwpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIG5vZGUgPSBlbC5ub2RlKCk7XG5cbiAgICBlbC5zZWxlY3QoJy50aXRsZScpXG4gICAgICAudGV4dChmdW5jdGlvbihkLCBpKSB7XG4gICAgICAgIHJldHVybiBzZWxmLnRpdGxlKCkuY2FsbChub2RlLCBkLCBpKTtcbiAgICAgIH0pO1xuXG4gICAgdmFyIHZhbHVlcyA9IGVsLnNlbGVjdCgnLnZhbHVlcycpXG4gICAgICAuZGF0dW0oZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICByZXR1cm4gc2VsZi52YWx1ZXMoKVxuICAgICAgICAgIC5jYWxsKG5vZGUsIGQsIGkpXG4gICAgICAgICAgLm1hcChmdW5jdGlvbihkLCBpKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICB4OiBzZWxmLngoKS5jYWxsKG5vZGUsIGQsIGkpLFxuICAgICAgICAgICAgICB5OiBzZWxmLnkoKS5jYWxsKG5vZGUsIGQsIGkpXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH0pO1xuICAgICAgfSlcbiAgICAgIC5hdHRyKCdjbGFzcycsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgZCA9IGQuc2xpY2UoLTIpO1xuXG4gICAgICAgIGQgPSBkLmxlbmd0aCA+IDFcbiAgICAgICAgICA/IGRbMV0ueSAtIGRbMF0ueVxuICAgICAgICAgIDogMDtcblxuICAgICAgICBpZiAoZCA+IDApIHsgcmV0dXJuICdnb29kIHZhbHVlcyc7IH1cbiAgICAgICAgaWYgKGQgPCAwKSB7IHJldHVybiAnYmFkIHZhbHVlcyc7IH1cbiAgICAgICAgcmV0dXJuICduZXV0cmFsIHZhbHVlcyc7XG4gICAgICB9KTtcblxuICAgIHZhbHVlcy5zZWxlY3QoJy5sYXN0LnZhbHVlJylcbiAgICAgIC5kYXR1bShmdW5jdGlvbihkLCBpKSB7XG4gICAgICAgIGQgPSBkW2QubGVuZ3RoIC0gMV07XG5cbiAgICAgICAgcmV0dXJuICFkXG4gICAgICAgICAgPyBzZWxmLm5vbmUoKVxuICAgICAgICAgIDogZC55O1xuICAgICAgfSlcbiAgICAgIC50ZXh0KHRoaXMuZnZhbHVlKCkpO1xuXG4gICAgdmFsdWVzLnNlbGVjdCgnLnNwYXJrbGluZScpXG4gICAgICAuY2FsbCh0aGlzLnNwYXJrbGluZSgpKTtcblxuICAgIHZhbHVlcy5zZWxlY3QoJy5zdW1tYXJ5JylcbiAgICAgIC5jYWxsKHRoaXMuc3VtbWFyeSgpKTtcbiAgfSk7XG5cblxudmFyIHN1bW1hcnkgPSByZXF1aXJlKCcuLi92aWV3JykuZXh0ZW5kKClcbiAgLnByb3AoJ2xhc3R2YWx1ZScpXG5cbiAgLmluaXQoZnVuY3Rpb24obGFzdHZhbHVlKSB7XG4gICAgdGhpcy5sYXN0dmFsdWUobGFzdHZhbHVlKTtcbiAgfSlcblxuICAuZW50ZXIoZnVuY3Rpb24oZWwpIHtcbiAgICBlbC5hcHBlbmQoJ3NwYW4nKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ2RpZmYnKTtcblxuICAgIGVsLmFwcGVuZCgnc3BhbicpXG4gICAgICAuYXR0cignY2xhc3MnLCAndGltZScpO1xuICB9KVxuXG4gIC5kcmF3KGZ1bmN0aW9uKGVsKSB7XG4gICAgdmFyIGxhc3R2YWx1ZSA9IHRoaXMubGFzdHZhbHVlKCk7XG4gICAgaWYgKGVsLmRhdHVtKCkubGVuZ3RoIDwgMikgeyByZXR1cm47IH1cblxuICAgIGVsLnNlbGVjdCgnLmRpZmYnKVxuICAgICAgLmRhdHVtKGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgZCA9IGQuc2xpY2UoLTIpO1xuICAgICAgICByZXR1cm4gZFsxXS55IC0gZFswXS55O1xuICAgICAgfSlcbiAgICAgIC50ZXh0KGxhc3R2YWx1ZS5mZGlmZigpKTtcblxuICAgIGVsLnNlbGVjdCgnLnRpbWUnKVxuICAgICAgLmRhdHVtKGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgZCA9IGQuc2xpY2UoLTIpO1xuXG4gICAgICAgIHJldHVybiBbZFswXS54LCBkWzFdLnhdXG4gICAgICAgICAgLm1hcCh1dGlscy5kYXRlKVxuICAgICAgICAgIC5tYXAobGFzdHZhbHVlLmZ0aW1lKCkpO1xuICAgICAgfSlcbiAgICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuIFsnIGZyb20nLCBkWzBdLCAndG8nLCBkWzFdXS5qb2luKCcgJyk7XG4gICAgICB9KTtcbiAgfSk7XG5cblxudmFyIHNwYXJrbGluZSA9IHJlcXVpcmUoJy4uL3ZpZXcnKS5leHRlbmQoKVxuICAucHJvcCgnbGFzdHZhbHVlJylcblxuICAucHJvcCgnaGVpZ2h0JykuZGVmYXVsdCgyNSlcblxuICAucHJvcCgnbWFyZ2luJykuZGVmYXVsdCh7XG4gICAgdG9wOiA0LFxuICAgIGxlZnQ6IDQsXG4gICAgYm90dG9tOiA0LFxuICAgIHJpZ2h0OiA0IFxuICB9KVxuXG4gIC5pbml0KGZ1bmN0aW9uKGxhc3R2YWx1ZSkge1xuICAgIHRoaXMubGFzdHZhbHVlKGxhc3R2YWx1ZSk7XG4gIH0pXG5cbiAgLmVudGVyKGZ1bmN0aW9uKGVsKSB7XG4gICAgdmFyIHN2ZyA9IGVsLmFwcGVuZCgnc3ZnJylcbiAgICAgIC5hcHBlbmQoJ2cnKTtcblxuICAgIHN2Zy5hcHBlbmQoJ3BhdGgnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3Jlc3QgcGF0aCcpO1xuXG4gICAgc3ZnLmFwcGVuZCgncGF0aCcpXG4gICAgICAuYXR0cignY2xhc3MnLCAnZGlmZiBwYXRoJyk7XG4gIH0pXG5cbiAgLmRyYXcoZnVuY3Rpb24oZWwpIHtcbiAgICB2YXIgbWFyZ2luID0gdGhpcy5tYXJnaW4oKTtcbiAgICB2YXIgd2lkdGggPSBwYXJzZUludChlbC5zdHlsZSgnd2lkdGgnKSk7XG5cbiAgICB2YXIgZnggPSBkMy5zY2FsZS5saW5lYXIoKVxuICAgICAgLmRvbWFpbihkMy5leHRlbnQoZWwuZGF0dW0oKSwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC54OyB9KSlcbiAgICAgIC5yYW5nZShbMCwgd2lkdGggLSAobWFyZ2luLmxlZnQgKyBtYXJnaW4ucmlnaHQpXSk7XG5cbiAgICB2YXIgZnkgPSBkMy5zY2FsZS5saW5lYXIoKVxuICAgICAgLmRvbWFpbihkMy5leHRlbnQoZWwuZGF0dW0oKSwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC55OyB9KSlcbiAgICAgIC5yYW5nZShbdGhpcy5oZWlnaHQoKSAtIChtYXJnaW4udG9wICsgbWFyZ2luLmJvdHRvbSksIDBdKTtcblxuICAgIHZhciBsaW5lID0gZDMuc3ZnLmxpbmUoKVxuICAgICAgLngoZnVuY3Rpb24oZCkgeyByZXR1cm4gZngoZC54KTsgfSlcbiAgICAgIC55KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGZ5KGQueSk7IH0pO1xuXG4gICAgdmFyIHN2ZyA9IGVsLnNlbGVjdCgnc3ZnJylcbiAgICAgIC5hdHRyKCd3aWR0aCcsIHdpZHRoKVxuICAgICAgLmF0dHIoJ2hlaWdodCcsIHRoaXMuaGVpZ2h0KCkpXG4gICAgICAuc2VsZWN0KCdnJylcbiAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIHV0aWxzLnRyYW5zbGF0ZShtYXJnaW4ubGVmdCwgbWFyZ2luLnRvcCkpO1xuXG4gICAgc3ZnLnNlbGVjdCgnLnJlc3QucGF0aCcpXG4gICAgICAuYXR0cignZCcsIGxpbmUpO1xuXG4gICAgc3ZnLnNlbGVjdCgnLmRpZmYucGF0aCcpXG4gICAgICAuZGF0dW0oZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5zbGljZSgtMik7IH0pXG4gICAgICAuYXR0cignZCcsIGxpbmUpO1xuXG4gICAgdmFyIGRvdCA9IHN2Zy5zZWxlY3RBbGwoJy5kb3QnKVxuICAgICAgLmRhdGEoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5zbGljZSgtMSk7IH0pO1xuXG4gICAgZG90LmVudGVyKCkuYXBwZW5kKCdjaXJjbGUnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ2RvdCcpXG4gICAgICAuYXR0cigncicsIDQpO1xuXG4gICAgZG90XG4gICAgICAuYXR0cignY3gnLCBmdW5jdGlvbihkKSB7IHJldHVybiBmeChkLngpOyB9KVxuICAgICAgLmF0dHIoJ2N5JywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZnkoZC55KTsgfSk7XG5cbiAgICBkb3QuZXhpdCgpLnJlbW92ZSgpO1xuICB9KTtcbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi4vdmlldycpLmV4dGVuZCgpXG4gIC5wcm9wKCdjb2xzcGFuJylcbiAgLmRlZmF1bHQoMSlcblxuICAucHJvcCgncm93c3BhbicpXG4gIC5kZWZhdWx0KDEpXG5cbiAgLnByb3AoJ3dpZHRoJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdCgyMDApXG5cbiAgLnByb3AoJ2hlaWdodCcpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoMjAwKVxuXG4gIC5kcmF3KGZ1bmN0aW9uKGVsKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgZWwuc3R5bGUoJ3dpZHRoJywgZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICByZXR1cm4gc2VsZi53aWR0aCgpLmNhbGwodGhpcywgZCwgaSkgKyAncHgnO1xuICAgICAgfSlcbiAgICAgIC5zdHlsZSgnaGVpZ2h0JywgZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICByZXR1cm4gc2VsZi5oZWlnaHQoKS5jYWxsKHRoaXMsIGQsIGkpICsgJ3B4JztcbiAgICAgIH0pO1xuICB9KTtcbiJdfQ==
(3)
});
