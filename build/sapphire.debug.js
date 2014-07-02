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


// adapted from http://erlycoder.com/49/javascript-hash-functions-to-
// convert-string-into-integer-hash-
utils.hash = function(s) {
  var result = 0;
  var c;

  for (i = 0; i < s.length; i++) {
      c = s.charCodeAt(i);
      result = ((result << 5) - result) + c;
      result = result & result;
  }

  return result;
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
exports.lines = _dereq_('./lines');
exports.lastvalue = _dereq_('./lastvalue');

},{"./lastvalue":7,"./lines":8,"./widget":9}],7:[function(_dereq_,module,exports){
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
    el.attr('class', 'lastvalue widget');

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

},{"../utils":4,"../view":5,"./widget":9}],8:[function(_dereq_,module,exports){
var utils = _dereq_('../utils');


module.exports = _dereq_('./widget').extend()
  .prop('width')
  .default(600)

  .prop('colspan')
  .default(3)

  .prop('title')
  .set(d3.functor)
  .default(function(d) { return d.title; })

  .prop('sets')
  .set(d3.functor)
  .default(function(d) { return d.sets; })

  .prop('key')
  .set(d3.functor)
  .default(function(d) { return d.key; })

  .prop('setTitle')
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

  .prop('ftick')
  .default(null)

  .prop('ticks')
  .default(7)

  .prop('colors')
  .default(d3.scale.category10())

  .prop('none')
  .default(0)

  .prop('chart')
  .prop('legend')

  .init(function() {
    this.chart(chart(this));
    this.legend(legend(this));
  })

  .enter(function(el) {
    el.attr('class', 'lines widget');

    el.append('div')
      .attr('class', 'widget title');

    var values = el.append('div')
      .attr('class', 'values');

    values.append('div')
      .attr('class', 'chart');

    values.append('div')
      .attr('class', 'legend');
  })

  .draw(function(el) {
    var self = this;
    var node = el.node();
    var colors = this.colors();

    el.select('.widget.title')
      .text(function(d, i) {
        return self.title().call(node, d, i);
      });

    var len;
    var values = el.select('.values')
      .datum(function(d, i) {
        d = self.sets().call(node, d, i);
        len = d.length;
        return d.map(set);
      });

    values.select('.chart')
      .call(this.chart());

    values.select('.legend')
      .call(this.legend());

    function set(d, i) {
      var key = self.key()
        .call(node, d, i)
        .toString();

      return {
        key: key,
        color: colors(utils.hash(key) % len),
        title: self.setTitle().call(node, d, i),
        values: self.values()
          .call(node, d, i)
          .map(value)
      };
    }

    function value(d, i) {
      return {
        x: self.x().call(node, d, i),
        y: self.y().call(node, d, i)
      };
    }
  });


var chart = _dereq_('../view').extend()
  .prop('height')
  .default(150)

  .prop('margin')
  .default({
    top: 4,
    left: 25,
    right: 25,
    bottom: 25
  })

  .prop('widget')

  .init(function(widget) {
    this.widget(widget);
  })

  .enter(function(el) {
    var svg = el.append('svg')
      .append('g');

    svg.append('g')
      .attr('class', 'lines');

    svg.append('g')
      .attr('class', 'axis');
  })

  .draw(function(el) {
    var margin = this.margin();
    var width = parseInt(el.style('width'));
    var innerHeight = this.height() - (margin.top + margin.bottom);

    var allValues = el
      .datum()
      .reduce(function(results, set) {
        results.push.apply(results, set.values);
        return results;
      }, []);

    var fx = d3.time.scale()
      .domain(d3.extent(allValues, function(d) { return d.x; }))
      .range([0, width - (margin.left + margin.right)]);

    var fy = d3.scale.linear()
      .domain(d3.extent(allValues, function(d) { return d.y; }))
      .range([innerHeight, 0]);

    var axis = d3.svg.axis()
      .scale(fx)
      .ticks(this.widget().ticks())
      .tickFormat(this.widget().ftick());

    var line = d3.svg.line()
      .x(function(d) { return fx(d.x); })
      .y(function(d) { return fy(d.y); });

    var svg = el.select('svg')
      .attr('width', width)
      .attr('height', this.height())
      .select('g')
        .attr('transform', utils.translate(margin.left, margin.top));

    var set = svg.select('.lines').selectAll('.set')
      .data(function(d) { return d; },
            function(d) { return d.key; });

    set.enter().append('g')
      .attr('class', 'set')
      .attr('data-id', function(d) { return d.key; })
      .append('path')
        .attr('class', 'line');

    set.select('.line')
      .attr('stroke', function(d) { return d.color; })
      .attr('d', function(d) { return line(d.values); });

    var dot = set.selectAll('.dot')
      .data(function(d) {
        if (!d.values.length) { return []; }
        var last = d.values[d.values.length - 1];

        return [{
          x: last.x,
          y: last.y,
          color: d.color
        }];
      });

    dot.enter().append('circle')
      .attr('class', 'dot')
      .attr('r', 4);

    dot
      .attr('fill', function(d) { return d.color; })
      .attr('cx', function(d) { return fx(d.x); })
      .attr('cy', function(d) { return fy(d.y); });

    dot.exit()
      .remove();

    set.exit()
      .remove();

    svg
      .select('.axis')
      .attr('transform', utils.translate(0, innerHeight))
      .call(axis);
  });


var legend = _dereq_('../view').extend()
  .prop('widget')

  .init(function(widget) {
    this.widget(widget);
  })

  .enter(function(el) {
    el.append('table')
      .attr('class', 'table');
  })

  .draw(function(el) {
    var none = this.widget().none();
    var fvalue = this.widget().fvalue();

    var set = el.select('.table').selectAll('.set')
      .data(function(d) { return d; },
            function(d) { return d.key; });

    var enterSet = set.enter().append('tr')
      .attr('data-id', function(d) { return d.key; })
      .attr('class', 'set');

    enterSet.append('td')
      .attr('class', 'swatch');

    enterSet.append('td')
      .attr('class', 'title');

    enterSet.append('td')
      .attr('class', 'value');

    set.select('.swatch')
      .style('background', function(d) { return d.color; });

    set.select('.title')
      .text(function(d) { return d.title; });

    set.select('.value')
      .text(function(d) {
        d = d.values[d.values.length - 1];

        return d
          ? fvalue(d.y)
          : fvalue(none);
      });

    set.exit()
      .remove();
  });

},{"../utils":4,"../view":5,"./widget":9}],9:[function(_dereq_,module,exports){
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy9kYXNoYm9hcmQuanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvZ3JpZC5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy9pbmRleC5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy91dGlscy5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy92aWV3LmpzIiwiL2hvbWUvanVzdGluL3ByYWVrZWx0L3NhcHBoaXJlL3NyYy9zY3JpcHRzL3dpZGdldHMvaW5kZXguanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvd2lkZ2V0cy9sYXN0dmFsdWUuanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvd2lkZ2V0cy9saW5lcy5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy93aWRnZXRzL3dpZGdldC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaE9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG52YXIgbGF5b3V0ID0gcmVxdWlyZSgnLi9ncmlkJyk7XG52YXIgd2lkZ2V0cyA9IHJlcXVpcmUoJy4vd2lkZ2V0cycpO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi92aWV3JykuZXh0ZW5kKClcbiAgLnByb3AoJ3R5cGVzJylcblxuICAucHJvcCgndGl0bGUnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGl0bGU7IH0pXG5cbiAgLnByb3AoJ2tleScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCwgaSkge1xuICAgIHJldHVybiAna2V5JyBpbiBkXG4gICAgICA/IGQua2V5XG4gICAgICA6IGk7XG4gIH0pXG5cbiAgLnByb3AoJ3R5cGUnKVxuICAuc2V0KGZ1bmN0aW9uKGZuKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIGZuID0gZDMuZnVuY3Rvcihmbik7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24oZCwgaSkge1xuICAgICAgdmFyIG5hbWUgPSBmbi5jYWxsKHRoaXMsIGQsIGkpO1xuXG4gICAgICBpZiAoIXNlbGYudHlwZXMoKS5oYXMobmFtZSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5yZWNvZ25pc2VkIGRhc2hib2FyZCB3aWRnZXQgdHlwZSAnXCIgKyBuYW1lICsgXCInXCIpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gc2VsZi50eXBlcygpLmdldChuYW1lKTtcbiAgICB9O1xuICB9KVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLnR5cGU7IH0pXG5cbiAgLnByb3AoJ3dpZGdldHMnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQud2lkZ2V0czsgfSlcblxuICAucHJvcCgnY29sJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7XG4gICAgcmV0dXJuIHV0aWxzLmFjY2VzcyhkLCAnY29sJyk7XG4gIH0pXG5cbiAgLnByb3AoJ3JvdycpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkge1xuICAgIHJldHVybiB1dGlscy5hY2Nlc3MoZCwgJ3JvdycpO1xuICB9KVxuXG4gIC5wcm9wKCdjb2xzcGFuJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7XG4gICAgcmV0dXJuIHV0aWxzLmFjY2VzcyhkLCAnY29sc3BhbicpO1xuICB9KVxuXG4gIC5wcm9wKCdyb3dzcGFuJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7XG4gICAgcmV0dXJuIHV0aWxzLmFjY2VzcyhkLCAncm93c3BhbicpO1xuICB9KVxuXG4gIC5wcm9wKCdudW1jb2xzJylcbiAgLmRlZmF1bHQoOClcblxuICAucHJvcCgncGFkZGluZycpXG4gIC5kZWZhdWx0KDUpXG5cbiAgLmluaXQoZnVuY3Rpb24oKSB7XG4gICAgdmFyIHR5cGVzID0gZDMubWFwKCk7XG5cbiAgICBkMy5rZXlzKHdpZGdldHMpLmZvckVhY2goZnVuY3Rpb24oaykge1xuICAgICAgdHlwZXMuc2V0KGssIHdpZGdldHNba10ubmV3KCkpO1xuICAgIH0pO1xuXG4gICAgdGhpcy50eXBlcyh0eXBlcyk7XG4gIH0pXG5cbiAgLmVudGVyKGZ1bmN0aW9uKGVsKSB7XG4gICAgZWwuYXR0cignY2xhc3MnLCAnZGFzaGJvYXJkJylcbiAgICAgIC5hcHBlbmQoJ2RpdicpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICd3aWRnZXRzJyk7XG4gIH0pXG5cbiAgLmRyYXcoZnVuY3Rpb24oZWwpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICB2YXIgZ3JpZCA9IGxheW91dCgpXG4gICAgICAuc2NhbGUoMTAwKVxuICAgICAgLm51bWNvbHModGhpcy5udW1jb2xzKCkpXG4gICAgICAucGFkZGluZyh0aGlzLnBhZGRpbmcoKSlcbiAgICAgIC5jb2woZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICByZXR1cm4gc2VsZi5jb2woKS5jYWxsKHNlbGYsIGQsIGkpO1xuICAgICAgfSlcbiAgICAgIC5yb3coZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICByZXR1cm4gc2VsZi5yb3coKS5jYWxsKHNlbGYsIGQsIGkpO1xuICAgICAgfSlcbiAgICAgIC5jb2xzcGFuKGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgICAgdmFyIHYgPSBzZWxmLmNvbHNwYW4oKS5jYWxsKHNlbGYsIGQsIGkpO1xuICAgICAgICB2YXIgdHlwZSA9IHNlbGYudHlwZSgpLmNhbGwodGhpcywgZCwgaSk7XG4gICAgICAgIHJldHVybiB1dGlscy5lbnN1cmUodiwgdHlwZS5jb2xzcGFuKCkpO1xuICAgICAgfSlcbiAgICAgIC5yb3dzcGFuKGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgICAgdmFyIHYgPSBzZWxmLnJvd3NwYW4oKS5jYWxsKHNlbGYsIGQsIGkpO1xuICAgICAgICB2YXIgdHlwZSA9IHNlbGYudHlwZSgpLmNhbGwodGhpcywgZCwgaSk7XG4gICAgICAgIHJldHVybiB1dGlscy5lbnN1cmUodiwgdHlwZS5yb3dzcGFuKCkpO1xuICAgICAgfSk7XG5cbiAgICB2YXIgd2lkZ2V0ID0gZWwuc2VsZWN0KCcud2lkZ2V0cycpLnNlbGVjdEFsbCgnLndpZGdldCcpXG4gICAgICAuZGF0YShmdW5jdGlvbihkLCBpKSB7XG4gICAgICAgIHJldHVybiBzZWxmLndpZGdldHMoKS5jYWxsKHRoaXMsIGQsIGkpO1xuICAgICAgfSk7XG5cbiAgICB3aWRnZXQuZW50ZXIoKS5hcHBlbmQoJ2RpdicpXG4gICAgICAuYXR0cignY2xhc3MnLCAnd2lkZ2V0Jyk7XG5cbiAgICB2YXIgZ3JpZEVscyA9IGdyaWQod2lkZ2V0LmRhdGEoKSk7XG5cbiAgICB3aWRnZXRcbiAgICAgIC5hdHRyKCdkYXRhLWtleScsIHRoaXMua2V5KCkpXG4gICAgICAuZWFjaChmdW5jdGlvbihkLCBpKSB7XG4gICAgICAgIHZhciB0eXBlID0gc2VsZi50eXBlKCkuY2FsbCh0aGlzLCBkLCBpKTtcbiAgICAgICAgdmFyIGdyaWRFbCA9IGdyaWRFbHNbaV07XG5cbiAgICAgICAgZDMuc2VsZWN0KHRoaXMpXG4gICAgICAgICAgLmNhbGwodHlwZSlcbiAgICAgICAgICAuc3R5bGUoJ2xlZnQnLCBncmlkRWwueCArICdweCcpXG4gICAgICAgICAgLnN0eWxlKCd0b3AnLCBncmlkRWwueSArICdweCcpXG4gICAgICAgICAgLnN0eWxlKCd3aWR0aCcsIGdyaWRFbC53aWR0aCArICdweCcpXG4gICAgICAgICAgLnN0eWxlKCdoZWlnaHQnLCBncmlkRWwuaGVpZ2h0ICsgJ3B4Jyk7XG4gICAgICB9KTtcblxuICAgIHdpZGdldC5leGl0KCkucmVtb3ZlKCk7XG5cbiAgfSk7XG4iLCJ2YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG5cblxudmFyIGdyaWQgPSBtb2R1bGUuZXhwb3J0cyA9IHN0cmFpbigpXG4gIC5wcm9wKCdjb2wnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHtcbiAgICByZXR1cm4gdXRpbHMuYWNjZXNzKGQsICdjb2wnKTtcbiAgfSlcblxuICAucHJvcCgncm93JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7XG4gICAgcmV0dXJuIHV0aWxzLmFjY2VzcyhkLCAncm93Jyk7XG4gIH0pXG5cbiAgLnByb3AoJ251bWNvbHMnKVxuICAuZGVmYXVsdCg4KVxuXG4gIC5wcm9wKCdzY2FsZScpXG4gIC5kZWZhdWx0KDEwKVxuXG4gIC5wcm9wKCdwYWRkaW5nJylcbiAgLmRlZmF1bHQoNSlcblxuICAucHJvcCgnY29sc3BhbicpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkge1xuICAgIHJldHVybiB1dGlscy5hY2Nlc3MoZCwgJ2NvbHNwYW4nLCAxKTtcbiAgfSlcblxuICAucHJvcCgncm93c3BhbicpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkge1xuICAgIHJldHVybiB1dGlscy5hY2Nlc3MoZCwgJ3Jvd3NwYW4nLCAxKTtcbiAgfSlcblxuICAuaW52b2tlKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIGJlc3QgPSBjb3VudGVyKCkubnVtY29scyh0aGlzLm51bWNvbHMoKSk7XG5cbiAgICBkYXRhID0gKGRhdGEgfHwgW10pLm1hcChmdW5jdGlvbihkLCBpKSB7XG4gICAgICBkID0ge1xuICAgICAgICBkYXRhOiBkLFxuICAgICAgICBjb2w6IHV0aWxzLmVuc3VyZShzZWxmLmNvbCgpLmNhbGwoc2VsZiwgZCwgaSksIGJlc3QuY29sKCkpLCBcbiAgICAgICAgcm93OiB1dGlscy5lbnN1cmUoc2VsZi5yb3coKS5jYWxsKHNlbGYsIGQsIGkpLCBiZXN0LnJvdygpKSxcbiAgICAgICAgcm93c3Bhbjogc2VsZi5yb3dzcGFuKCkuY2FsbChzZWxmLCBkLCBpKSxcbiAgICAgICAgY29sc3Bhbjogc2VsZi5jb2xzcGFuKCkuY2FsbChzZWxmLCBkLCBpKVxuICAgICAgfTtcblxuICAgICAgYmVzdC5pbmMoZCk7XG4gICAgICByZXR1cm4gZDtcbiAgICB9KTtcblxuICAgIHZhciBxdWFkdHJlZSA9IGQzLmdlb20ucXVhZHRyZWUoKVxuICAgICAgLngoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5jb2w7IH0pXG4gICAgICAueShmdW5jdGlvbihkKSB7IHJldHVybiBkLnJvdzsgfSk7XG5cbiAgICB2YXIgcm9vdCA9IHF1YWR0cmVlKGRhdGEpO1xuICAgIHZhciBkYmxQYWRkaW5nID0gdGhpcy5wYWRkaW5nKCkgKiAyO1xuXG4gICAgZGF0YS5mb3JFYWNoKGZ1bmN0aW9uKGQpIHtcbiAgICAgIHJvb3QudmlzaXQoZ3JpZC51bmNvbGxpZGUoZCkpO1xuICAgICAgZC54ID0gKGQuY29sICogc2VsZi5zY2FsZSgpKSArIHNlbGYucGFkZGluZygpO1xuICAgICAgZC55ID0gKGQucm93ICogc2VsZi5zY2FsZSgpKSArIHNlbGYucGFkZGluZygpO1xuICAgICAgZC53aWR0aCA9IChkLmNvbHNwYW4gKiBzZWxmLnNjYWxlKCkpIC0gZGJsUGFkZGluZztcbiAgICAgIGQuaGVpZ2h0ID0gKGQucm93c3BhbiAqIHNlbGYuc2NhbGUoKSkgLSBkYmxQYWRkaW5nO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGRhdGE7XG4gIH0pXG5cbiAgLnN0YXRpYyhmdW5jdGlvbiBib3goZCkge1xuICAgIHJldHVybiB7XG4gICAgICB4MTogZC5jb2wsXG4gICAgICB4MjogZC5jb2wgKyBkLmNvbHNwYW4gLSAxLFxuICAgICAgeTE6IGQucm93LFxuICAgICAgeTI6IGQucm93ICsgZC5yb3dzcGFuIC0gMVxuICAgIH07XG4gIH0pXG5cbiAgLnN0YXRpYyhmdW5jdGlvbiB1bmNvbGxpZGUoYSkge1xuICAgIHZhciBib3hBID0gZ3JpZC5ib3goYSk7XG4gICAgXG4gICAgcmV0dXJuIGZ1bmN0aW9uKG5vZGUsIHgxLCB5MSwgeDIsIHkyKSB7XG4gICAgICB2YXIgYiA9IG5vZGUucG9pbnQ7XG5cbiAgICAgIGlmIChiICYmIGEgIT09IGIgJiYgZ3JpZC5pbnRlcnNlY3Rpb24oYm94QSwgZ3JpZC5ib3goYikpKSB7XG4gICAgICAgIGIucm93ID0gYm94QS55MiArIDE7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiAhZ3JpZC5pbnRlcnNlY3Rpb24oYm94QSwge1xuICAgICAgICB4MTogeDEsIFxuICAgICAgICB5MTogeTEsIFxuICAgICAgICB4MjogeDIsXG4gICAgICAgIHkyOiB5MlxuICAgICAgfSk7XG4gICAgfTtcbiAgfSlcblxuICAuc3RhdGljKGZ1bmN0aW9uIGludGVyc2VjdGlvbihhLCBiKSB7XG4gICAgcmV0dXJuICgoYS54MSA8PSBiLngxICYmIGIueDEgPD0gYS54MikgJiYgKGEueTEgPD0gYi55MSAmJiBiLnkxIDw9IGEueTIpKVxuICAgICAgICB8fCAoKGIueDEgPD0gYS54MSAmJiBhLngxIDw9IGIueDIpICYmIChiLnkxIDw9IGEueTEgJiYgYS55MSA8PSBiLnkyKSlcbiAgICAgICAgfHwgKChhLngxIDw9IGIueDIgJiYgYi54MiA8PSBhLngyKSAmJiAoYS55MSA8PSBiLnkxICYmIGIueTEgPD0gYS55MikpXG4gICAgICAgIHx8ICgoYi54MSA8PSBhLngyICYmIGEueDIgPD0gYi54MikgJiYgKGIueTEgPD0gYS55MSAmJiBhLnkxIDw9IGIueTIpKTtcbiAgfSk7XG5cblxudmFyIGNvdW50ZXIgPSBzdHJhaW4oKVxuICAucHJvcCgnbnVtY29scycpXG5cbiAgLnByb3AoJ3Jvd3NwYW4nKVxuICAuZGVmYXVsdCgwKVxuXG4gIC5wcm9wKCdjb2wnKVxuICAuZGVmYXVsdCgwKVxuXG4gIC5wcm9wKCdyb3cnKVxuICAuZGVmYXVsdCgwKVxuXG4gIC5tZXRoKGZ1bmN0aW9uIGluYyhkKSB7XG4gICAgdmFyIGNvbCA9IGQuY29sICsgZC5jb2xzcGFuO1xuICAgIHZhciByb3cgPSB0aGlzLnJvdygpO1xuXG4gICAgaWYgKGNvbCA+PSB0aGlzLm51bWNvbHMoKSkge1xuICAgICAgY29sID0gMDtcbiAgICAgIHJvdyArPSB0aGlzLnJvd3NwYW4oKTtcbiAgICAgIHRoaXMucm93c3BhbigwKTtcbiAgICB9XG5cbiAgICB0aGlzXG4gICAgICAuY29sKGNvbClcbiAgICAgIC5yb3cocm93KVxuICAgICAgLnJvd3NwYW4oTWF0aC5tYXgodGhpcy5yb3dzcGFuKCksIGQucm93c3BhbikpO1xuICB9KTtcbiIsImV4cG9ydHMudXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG5leHBvcnRzLnZpZXcgPSByZXF1aXJlKCcuL3ZpZXcnKTtcbmV4cG9ydHMuZ3JpZCA9IHJlcXVpcmUoJy4vZ3JpZCcpO1xuZXhwb3J0cy53aWRnZXRzID0gcmVxdWlyZSgnLi93aWRnZXRzJyk7XG5leHBvcnRzLmRhc2hib2FyZCA9IHJlcXVpcmUoJy4vZGFzaGJvYXJkJyk7XG4iLCJ2YXIgdXRpbHMgPSBleHBvcnRzO1xuXG5cbnV0aWxzLmFjY2VzcyA9IGZ1bmN0aW9uKGQsIG5hbWUsIGRlZmF1bHR2YWwpIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCAzKSB7XG4gICAgZGVmYXVsdHZhbCA9IG51bGw7XG4gIH1cblxuICBpZiAodHlwZW9mIGQgIT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4gZGVmYXVsdHZhbDtcbiAgfVxuXG4gIHZhciB2YWwgPSBkW25hbWVdO1xuICByZXR1cm4gdHlwZW9mIHZhbCA9PSAndW5kZWZpbmVkJ1xuICAgID8gZGVmYXVsdHZhbFxuICAgIDogdmFsO1xufTtcblxuXG51dGlscy5lbnN1cmUgPSBmdW5jdGlvbih2LCBkZWZhdWx0dmFsKSB7XG4gIHJldHVybiB2ID09PSBudWxsIHx8IHR5cGVvZiB2ID09ICd1bmRlZmluZWQnXG4gICAgPyBkZWZhdWx0dmFsXG4gICAgOiB2O1xufTtcblxuXG51dGlscy50cmFuc2xhdGUgPSBmdW5jdGlvbih4LCB5KSB7XG4gIHJldHVybiAndHJhbnNsYXRlKCcgKyB4ICsgJywgJyArIHkgKyAnKSc7XG59O1xuXG5cbnV0aWxzLmVuc3VyZUVsID0gZnVuY3Rpb24oZWwpIHtcbiAgcmV0dXJuICEoZWwgaW5zdGFuY2VvZiBkMy5zZWxlY3Rpb24pXG4gICAgPyBkMy5zZWxlY3QoZWwpXG4gICAgOiBlbDtcbn07XG5cblxudXRpbHMuZGF0ZSA9IGZ1bmN0aW9uKHQpIHtcbiAgcmV0dXJuIG5ldyBEYXRlKHQpO1xufTtcblxuXG4vLyBhZGFwdGVkIGZyb20gaHR0cDovL2VybHljb2Rlci5jb20vNDkvamF2YXNjcmlwdC1oYXNoLWZ1bmN0aW9ucy10by1cbi8vIGNvbnZlcnQtc3RyaW5nLWludG8taW50ZWdlci1oYXNoLVxudXRpbHMuaGFzaCA9IGZ1bmN0aW9uKHMpIHtcbiAgdmFyIHJlc3VsdCA9IDA7XG4gIHZhciBjO1xuXG4gIGZvciAoaSA9IDA7IGkgPCBzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjID0gcy5jaGFyQ29kZUF0KGkpO1xuICAgICAgcmVzdWx0ID0gKChyZXN1bHQgPDwgNSkgLSByZXN1bHQpICsgYztcbiAgICAgIHJlc3VsdCA9IHJlc3VsdCAmIHJlc3VsdDtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBzdHJhaW4oKVxuICAuc3RhdGljKGZ1bmN0aW9uIGRyYXcoZm4pIHtcbiAgICB0aGlzLm1ldGgoJ19kcmF3XycsIGZuKTtcbiAgfSlcbiAgLmRyYXcoZnVuY3Rpb24oKSB7fSlcblxuICAuc3RhdGljKGZ1bmN0aW9uIGVudGVyKGZuKSB7XG4gICAgdGhpcy5tZXRoKCdfZW50ZXJfJywgZm4pO1xuICB9KVxuICAuZW50ZXIoZnVuY3Rpb24oKSB7fSlcblxuICAubWV0aChmdW5jdGlvbiBkcmF3KGVsKSB7XG4gICAgZWwgPSBzYXBwaGlyZS51dGlscy5lbnN1cmVFbChlbCk7XG5cbiAgICBpZiAoZWwubm9kZSgpICYmICFlbC5ub2RlKCkuaGFzQ2hpbGROb2RlcygpKSB7XG4gICAgICB0aGlzLmVudGVyKGVsKTtcbiAgICB9XG5cbiAgICB2YXIgcGFyZW50ID0gdGhpcy5fdHlwZV8uX3N1cGVyXy5wcm90b3R5cGU7XG4gICAgaWYgKCdfZHJhd18nIGluIHBhcmVudCkge1xuICAgICAgcGFyZW50Ll9kcmF3Xy5jYWxsKHRoaXMsIGVsKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fZHJhd18oZWwpO1xuICB9KVxuXG4gIC5tZXRoKGZ1bmN0aW9uIGVudGVyKGVsKSB7XG4gICAgZWwgPSBzYXBwaGlyZS51dGlscy5lbnN1cmVFbChlbCk7XG5cbiAgICB2YXIgcGFyZW50ID0gdGhpcy5fdHlwZV8uX3N1cGVyXy5wcm90b3R5cGU7XG4gICAgaWYgKCdfZW50ZXJfJyBpbiBwYXJlbnQpIHtcbiAgICAgIHBhcmVudC5fZW50ZXJfLmNhbGwodGhpcywgZWwpO1xuICAgIH1cblxuICAgIHRoaXMuX2VudGVyXyhlbCk7XG4gIH0pXG5cbiAgLmludm9rZShmdW5jdGlvbihlbCkge1xuICAgIHJldHVybiB0aGlzLmRyYXcoZWwpO1xuICB9KTtcbiIsImV4cG9ydHMud2lkZ2V0ID0gcmVxdWlyZSgnLi93aWRnZXQnKTtcbmV4cG9ydHMubGluZXMgPSByZXF1aXJlKCcuL2xpbmVzJyk7XG5leHBvcnRzLmxhc3R2YWx1ZSA9IHJlcXVpcmUoJy4vbGFzdHZhbHVlJyk7XG4iLCJ2YXIgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi93aWRnZXQnKS5leHRlbmQoKVxuICAucHJvcCgnd2lkdGgnKVxuICAuZGVmYXVsdCg0MDApXG5cbiAgLnByb3AoJ2NvbHNwYW4nKVxuICAuZGVmYXVsdCgyKVxuXG4gIC5wcm9wKCd0aXRsZScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50aXRsZTsgfSlcblxuICAucHJvcCgndmFsdWVzJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLnZhbHVlczsgfSlcblxuICAucHJvcCgneCcpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC54OyB9KVxuXG4gIC5wcm9wKCd5JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLnk7IH0pXG5cbiAgLnByb3AoJ2Z2YWx1ZScpXG4gIC5kZWZhdWx0KGQzLmZvcm1hdCgnLDJzJykpXG5cbiAgLnByb3AoJ2ZkaWZmJylcbiAgLmRlZmF1bHQoZDMuZm9ybWF0KCcrLDJzJykpXG5cbiAgLnByb3AoJ2Z0aW1lJylcbiAgLmRlZmF1bHQoZDMudGltZS5mb3JtYXQoJyUtZCAlYiAlLUg6JU0nKSlcblxuICAucHJvcCgnbm9uZScpXG4gIC5kZWZhdWx0KDApXG5cbiAgLnByb3AoJ3NwYXJrbGluZScpXG4gIC5wcm9wKCdzdW1tYXJ5JylcblxuICAuaW5pdChmdW5jdGlvbigpIHtcbiAgICB0aGlzLnNwYXJrbGluZShzcGFya2xpbmUodGhpcykpO1xuICAgIHRoaXMuc3VtbWFyeShzdW1tYXJ5KHRoaXMpKTtcbiAgfSlcblxuICAuZW50ZXIoZnVuY3Rpb24oZWwpIHtcbiAgICBlbC5hdHRyKCdjbGFzcycsICdsYXN0dmFsdWUgd2lkZ2V0Jyk7XG5cbiAgICBlbC5hcHBlbmQoJ2RpdicpXG4gICAgICAuYXR0cignY2xhc3MnLCAndGl0bGUnKTtcblxuICAgIHZhciB2YWx1ZXMgPSBlbC5hcHBlbmQoJ2RpdicpXG4gICAgICAuYXR0cignY2xhc3MnLCAndmFsdWVzJyk7XG5cbiAgICB2YWx1ZXMuYXBwZW5kKCdkaXYnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ2xhc3QgdmFsdWUnKTtcblxuICAgIHZhbHVlcy5hcHBlbmQoJ2RpdicpXG4gICAgICAuYXR0cignY2xhc3MnLCAnc3BhcmtsaW5lJyk7XG5cbiAgICB2YWx1ZXMuYXBwZW5kKCdkaXYnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3N1bW1hcnknKTtcbiAgfSlcblxuICAuZHJhdyhmdW5jdGlvbihlbCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgbm9kZSA9IGVsLm5vZGUoKTtcblxuICAgIGVsLnNlbGVjdCgnLnRpdGxlJylcbiAgICAgIC50ZXh0KGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgICAgcmV0dXJuIHNlbGYudGl0bGUoKS5jYWxsKG5vZGUsIGQsIGkpO1xuICAgICAgfSk7XG5cbiAgICB2YXIgdmFsdWVzID0gZWwuc2VsZWN0KCcudmFsdWVzJylcbiAgICAgIC5kYXR1bShmdW5jdGlvbihkLCBpKSB7XG4gICAgICAgIHJldHVybiBzZWxmLnZhbHVlcygpXG4gICAgICAgICAgLmNhbGwobm9kZSwgZCwgaSlcbiAgICAgICAgICAubWFwKGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIHg6IHNlbGYueCgpLmNhbGwobm9kZSwgZCwgaSksXG4gICAgICAgICAgICAgIHk6IHNlbGYueSgpLmNhbGwobm9kZSwgZCwgaSlcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfSk7XG4gICAgICB9KVxuICAgICAgLmF0dHIoJ2NsYXNzJywgZnVuY3Rpb24oZCkge1xuICAgICAgICBkID0gZC5zbGljZSgtMik7XG5cbiAgICAgICAgZCA9IGQubGVuZ3RoID4gMVxuICAgICAgICAgID8gZFsxXS55IC0gZFswXS55XG4gICAgICAgICAgOiAwO1xuXG4gICAgICAgIGlmIChkID4gMCkgeyByZXR1cm4gJ2dvb2QgdmFsdWVzJzsgfVxuICAgICAgICBpZiAoZCA8IDApIHsgcmV0dXJuICdiYWQgdmFsdWVzJzsgfVxuICAgICAgICByZXR1cm4gJ25ldXRyYWwgdmFsdWVzJztcbiAgICAgIH0pO1xuXG4gICAgdmFsdWVzLnNlbGVjdCgnLmxhc3QudmFsdWUnKVxuICAgICAgLmRhdHVtKGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgICAgZCA9IGRbZC5sZW5ndGggLSAxXTtcblxuICAgICAgICByZXR1cm4gIWRcbiAgICAgICAgICA/IHNlbGYubm9uZSgpXG4gICAgICAgICAgOiBkLnk7XG4gICAgICB9KVxuICAgICAgLnRleHQodGhpcy5mdmFsdWUoKSk7XG5cbiAgICB2YWx1ZXMuc2VsZWN0KCcuc3BhcmtsaW5lJylcbiAgICAgIC5jYWxsKHRoaXMuc3BhcmtsaW5lKCkpO1xuXG4gICAgdmFsdWVzLnNlbGVjdCgnLnN1bW1hcnknKVxuICAgICAgLmNhbGwodGhpcy5zdW1tYXJ5KCkpO1xuICB9KTtcblxuXG52YXIgc3VtbWFyeSA9IHJlcXVpcmUoJy4uL3ZpZXcnKS5leHRlbmQoKVxuICAucHJvcCgnbGFzdHZhbHVlJylcblxuICAuaW5pdChmdW5jdGlvbihsYXN0dmFsdWUpIHtcbiAgICB0aGlzLmxhc3R2YWx1ZShsYXN0dmFsdWUpO1xuICB9KVxuXG4gIC5lbnRlcihmdW5jdGlvbihlbCkge1xuICAgIGVsLmFwcGVuZCgnc3BhbicpXG4gICAgICAuYXR0cignY2xhc3MnLCAnZGlmZicpO1xuXG4gICAgZWwuYXBwZW5kKCdzcGFuJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd0aW1lJyk7XG4gIH0pXG5cbiAgLmRyYXcoZnVuY3Rpb24oZWwpIHtcbiAgICB2YXIgbGFzdHZhbHVlID0gdGhpcy5sYXN0dmFsdWUoKTtcbiAgICBpZiAoZWwuZGF0dW0oKS5sZW5ndGggPCAyKSB7IHJldHVybjsgfVxuXG4gICAgZWwuc2VsZWN0KCcuZGlmZicpXG4gICAgICAuZGF0dW0oZnVuY3Rpb24oZCkge1xuICAgICAgICBkID0gZC5zbGljZSgtMik7XG4gICAgICAgIHJldHVybiBkWzFdLnkgLSBkWzBdLnk7XG4gICAgICB9KVxuICAgICAgLnRleHQobGFzdHZhbHVlLmZkaWZmKCkpO1xuXG4gICAgZWwuc2VsZWN0KCcudGltZScpXG4gICAgICAuZGF0dW0oZnVuY3Rpb24oZCkge1xuICAgICAgICBkID0gZC5zbGljZSgtMik7XG5cbiAgICAgICAgcmV0dXJuIFtkWzBdLngsIGRbMV0ueF1cbiAgICAgICAgICAubWFwKHV0aWxzLmRhdGUpXG4gICAgICAgICAgLm1hcChsYXN0dmFsdWUuZnRpbWUoKSk7XG4gICAgICB9KVxuICAgICAgLnRleHQoZnVuY3Rpb24oZCkge1xuICAgICAgICByZXR1cm4gWycgZnJvbScsIGRbMF0sICd0bycsIGRbMV1dLmpvaW4oJyAnKTtcbiAgICAgIH0pO1xuICB9KTtcblxuXG52YXIgc3BhcmtsaW5lID0gcmVxdWlyZSgnLi4vdmlldycpLmV4dGVuZCgpXG4gIC5wcm9wKCdsYXN0dmFsdWUnKVxuXG4gIC5wcm9wKCdoZWlnaHQnKS5kZWZhdWx0KDI1KVxuXG4gIC5wcm9wKCdtYXJnaW4nKS5kZWZhdWx0KHtcbiAgICB0b3A6IDQsXG4gICAgbGVmdDogNCxcbiAgICBib3R0b206IDQsXG4gICAgcmlnaHQ6IDQgXG4gIH0pXG5cbiAgLmluaXQoZnVuY3Rpb24obGFzdHZhbHVlKSB7XG4gICAgdGhpcy5sYXN0dmFsdWUobGFzdHZhbHVlKTtcbiAgfSlcblxuICAuZW50ZXIoZnVuY3Rpb24oZWwpIHtcbiAgICB2YXIgc3ZnID0gZWwuYXBwZW5kKCdzdmcnKVxuICAgICAgLmFwcGVuZCgnZycpO1xuXG4gICAgc3ZnLmFwcGVuZCgncGF0aCcpXG4gICAgICAuYXR0cignY2xhc3MnLCAncmVzdCBwYXRoJyk7XG5cbiAgICBzdmcuYXBwZW5kKCdwYXRoJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdkaWZmIHBhdGgnKTtcbiAgfSlcblxuICAuZHJhdyhmdW5jdGlvbihlbCkge1xuICAgIHZhciBtYXJnaW4gPSB0aGlzLm1hcmdpbigpO1xuICAgIHZhciB3aWR0aCA9IHBhcnNlSW50KGVsLnN0eWxlKCd3aWR0aCcpKTtcblxuICAgIHZhciBmeCA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgICAuZG9tYWluKGQzLmV4dGVudChlbC5kYXR1bSgpLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLng7IH0pKVxuICAgICAgLnJhbmdlKFswLCB3aWR0aCAtIChtYXJnaW4ubGVmdCArIG1hcmdpbi5yaWdodCldKTtcblxuICAgIHZhciBmeSA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgICAuZG9tYWluKGQzLmV4dGVudChlbC5kYXR1bSgpLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLnk7IH0pKVxuICAgICAgLnJhbmdlKFt0aGlzLmhlaWdodCgpIC0gKG1hcmdpbi50b3AgKyBtYXJnaW4uYm90dG9tKSwgMF0pO1xuXG4gICAgdmFyIGxpbmUgPSBkMy5zdmcubGluZSgpXG4gICAgICAueChmdW5jdGlvbihkKSB7IHJldHVybiBmeChkLngpOyB9KVxuICAgICAgLnkoZnVuY3Rpb24oZCkgeyByZXR1cm4gZnkoZC55KTsgfSk7XG5cbiAgICB2YXIgc3ZnID0gZWwuc2VsZWN0KCdzdmcnKVxuICAgICAgLmF0dHIoJ3dpZHRoJywgd2lkdGgpXG4gICAgICAuYXR0cignaGVpZ2h0JywgdGhpcy5oZWlnaHQoKSlcbiAgICAgIC5zZWxlY3QoJ2cnKVxuICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgdXRpbHMudHJhbnNsYXRlKG1hcmdpbi5sZWZ0LCBtYXJnaW4udG9wKSk7XG5cbiAgICBzdmcuc2VsZWN0KCcucmVzdC5wYXRoJylcbiAgICAgIC5hdHRyKCdkJywgbGluZSk7XG5cbiAgICBzdmcuc2VsZWN0KCcuZGlmZi5wYXRoJylcbiAgICAgIC5kYXR1bShmdW5jdGlvbihkKSB7IHJldHVybiBkLnNsaWNlKC0yKTsgfSlcbiAgICAgIC5hdHRyKCdkJywgbGluZSk7XG5cbiAgICB2YXIgZG90ID0gc3ZnLnNlbGVjdEFsbCgnLmRvdCcpXG4gICAgICAuZGF0YShmdW5jdGlvbihkKSB7IHJldHVybiBkLnNsaWNlKC0xKTsgfSk7XG5cbiAgICBkb3QuZW50ZXIoKS5hcHBlbmQoJ2NpcmNsZScpXG4gICAgICAuYXR0cignY2xhc3MnLCAnZG90JylcbiAgICAgIC5hdHRyKCdyJywgNCk7XG5cbiAgICBkb3RcbiAgICAgIC5hdHRyKCdjeCcsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGZ4KGQueCk7IH0pXG4gICAgICAuYXR0cignY3knLCBmdW5jdGlvbihkKSB7IHJldHVybiBmeShkLnkpOyB9KTtcblxuICAgIGRvdC5leGl0KCkucmVtb3ZlKCk7XG4gIH0pO1xuIiwidmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vd2lkZ2V0JykuZXh0ZW5kKClcbiAgLnByb3AoJ3dpZHRoJylcbiAgLmRlZmF1bHQoNjAwKVxuXG4gIC5wcm9wKCdjb2xzcGFuJylcbiAgLmRlZmF1bHQoMylcblxuICAucHJvcCgndGl0bGUnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGl0bGU7IH0pXG5cbiAgLnByb3AoJ3NldHMnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuc2V0czsgfSlcblxuICAucHJvcCgna2V5JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLmtleTsgfSlcblxuICAucHJvcCgnc2V0VGl0bGUnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGl0bGU7IH0pXG5cbiAgLnByb3AoJ3ZhbHVlcycpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC52YWx1ZXM7IH0pXG5cbiAgLnByb3AoJ3gnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueDsgfSlcblxuICAucHJvcCgneScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC55OyB9KVxuXG4gIC5wcm9wKCdmdmFsdWUnKVxuICAuZGVmYXVsdChkMy5mb3JtYXQoJywycycpKVxuXG4gIC5wcm9wKCdmdGljaycpXG4gIC5kZWZhdWx0KG51bGwpXG5cbiAgLnByb3AoJ3RpY2tzJylcbiAgLmRlZmF1bHQoNylcblxuICAucHJvcCgnY29sb3JzJylcbiAgLmRlZmF1bHQoZDMuc2NhbGUuY2F0ZWdvcnkxMCgpKVxuXG4gIC5wcm9wKCdub25lJylcbiAgLmRlZmF1bHQoMClcblxuICAucHJvcCgnY2hhcnQnKVxuICAucHJvcCgnbGVnZW5kJylcblxuICAuaW5pdChmdW5jdGlvbigpIHtcbiAgICB0aGlzLmNoYXJ0KGNoYXJ0KHRoaXMpKTtcbiAgICB0aGlzLmxlZ2VuZChsZWdlbmQodGhpcykpO1xuICB9KVxuXG4gIC5lbnRlcihmdW5jdGlvbihlbCkge1xuICAgIGVsLmF0dHIoJ2NsYXNzJywgJ2xpbmVzIHdpZGdldCcpO1xuXG4gICAgZWwuYXBwZW5kKCdkaXYnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3dpZGdldCB0aXRsZScpO1xuXG4gICAgdmFyIHZhbHVlcyA9IGVsLmFwcGVuZCgnZGl2JylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd2YWx1ZXMnKTtcblxuICAgIHZhbHVlcy5hcHBlbmQoJ2RpdicpXG4gICAgICAuYXR0cignY2xhc3MnLCAnY2hhcnQnKTtcblxuICAgIHZhbHVlcy5hcHBlbmQoJ2RpdicpXG4gICAgICAuYXR0cignY2xhc3MnLCAnbGVnZW5kJyk7XG4gIH0pXG5cbiAgLmRyYXcoZnVuY3Rpb24oZWwpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIG5vZGUgPSBlbC5ub2RlKCk7XG4gICAgdmFyIGNvbG9ycyA9IHRoaXMuY29sb3JzKCk7XG5cbiAgICBlbC5zZWxlY3QoJy53aWRnZXQudGl0bGUnKVxuICAgICAgLnRleHQoZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICByZXR1cm4gc2VsZi50aXRsZSgpLmNhbGwobm9kZSwgZCwgaSk7XG4gICAgICB9KTtcblxuICAgIHZhciBsZW47XG4gICAgdmFyIHZhbHVlcyA9IGVsLnNlbGVjdCgnLnZhbHVlcycpXG4gICAgICAuZGF0dW0oZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICBkID0gc2VsZi5zZXRzKCkuY2FsbChub2RlLCBkLCBpKTtcbiAgICAgICAgbGVuID0gZC5sZW5ndGg7XG4gICAgICAgIHJldHVybiBkLm1hcChzZXQpO1xuICAgICAgfSk7XG5cbiAgICB2YWx1ZXMuc2VsZWN0KCcuY2hhcnQnKVxuICAgICAgLmNhbGwodGhpcy5jaGFydCgpKTtcblxuICAgIHZhbHVlcy5zZWxlY3QoJy5sZWdlbmQnKVxuICAgICAgLmNhbGwodGhpcy5sZWdlbmQoKSk7XG5cbiAgICBmdW5jdGlvbiBzZXQoZCwgaSkge1xuICAgICAgdmFyIGtleSA9IHNlbGYua2V5KClcbiAgICAgICAgLmNhbGwobm9kZSwgZCwgaSlcbiAgICAgICAgLnRvU3RyaW5nKCk7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGtleToga2V5LFxuICAgICAgICBjb2xvcjogY29sb3JzKHV0aWxzLmhhc2goa2V5KSAlIGxlbiksXG4gICAgICAgIHRpdGxlOiBzZWxmLnNldFRpdGxlKCkuY2FsbChub2RlLCBkLCBpKSxcbiAgICAgICAgdmFsdWVzOiBzZWxmLnZhbHVlcygpXG4gICAgICAgICAgLmNhbGwobm9kZSwgZCwgaSlcbiAgICAgICAgICAubWFwKHZhbHVlKVxuICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB2YWx1ZShkLCBpKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB4OiBzZWxmLngoKS5jYWxsKG5vZGUsIGQsIGkpLFxuICAgICAgICB5OiBzZWxmLnkoKS5jYWxsKG5vZGUsIGQsIGkpXG4gICAgICB9O1xuICAgIH1cbiAgfSk7XG5cblxudmFyIGNoYXJ0ID0gcmVxdWlyZSgnLi4vdmlldycpLmV4dGVuZCgpXG4gIC5wcm9wKCdoZWlnaHQnKVxuICAuZGVmYXVsdCgxNTApXG5cbiAgLnByb3AoJ21hcmdpbicpXG4gIC5kZWZhdWx0KHtcbiAgICB0b3A6IDQsXG4gICAgbGVmdDogMjUsXG4gICAgcmlnaHQ6IDI1LFxuICAgIGJvdHRvbTogMjVcbiAgfSlcblxuICAucHJvcCgnd2lkZ2V0JylcblxuICAuaW5pdChmdW5jdGlvbih3aWRnZXQpIHtcbiAgICB0aGlzLndpZGdldCh3aWRnZXQpO1xuICB9KVxuXG4gIC5lbnRlcihmdW5jdGlvbihlbCkge1xuICAgIHZhciBzdmcgPSBlbC5hcHBlbmQoJ3N2ZycpXG4gICAgICAuYXBwZW5kKCdnJyk7XG5cbiAgICBzdmcuYXBwZW5kKCdnJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdsaW5lcycpO1xuXG4gICAgc3ZnLmFwcGVuZCgnZycpXG4gICAgICAuYXR0cignY2xhc3MnLCAnYXhpcycpO1xuICB9KVxuXG4gIC5kcmF3KGZ1bmN0aW9uKGVsKSB7XG4gICAgdmFyIG1hcmdpbiA9IHRoaXMubWFyZ2luKCk7XG4gICAgdmFyIHdpZHRoID0gcGFyc2VJbnQoZWwuc3R5bGUoJ3dpZHRoJykpO1xuICAgIHZhciBpbm5lckhlaWdodCA9IHRoaXMuaGVpZ2h0KCkgLSAobWFyZ2luLnRvcCArIG1hcmdpbi5ib3R0b20pO1xuXG4gICAgdmFyIGFsbFZhbHVlcyA9IGVsXG4gICAgICAuZGF0dW0oKVxuICAgICAgLnJlZHVjZShmdW5jdGlvbihyZXN1bHRzLCBzZXQpIHtcbiAgICAgICAgcmVzdWx0cy5wdXNoLmFwcGx5KHJlc3VsdHMsIHNldC52YWx1ZXMpO1xuICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICAgIH0sIFtdKTtcblxuICAgIHZhciBmeCA9IGQzLnRpbWUuc2NhbGUoKVxuICAgICAgLmRvbWFpbihkMy5leHRlbnQoYWxsVmFsdWVzLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLng7IH0pKVxuICAgICAgLnJhbmdlKFswLCB3aWR0aCAtIChtYXJnaW4ubGVmdCArIG1hcmdpbi5yaWdodCldKTtcblxuICAgIHZhciBmeSA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgICAuZG9tYWluKGQzLmV4dGVudChhbGxWYWx1ZXMsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueTsgfSkpXG4gICAgICAucmFuZ2UoW2lubmVySGVpZ2h0LCAwXSk7XG5cbiAgICB2YXIgYXhpcyA9IGQzLnN2Zy5heGlzKClcbiAgICAgIC5zY2FsZShmeClcbiAgICAgIC50aWNrcyh0aGlzLndpZGdldCgpLnRpY2tzKCkpXG4gICAgICAudGlja0Zvcm1hdCh0aGlzLndpZGdldCgpLmZ0aWNrKCkpO1xuXG4gICAgdmFyIGxpbmUgPSBkMy5zdmcubGluZSgpXG4gICAgICAueChmdW5jdGlvbihkKSB7IHJldHVybiBmeChkLngpOyB9KVxuICAgICAgLnkoZnVuY3Rpb24oZCkgeyByZXR1cm4gZnkoZC55KTsgfSk7XG5cbiAgICB2YXIgc3ZnID0gZWwuc2VsZWN0KCdzdmcnKVxuICAgICAgLmF0dHIoJ3dpZHRoJywgd2lkdGgpXG4gICAgICAuYXR0cignaGVpZ2h0JywgdGhpcy5oZWlnaHQoKSlcbiAgICAgIC5zZWxlY3QoJ2cnKVxuICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgdXRpbHMudHJhbnNsYXRlKG1hcmdpbi5sZWZ0LCBtYXJnaW4udG9wKSk7XG5cbiAgICB2YXIgc2V0ID0gc3ZnLnNlbGVjdCgnLmxpbmVzJykuc2VsZWN0QWxsKCcuc2V0JylcbiAgICAgIC5kYXRhKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQ7IH0sXG4gICAgICAgICAgICBmdW5jdGlvbihkKSB7IHJldHVybiBkLmtleTsgfSk7XG5cbiAgICBzZXQuZW50ZXIoKS5hcHBlbmQoJ2cnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3NldCcpXG4gICAgICAuYXR0cignZGF0YS1pZCcsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQua2V5OyB9KVxuICAgICAgLmFwcGVuZCgncGF0aCcpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICdsaW5lJyk7XG5cbiAgICBzZXQuc2VsZWN0KCcubGluZScpXG4gICAgICAuYXR0cignc3Ryb2tlJywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5jb2xvcjsgfSlcbiAgICAgIC5hdHRyKCdkJywgZnVuY3Rpb24oZCkgeyByZXR1cm4gbGluZShkLnZhbHVlcyk7IH0pO1xuXG4gICAgdmFyIGRvdCA9IHNldC5zZWxlY3RBbGwoJy5kb3QnKVxuICAgICAgLmRhdGEoZnVuY3Rpb24oZCkge1xuICAgICAgICBpZiAoIWQudmFsdWVzLmxlbmd0aCkgeyByZXR1cm4gW107IH1cbiAgICAgICAgdmFyIGxhc3QgPSBkLnZhbHVlc1tkLnZhbHVlcy5sZW5ndGggLSAxXTtcblxuICAgICAgICByZXR1cm4gW3tcbiAgICAgICAgICB4OiBsYXN0LngsXG4gICAgICAgICAgeTogbGFzdC55LFxuICAgICAgICAgIGNvbG9yOiBkLmNvbG9yXG4gICAgICAgIH1dO1xuICAgICAgfSk7XG5cbiAgICBkb3QuZW50ZXIoKS5hcHBlbmQoJ2NpcmNsZScpXG4gICAgICAuYXR0cignY2xhc3MnLCAnZG90JylcbiAgICAgIC5hdHRyKCdyJywgNCk7XG5cbiAgICBkb3RcbiAgICAgIC5hdHRyKCdmaWxsJywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5jb2xvcjsgfSlcbiAgICAgIC5hdHRyKCdjeCcsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGZ4KGQueCk7IH0pXG4gICAgICAuYXR0cignY3knLCBmdW5jdGlvbihkKSB7IHJldHVybiBmeShkLnkpOyB9KTtcblxuICAgIGRvdC5leGl0KClcbiAgICAgIC5yZW1vdmUoKTtcblxuICAgIHNldC5leGl0KClcbiAgICAgIC5yZW1vdmUoKTtcblxuICAgIHN2Z1xuICAgICAgLnNlbGVjdCgnLmF4aXMnKVxuICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIHV0aWxzLnRyYW5zbGF0ZSgwLCBpbm5lckhlaWdodCkpXG4gICAgICAuY2FsbChheGlzKTtcbiAgfSk7XG5cblxudmFyIGxlZ2VuZCA9IHJlcXVpcmUoJy4uL3ZpZXcnKS5leHRlbmQoKVxuICAucHJvcCgnd2lkZ2V0JylcblxuICAuaW5pdChmdW5jdGlvbih3aWRnZXQpIHtcbiAgICB0aGlzLndpZGdldCh3aWRnZXQpO1xuICB9KVxuXG4gIC5lbnRlcihmdW5jdGlvbihlbCkge1xuICAgIGVsLmFwcGVuZCgndGFibGUnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3RhYmxlJyk7XG4gIH0pXG5cbiAgLmRyYXcoZnVuY3Rpb24oZWwpIHtcbiAgICB2YXIgbm9uZSA9IHRoaXMud2lkZ2V0KCkubm9uZSgpO1xuICAgIHZhciBmdmFsdWUgPSB0aGlzLndpZGdldCgpLmZ2YWx1ZSgpO1xuXG4gICAgdmFyIHNldCA9IGVsLnNlbGVjdCgnLnRhYmxlJykuc2VsZWN0QWxsKCcuc2V0JylcbiAgICAgIC5kYXRhKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQ7IH0sXG4gICAgICAgICAgICBmdW5jdGlvbihkKSB7IHJldHVybiBkLmtleTsgfSk7XG5cbiAgICB2YXIgZW50ZXJTZXQgPSBzZXQuZW50ZXIoKS5hcHBlbmQoJ3RyJylcbiAgICAgIC5hdHRyKCdkYXRhLWlkJywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5rZXk7IH0pXG4gICAgICAuYXR0cignY2xhc3MnLCAnc2V0Jyk7XG5cbiAgICBlbnRlclNldC5hcHBlbmQoJ3RkJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdzd2F0Y2gnKTtcblxuICAgIGVudGVyU2V0LmFwcGVuZCgndGQnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3RpdGxlJyk7XG5cbiAgICBlbnRlclNldC5hcHBlbmQoJ3RkJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd2YWx1ZScpO1xuXG4gICAgc2V0LnNlbGVjdCgnLnN3YXRjaCcpXG4gICAgICAuc3R5bGUoJ2JhY2tncm91bmQnLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLmNvbG9yOyB9KTtcblxuICAgIHNldC5zZWxlY3QoJy50aXRsZScpXG4gICAgICAudGV4dChmdW5jdGlvbihkKSB7IHJldHVybiBkLnRpdGxlOyB9KTtcblxuICAgIHNldC5zZWxlY3QoJy52YWx1ZScpXG4gICAgICAudGV4dChmdW5jdGlvbihkKSB7XG4gICAgICAgIGQgPSBkLnZhbHVlc1tkLnZhbHVlcy5sZW5ndGggLSAxXTtcblxuICAgICAgICByZXR1cm4gZFxuICAgICAgICAgID8gZnZhbHVlKGQueSlcbiAgICAgICAgICA6IGZ2YWx1ZShub25lKTtcbiAgICAgIH0pO1xuXG4gICAgc2V0LmV4aXQoKVxuICAgICAgLnJlbW92ZSgpO1xuICB9KTtcbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi4vdmlldycpLmV4dGVuZCgpXG4gIC5wcm9wKCdjb2xzcGFuJylcbiAgLmRlZmF1bHQoMSlcblxuICAucHJvcCgncm93c3BhbicpXG4gIC5kZWZhdWx0KDEpXG5cbiAgLnByb3AoJ3dpZHRoJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdCgyMDApXG5cbiAgLnByb3AoJ2hlaWdodCcpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoMjAwKVxuXG4gIC5kcmF3KGZ1bmN0aW9uKGVsKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgZWwuc3R5bGUoJ3dpZHRoJywgZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICByZXR1cm4gc2VsZi53aWR0aCgpLmNhbGwodGhpcywgZCwgaSkgKyAncHgnO1xuICAgICAgfSlcbiAgICAgIC5zdHlsZSgnaGVpZ2h0JywgZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICByZXR1cm4gc2VsZi5oZWlnaHQoKS5jYWxsKHRoaXMsIGQsIGkpICsgJ3B4JztcbiAgICAgIH0pO1xuICB9KTtcbiJdfQ==
(3)
});
