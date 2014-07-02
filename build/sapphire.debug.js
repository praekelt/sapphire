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
  .set(d3.functor)
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
    var node = el.node();

    var grid = layout()
      .scale(100)
      .numcols(this.numcols())
      .padding(this.padding())
      .col(function(d) { return d.col; })
      .row(function(d) { return d.row; })
      .colspan(function(d) { return d.colspan; })
      .rowspan(function(d) { return d.rowspan; });

    var widget = el.select('.widgets').selectAll('.widget')
      .data(function(d, i) {
        return self.widgets()
          .call(node, d, i)
          .map(widgetData);
      });

    widget.enter().append('div')
      .attr('class', 'widget');

    var gridEls = grid(widget.data());

    widget
      .attr('data-key', function(d) { return d.key; })
      .each(function(d, i) {
        var gridEl = gridEls[i];

        d3.select(this)
          .datum(d.data)
          .call(d.type)
          .style('left', gridEl.x + 'px')
          .style('top', gridEl.y + 'px')
          .style('width', gridEl.width + 'px')
          .style('height', gridEl.height + 'px');
      });

    widget.exit().remove();

    function widgetData(d, i) {
      var typename = self.type().call(node, d, i);
      var type = self.types().get(typename);

      if (!type) {
        throw new Error("Unrecognised dashboard widget type '" + typename + "'");
      }

      var result = {};
      result.data = d;
      result.type = type;
      result.key = self.key().call(node, d, i);
      result.col = self.col().call(node, d, i);
      result.row = self.row().call(node, d, i);
      result.colspan = self.colspan().call(node, d, i);
      result.colspan = utils.ensure(result.colspan, type.colspan());
      result.rowspan = self.rowspan().call(node, d, i);
      result.rowspan = utils.ensure(result.rowspan, type.rowspan());
      return result;
    }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy9kYXNoYm9hcmQuanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvZ3JpZC5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy9pbmRleC5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy91dGlscy5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy92aWV3LmpzIiwiL2hvbWUvanVzdGluL3ByYWVrZWx0L3NhcHBoaXJlL3NyYy9zY3JpcHRzL3dpZGdldHMvaW5kZXguanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvd2lkZ2V0cy9sYXN0dmFsdWUuanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvd2lkZ2V0cy9saW5lcy5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy93aWRnZXRzL3dpZGdldC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaFNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcbnZhciBsYXlvdXQgPSByZXF1aXJlKCcuL2dyaWQnKTtcbnZhciB3aWRnZXRzID0gcmVxdWlyZSgnLi93aWRnZXRzJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL3ZpZXcnKS5leHRlbmQoKVxuICAucHJvcCgndHlwZXMnKVxuXG4gIC5wcm9wKCd0aXRsZScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50aXRsZTsgfSlcblxuICAucHJvcCgna2V5JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkLCBpKSB7XG4gICAgcmV0dXJuICdrZXknIGluIGRcbiAgICAgID8gZC5rZXlcbiAgICAgIDogaTtcbiAgfSlcblxuICAucHJvcCgndHlwZScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50eXBlOyB9KVxuXG4gIC5wcm9wKCd3aWRnZXRzJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLndpZGdldHM7IH0pXG5cbiAgLnByb3AoJ2NvbCcpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkge1xuICAgIHJldHVybiB1dGlscy5hY2Nlc3MoZCwgJ2NvbCcpO1xuICB9KVxuXG4gIC5wcm9wKCdyb3cnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHtcbiAgICByZXR1cm4gdXRpbHMuYWNjZXNzKGQsICdyb3cnKTtcbiAgfSlcblxuICAucHJvcCgnY29sc3BhbicpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkge1xuICAgIHJldHVybiB1dGlscy5hY2Nlc3MoZCwgJ2NvbHNwYW4nKTtcbiAgfSlcblxuICAucHJvcCgncm93c3BhbicpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkge1xuICAgIHJldHVybiB1dGlscy5hY2Nlc3MoZCwgJ3Jvd3NwYW4nKTtcbiAgfSlcblxuICAucHJvcCgnbnVtY29scycpXG4gIC5kZWZhdWx0KDgpXG5cbiAgLnByb3AoJ3BhZGRpbmcnKVxuICAuZGVmYXVsdCg1KVxuXG4gIC5pbml0KGZ1bmN0aW9uKCkge1xuICAgIHZhciB0eXBlcyA9IGQzLm1hcCgpO1xuXG4gICAgZDMua2V5cyh3aWRnZXRzKS5mb3JFYWNoKGZ1bmN0aW9uKGspIHtcbiAgICAgIHR5cGVzLnNldChrLCB3aWRnZXRzW2tdLm5ldygpKTtcbiAgICB9KTtcblxuICAgIHRoaXMudHlwZXModHlwZXMpO1xuICB9KVxuXG4gIC5lbnRlcihmdW5jdGlvbihlbCkge1xuICAgIGVsLmF0dHIoJ2NsYXNzJywgJ2Rhc2hib2FyZCcpXG4gICAgICAuYXBwZW5kKCdkaXYnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnd2lkZ2V0cycpO1xuICB9KVxuXG4gIC5kcmF3KGZ1bmN0aW9uKGVsKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBub2RlID0gZWwubm9kZSgpO1xuXG4gICAgdmFyIGdyaWQgPSBsYXlvdXQoKVxuICAgICAgLnNjYWxlKDEwMClcbiAgICAgIC5udW1jb2xzKHRoaXMubnVtY29scygpKVxuICAgICAgLnBhZGRpbmcodGhpcy5wYWRkaW5nKCkpXG4gICAgICAuY29sKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuY29sOyB9KVxuICAgICAgLnJvdyhmdW5jdGlvbihkKSB7IHJldHVybiBkLnJvdzsgfSlcbiAgICAgIC5jb2xzcGFuKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuY29sc3BhbjsgfSlcbiAgICAgIC5yb3dzcGFuKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQucm93c3BhbjsgfSk7XG5cbiAgICB2YXIgd2lkZ2V0ID0gZWwuc2VsZWN0KCcud2lkZ2V0cycpLnNlbGVjdEFsbCgnLndpZGdldCcpXG4gICAgICAuZGF0YShmdW5jdGlvbihkLCBpKSB7XG4gICAgICAgIHJldHVybiBzZWxmLndpZGdldHMoKVxuICAgICAgICAgIC5jYWxsKG5vZGUsIGQsIGkpXG4gICAgICAgICAgLm1hcCh3aWRnZXREYXRhKTtcbiAgICAgIH0pO1xuXG4gICAgd2lkZ2V0LmVudGVyKCkuYXBwZW5kKCdkaXYnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3dpZGdldCcpO1xuXG4gICAgdmFyIGdyaWRFbHMgPSBncmlkKHdpZGdldC5kYXRhKCkpO1xuXG4gICAgd2lkZ2V0XG4gICAgICAuYXR0cignZGF0YS1rZXknLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLmtleTsgfSlcbiAgICAgIC5lYWNoKGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgICAgdmFyIGdyaWRFbCA9IGdyaWRFbHNbaV07XG5cbiAgICAgICAgZDMuc2VsZWN0KHRoaXMpXG4gICAgICAgICAgLmRhdHVtKGQuZGF0YSlcbiAgICAgICAgICAuY2FsbChkLnR5cGUpXG4gICAgICAgICAgLnN0eWxlKCdsZWZ0JywgZ3JpZEVsLnggKyAncHgnKVxuICAgICAgICAgIC5zdHlsZSgndG9wJywgZ3JpZEVsLnkgKyAncHgnKVxuICAgICAgICAgIC5zdHlsZSgnd2lkdGgnLCBncmlkRWwud2lkdGggKyAncHgnKVxuICAgICAgICAgIC5zdHlsZSgnaGVpZ2h0JywgZ3JpZEVsLmhlaWdodCArICdweCcpO1xuICAgICAgfSk7XG5cbiAgICB3aWRnZXQuZXhpdCgpLnJlbW92ZSgpO1xuXG4gICAgZnVuY3Rpb24gd2lkZ2V0RGF0YShkLCBpKSB7XG4gICAgICB2YXIgdHlwZW5hbWUgPSBzZWxmLnR5cGUoKS5jYWxsKG5vZGUsIGQsIGkpO1xuICAgICAgdmFyIHR5cGUgPSBzZWxmLnR5cGVzKCkuZ2V0KHR5cGVuYW1lKTtcblxuICAgICAgaWYgKCF0eXBlKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVucmVjb2duaXNlZCBkYXNoYm9hcmQgd2lkZ2V0IHR5cGUgJ1wiICsgdHlwZW5hbWUgKyBcIidcIik7XG4gICAgICB9XG5cbiAgICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICAgIHJlc3VsdC5kYXRhID0gZDtcbiAgICAgIHJlc3VsdC50eXBlID0gdHlwZTtcbiAgICAgIHJlc3VsdC5rZXkgPSBzZWxmLmtleSgpLmNhbGwobm9kZSwgZCwgaSk7XG4gICAgICByZXN1bHQuY29sID0gc2VsZi5jb2woKS5jYWxsKG5vZGUsIGQsIGkpO1xuICAgICAgcmVzdWx0LnJvdyA9IHNlbGYucm93KCkuY2FsbChub2RlLCBkLCBpKTtcbiAgICAgIHJlc3VsdC5jb2xzcGFuID0gc2VsZi5jb2xzcGFuKCkuY2FsbChub2RlLCBkLCBpKTtcbiAgICAgIHJlc3VsdC5jb2xzcGFuID0gdXRpbHMuZW5zdXJlKHJlc3VsdC5jb2xzcGFuLCB0eXBlLmNvbHNwYW4oKSk7XG4gICAgICByZXN1bHQucm93c3BhbiA9IHNlbGYucm93c3BhbigpLmNhbGwobm9kZSwgZCwgaSk7XG4gICAgICByZXN1bHQucm93c3BhbiA9IHV0aWxzLmVuc3VyZShyZXN1bHQucm93c3BhbiwgdHlwZS5yb3dzcGFuKCkpO1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gIH0pO1xuIiwidmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xuXG5cbnZhciBncmlkID0gbW9kdWxlLmV4cG9ydHMgPSBzdHJhaW4oKVxuICAucHJvcCgnY29sJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7XG4gICAgcmV0dXJuIHV0aWxzLmFjY2VzcyhkLCAnY29sJyk7XG4gIH0pXG5cbiAgLnByb3AoJ3JvdycpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkge1xuICAgIHJldHVybiB1dGlscy5hY2Nlc3MoZCwgJ3JvdycpO1xuICB9KVxuXG4gIC5wcm9wKCdudW1jb2xzJylcbiAgLmRlZmF1bHQoOClcblxuICAucHJvcCgnc2NhbGUnKVxuICAuZGVmYXVsdCgxMClcblxuICAucHJvcCgncGFkZGluZycpXG4gIC5kZWZhdWx0KDUpXG5cbiAgLnByb3AoJ2NvbHNwYW4nKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHtcbiAgICByZXR1cm4gdXRpbHMuYWNjZXNzKGQsICdjb2xzcGFuJywgMSk7XG4gIH0pXG5cbiAgLnByb3AoJ3Jvd3NwYW4nKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHtcbiAgICByZXR1cm4gdXRpbHMuYWNjZXNzKGQsICdyb3dzcGFuJywgMSk7XG4gIH0pXG5cbiAgLmludm9rZShmdW5jdGlvbihkYXRhKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBiZXN0ID0gY291bnRlcigpLm51bWNvbHModGhpcy5udW1jb2xzKCkpO1xuXG4gICAgZGF0YSA9IChkYXRhIHx8IFtdKS5tYXAoZnVuY3Rpb24oZCwgaSkge1xuICAgICAgZCA9IHtcbiAgICAgICAgZGF0YTogZCxcbiAgICAgICAgY29sOiB1dGlscy5lbnN1cmUoc2VsZi5jb2woKS5jYWxsKHNlbGYsIGQsIGkpLCBiZXN0LmNvbCgpKSwgXG4gICAgICAgIHJvdzogdXRpbHMuZW5zdXJlKHNlbGYucm93KCkuY2FsbChzZWxmLCBkLCBpKSwgYmVzdC5yb3coKSksXG4gICAgICAgIHJvd3NwYW46IHNlbGYucm93c3BhbigpLmNhbGwoc2VsZiwgZCwgaSksXG4gICAgICAgIGNvbHNwYW46IHNlbGYuY29sc3BhbigpLmNhbGwoc2VsZiwgZCwgaSlcbiAgICAgIH07XG5cbiAgICAgIGJlc3QuaW5jKGQpO1xuICAgICAgcmV0dXJuIGQ7XG4gICAgfSk7XG5cbiAgICB2YXIgcXVhZHRyZWUgPSBkMy5nZW9tLnF1YWR0cmVlKClcbiAgICAgIC54KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuY29sOyB9KVxuICAgICAgLnkoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5yb3c7IH0pO1xuXG4gICAgdmFyIHJvb3QgPSBxdWFkdHJlZShkYXRhKTtcbiAgICB2YXIgZGJsUGFkZGluZyA9IHRoaXMucGFkZGluZygpICogMjtcblxuICAgIGRhdGEuZm9yRWFjaChmdW5jdGlvbihkKSB7XG4gICAgICByb290LnZpc2l0KGdyaWQudW5jb2xsaWRlKGQpKTtcbiAgICAgIGQueCA9IChkLmNvbCAqIHNlbGYuc2NhbGUoKSkgKyBzZWxmLnBhZGRpbmcoKTtcbiAgICAgIGQueSA9IChkLnJvdyAqIHNlbGYuc2NhbGUoKSkgKyBzZWxmLnBhZGRpbmcoKTtcbiAgICAgIGQud2lkdGggPSAoZC5jb2xzcGFuICogc2VsZi5zY2FsZSgpKSAtIGRibFBhZGRpbmc7XG4gICAgICBkLmhlaWdodCA9IChkLnJvd3NwYW4gKiBzZWxmLnNjYWxlKCkpIC0gZGJsUGFkZGluZztcbiAgICB9KTtcblxuICAgIHJldHVybiBkYXRhO1xuICB9KVxuXG4gIC5zdGF0aWMoZnVuY3Rpb24gYm94KGQpIHtcbiAgICByZXR1cm4ge1xuICAgICAgeDE6IGQuY29sLFxuICAgICAgeDI6IGQuY29sICsgZC5jb2xzcGFuIC0gMSxcbiAgICAgIHkxOiBkLnJvdyxcbiAgICAgIHkyOiBkLnJvdyArIGQucm93c3BhbiAtIDFcbiAgICB9O1xuICB9KVxuXG4gIC5zdGF0aWMoZnVuY3Rpb24gdW5jb2xsaWRlKGEpIHtcbiAgICB2YXIgYm94QSA9IGdyaWQuYm94KGEpO1xuICAgIFxuICAgIHJldHVybiBmdW5jdGlvbihub2RlLCB4MSwgeTEsIHgyLCB5Mikge1xuICAgICAgdmFyIGIgPSBub2RlLnBvaW50O1xuXG4gICAgICBpZiAoYiAmJiBhICE9PSBiICYmIGdyaWQuaW50ZXJzZWN0aW9uKGJveEEsIGdyaWQuYm94KGIpKSkge1xuICAgICAgICBiLnJvdyA9IGJveEEueTIgKyAxO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gIWdyaWQuaW50ZXJzZWN0aW9uKGJveEEsIHtcbiAgICAgICAgeDE6IHgxLCBcbiAgICAgICAgeTE6IHkxLCBcbiAgICAgICAgeDI6IHgyLFxuICAgICAgICB5MjogeTJcbiAgICAgIH0pO1xuICAgIH07XG4gIH0pXG5cbiAgLnN0YXRpYyhmdW5jdGlvbiBpbnRlcnNlY3Rpb24oYSwgYikge1xuICAgIHJldHVybiAoKGEueDEgPD0gYi54MSAmJiBiLngxIDw9IGEueDIpICYmIChhLnkxIDw9IGIueTEgJiYgYi55MSA8PSBhLnkyKSlcbiAgICAgICAgfHwgKChiLngxIDw9IGEueDEgJiYgYS54MSA8PSBiLngyKSAmJiAoYi55MSA8PSBhLnkxICYmIGEueTEgPD0gYi55MikpXG4gICAgICAgIHx8ICgoYS54MSA8PSBiLngyICYmIGIueDIgPD0gYS54MikgJiYgKGEueTEgPD0gYi55MSAmJiBiLnkxIDw9IGEueTIpKVxuICAgICAgICB8fCAoKGIueDEgPD0gYS54MiAmJiBhLngyIDw9IGIueDIpICYmIChiLnkxIDw9IGEueTEgJiYgYS55MSA8PSBiLnkyKSk7XG4gIH0pO1xuXG5cbnZhciBjb3VudGVyID0gc3RyYWluKClcbiAgLnByb3AoJ251bWNvbHMnKVxuXG4gIC5wcm9wKCdyb3dzcGFuJylcbiAgLmRlZmF1bHQoMClcblxuICAucHJvcCgnY29sJylcbiAgLmRlZmF1bHQoMClcblxuICAucHJvcCgncm93JylcbiAgLmRlZmF1bHQoMClcblxuICAubWV0aChmdW5jdGlvbiBpbmMoZCkge1xuICAgIHZhciBjb2wgPSBkLmNvbCArIGQuY29sc3BhbjtcbiAgICB2YXIgcm93ID0gdGhpcy5yb3coKTtcblxuICAgIGlmIChjb2wgPj0gdGhpcy5udW1jb2xzKCkpIHtcbiAgICAgIGNvbCA9IDA7XG4gICAgICByb3cgKz0gdGhpcy5yb3dzcGFuKCk7XG4gICAgICB0aGlzLnJvd3NwYW4oMCk7XG4gICAgfVxuXG4gICAgdGhpc1xuICAgICAgLmNvbChjb2wpXG4gICAgICAucm93KHJvdylcbiAgICAgIC5yb3dzcGFuKE1hdGgubWF4KHRoaXMucm93c3BhbigpLCBkLnJvd3NwYW4pKTtcbiAgfSk7XG4iLCJleHBvcnRzLnV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xuZXhwb3J0cy52aWV3ID0gcmVxdWlyZSgnLi92aWV3Jyk7XG5leHBvcnRzLmdyaWQgPSByZXF1aXJlKCcuL2dyaWQnKTtcbmV4cG9ydHMud2lkZ2V0cyA9IHJlcXVpcmUoJy4vd2lkZ2V0cycpO1xuZXhwb3J0cy5kYXNoYm9hcmQgPSByZXF1aXJlKCcuL2Rhc2hib2FyZCcpO1xuIiwidmFyIHV0aWxzID0gZXhwb3J0cztcblxuXG51dGlscy5hY2Nlc3MgPSBmdW5jdGlvbihkLCBuYW1lLCBkZWZhdWx0dmFsKSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoIDwgMykge1xuICAgIGRlZmF1bHR2YWwgPSBudWxsO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBkICE9ICdvYmplY3QnKSB7XG4gICAgcmV0dXJuIGRlZmF1bHR2YWw7XG4gIH1cblxuICB2YXIgdmFsID0gZFtuYW1lXTtcbiAgcmV0dXJuIHR5cGVvZiB2YWwgPT0gJ3VuZGVmaW5lZCdcbiAgICA/IGRlZmF1bHR2YWxcbiAgICA6IHZhbDtcbn07XG5cblxudXRpbHMuZW5zdXJlID0gZnVuY3Rpb24odiwgZGVmYXVsdHZhbCkge1xuICByZXR1cm4gdiA9PT0gbnVsbCB8fCB0eXBlb2YgdiA9PSAndW5kZWZpbmVkJ1xuICAgID8gZGVmYXVsdHZhbFxuICAgIDogdjtcbn07XG5cblxudXRpbHMudHJhbnNsYXRlID0gZnVuY3Rpb24oeCwgeSkge1xuICByZXR1cm4gJ3RyYW5zbGF0ZSgnICsgeCArICcsICcgKyB5ICsgJyknO1xufTtcblxuXG51dGlscy5lbnN1cmVFbCA9IGZ1bmN0aW9uKGVsKSB7XG4gIHJldHVybiAhKGVsIGluc3RhbmNlb2YgZDMuc2VsZWN0aW9uKVxuICAgID8gZDMuc2VsZWN0KGVsKVxuICAgIDogZWw7XG59O1xuXG5cbnV0aWxzLmRhdGUgPSBmdW5jdGlvbih0KSB7XG4gIHJldHVybiBuZXcgRGF0ZSh0KTtcbn07XG5cblxuLy8gYWRhcHRlZCBmcm9tIGh0dHA6Ly9lcmx5Y29kZXIuY29tLzQ5L2phdmFzY3JpcHQtaGFzaC1mdW5jdGlvbnMtdG8tXG4vLyBjb252ZXJ0LXN0cmluZy1pbnRvLWludGVnZXItaGFzaC1cbnV0aWxzLmhhc2ggPSBmdW5jdGlvbihzKSB7XG4gIHZhciByZXN1bHQgPSAwO1xuICB2YXIgYztcblxuICBmb3IgKGkgPSAwOyBpIDwgcy5sZW5ndGg7IGkrKykge1xuICAgICAgYyA9IHMuY2hhckNvZGVBdChpKTtcbiAgICAgIHJlc3VsdCA9ICgocmVzdWx0IDw8IDUpIC0gcmVzdWx0KSArIGM7XG4gICAgICByZXN1bHQgPSByZXN1bHQgJiByZXN1bHQ7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gc3RyYWluKClcbiAgLnN0YXRpYyhmdW5jdGlvbiBkcmF3KGZuKSB7XG4gICAgdGhpcy5tZXRoKCdfZHJhd18nLCBmbik7XG4gIH0pXG4gIC5kcmF3KGZ1bmN0aW9uKCkge30pXG5cbiAgLnN0YXRpYyhmdW5jdGlvbiBlbnRlcihmbikge1xuICAgIHRoaXMubWV0aCgnX2VudGVyXycsIGZuKTtcbiAgfSlcbiAgLmVudGVyKGZ1bmN0aW9uKCkge30pXG5cbiAgLm1ldGgoZnVuY3Rpb24gZHJhdyhlbCkge1xuICAgIGVsID0gc2FwcGhpcmUudXRpbHMuZW5zdXJlRWwoZWwpO1xuXG4gICAgaWYgKGVsLm5vZGUoKSAmJiAhZWwubm9kZSgpLmhhc0NoaWxkTm9kZXMoKSkge1xuICAgICAgdGhpcy5lbnRlcihlbCk7XG4gICAgfVxuXG4gICAgdmFyIHBhcmVudCA9IHRoaXMuX3R5cGVfLl9zdXBlcl8ucHJvdG90eXBlO1xuICAgIGlmICgnX2RyYXdfJyBpbiBwYXJlbnQpIHtcbiAgICAgIHBhcmVudC5fZHJhd18uY2FsbCh0aGlzLCBlbCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX2RyYXdfKGVsKTtcbiAgfSlcblxuICAubWV0aChmdW5jdGlvbiBlbnRlcihlbCkge1xuICAgIGVsID0gc2FwcGhpcmUudXRpbHMuZW5zdXJlRWwoZWwpO1xuXG4gICAgdmFyIHBhcmVudCA9IHRoaXMuX3R5cGVfLl9zdXBlcl8ucHJvdG90eXBlO1xuICAgIGlmICgnX2VudGVyXycgaW4gcGFyZW50KSB7XG4gICAgICBwYXJlbnQuX2VudGVyXy5jYWxsKHRoaXMsIGVsKTtcbiAgICB9XG5cbiAgICB0aGlzLl9lbnRlcl8oZWwpO1xuICB9KVxuXG4gIC5pbnZva2UoZnVuY3Rpb24oZWwpIHtcbiAgICByZXR1cm4gdGhpcy5kcmF3KGVsKTtcbiAgfSk7XG4iLCJleHBvcnRzLndpZGdldCA9IHJlcXVpcmUoJy4vd2lkZ2V0Jyk7XG5leHBvcnRzLmxpbmVzID0gcmVxdWlyZSgnLi9saW5lcycpO1xuZXhwb3J0cy5sYXN0dmFsdWUgPSByZXF1aXJlKCcuL2xhc3R2YWx1ZScpO1xuIiwidmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vd2lkZ2V0JykuZXh0ZW5kKClcbiAgLnByb3AoJ3dpZHRoJylcbiAgLmRlZmF1bHQoNDAwKVxuXG4gIC5wcm9wKCdjb2xzcGFuJylcbiAgLmRlZmF1bHQoMilcblxuICAucHJvcCgndGl0bGUnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGl0bGU7IH0pXG5cbiAgLnByb3AoJ3ZhbHVlcycpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC52YWx1ZXM7IH0pXG5cbiAgLnByb3AoJ3gnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueDsgfSlcblxuICAucHJvcCgneScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC55OyB9KVxuXG4gIC5wcm9wKCdmdmFsdWUnKVxuICAuZGVmYXVsdChkMy5mb3JtYXQoJywycycpKVxuXG4gIC5wcm9wKCdmZGlmZicpXG4gIC5kZWZhdWx0KGQzLmZvcm1hdCgnKywycycpKVxuXG4gIC5wcm9wKCdmdGltZScpXG4gIC5kZWZhdWx0KGQzLnRpbWUuZm9ybWF0KCclLWQgJWIgJS1IOiVNJykpXG5cbiAgLnByb3AoJ25vbmUnKVxuICAuZGVmYXVsdCgwKVxuXG4gIC5wcm9wKCdzcGFya2xpbmUnKVxuICAucHJvcCgnc3VtbWFyeScpXG5cbiAgLmluaXQoZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zcGFya2xpbmUoc3BhcmtsaW5lKHRoaXMpKTtcbiAgICB0aGlzLnN1bW1hcnkoc3VtbWFyeSh0aGlzKSk7XG4gIH0pXG5cbiAgLmVudGVyKGZ1bmN0aW9uKGVsKSB7XG4gICAgZWwuYXR0cignY2xhc3MnLCAnbGFzdHZhbHVlIHdpZGdldCcpO1xuXG4gICAgZWwuYXBwZW5kKCdkaXYnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3RpdGxlJyk7XG5cbiAgICB2YXIgdmFsdWVzID0gZWwuYXBwZW5kKCdkaXYnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3ZhbHVlcycpO1xuXG4gICAgdmFsdWVzLmFwcGVuZCgnZGl2JylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdsYXN0IHZhbHVlJyk7XG5cbiAgICB2YWx1ZXMuYXBwZW5kKCdkaXYnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3NwYXJrbGluZScpO1xuXG4gICAgdmFsdWVzLmFwcGVuZCgnZGl2JylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdzdW1tYXJ5Jyk7XG4gIH0pXG5cbiAgLmRyYXcoZnVuY3Rpb24oZWwpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIG5vZGUgPSBlbC5ub2RlKCk7XG5cbiAgICBlbC5zZWxlY3QoJy50aXRsZScpXG4gICAgICAudGV4dChmdW5jdGlvbihkLCBpKSB7XG4gICAgICAgIHJldHVybiBzZWxmLnRpdGxlKCkuY2FsbChub2RlLCBkLCBpKTtcbiAgICAgIH0pO1xuXG4gICAgdmFyIHZhbHVlcyA9IGVsLnNlbGVjdCgnLnZhbHVlcycpXG4gICAgICAuZGF0dW0oZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICByZXR1cm4gc2VsZi52YWx1ZXMoKVxuICAgICAgICAgIC5jYWxsKG5vZGUsIGQsIGkpXG4gICAgICAgICAgLm1hcChmdW5jdGlvbihkLCBpKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICB4OiBzZWxmLngoKS5jYWxsKG5vZGUsIGQsIGkpLFxuICAgICAgICAgICAgICB5OiBzZWxmLnkoKS5jYWxsKG5vZGUsIGQsIGkpXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH0pO1xuICAgICAgfSlcbiAgICAgIC5hdHRyKCdjbGFzcycsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgZCA9IGQuc2xpY2UoLTIpO1xuXG4gICAgICAgIGQgPSBkLmxlbmd0aCA+IDFcbiAgICAgICAgICA/IGRbMV0ueSAtIGRbMF0ueVxuICAgICAgICAgIDogMDtcblxuICAgICAgICBpZiAoZCA+IDApIHsgcmV0dXJuICdnb29kIHZhbHVlcyc7IH1cbiAgICAgICAgaWYgKGQgPCAwKSB7IHJldHVybiAnYmFkIHZhbHVlcyc7IH1cbiAgICAgICAgcmV0dXJuICduZXV0cmFsIHZhbHVlcyc7XG4gICAgICB9KTtcblxuICAgIHZhbHVlcy5zZWxlY3QoJy5sYXN0LnZhbHVlJylcbiAgICAgIC5kYXR1bShmdW5jdGlvbihkLCBpKSB7XG4gICAgICAgIGQgPSBkW2QubGVuZ3RoIC0gMV07XG5cbiAgICAgICAgcmV0dXJuICFkXG4gICAgICAgICAgPyBzZWxmLm5vbmUoKVxuICAgICAgICAgIDogZC55O1xuICAgICAgfSlcbiAgICAgIC50ZXh0KHRoaXMuZnZhbHVlKCkpO1xuXG4gICAgdmFsdWVzLnNlbGVjdCgnLnNwYXJrbGluZScpXG4gICAgICAuY2FsbCh0aGlzLnNwYXJrbGluZSgpKTtcblxuICAgIHZhbHVlcy5zZWxlY3QoJy5zdW1tYXJ5JylcbiAgICAgIC5jYWxsKHRoaXMuc3VtbWFyeSgpKTtcbiAgfSk7XG5cblxudmFyIHN1bW1hcnkgPSByZXF1aXJlKCcuLi92aWV3JykuZXh0ZW5kKClcbiAgLnByb3AoJ2xhc3R2YWx1ZScpXG5cbiAgLmluaXQoZnVuY3Rpb24obGFzdHZhbHVlKSB7XG4gICAgdGhpcy5sYXN0dmFsdWUobGFzdHZhbHVlKTtcbiAgfSlcblxuICAuZW50ZXIoZnVuY3Rpb24oZWwpIHtcbiAgICBlbC5hcHBlbmQoJ3NwYW4nKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ2RpZmYnKTtcblxuICAgIGVsLmFwcGVuZCgnc3BhbicpXG4gICAgICAuYXR0cignY2xhc3MnLCAndGltZScpO1xuICB9KVxuXG4gIC5kcmF3KGZ1bmN0aW9uKGVsKSB7XG4gICAgdmFyIGxhc3R2YWx1ZSA9IHRoaXMubGFzdHZhbHVlKCk7XG4gICAgaWYgKGVsLmRhdHVtKCkubGVuZ3RoIDwgMikgeyByZXR1cm47IH1cblxuICAgIGVsLnNlbGVjdCgnLmRpZmYnKVxuICAgICAgLmRhdHVtKGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgZCA9IGQuc2xpY2UoLTIpO1xuICAgICAgICByZXR1cm4gZFsxXS55IC0gZFswXS55O1xuICAgICAgfSlcbiAgICAgIC50ZXh0KGxhc3R2YWx1ZS5mZGlmZigpKTtcblxuICAgIGVsLnNlbGVjdCgnLnRpbWUnKVxuICAgICAgLmRhdHVtKGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgZCA9IGQuc2xpY2UoLTIpO1xuXG4gICAgICAgIHJldHVybiBbZFswXS54LCBkWzFdLnhdXG4gICAgICAgICAgLm1hcCh1dGlscy5kYXRlKVxuICAgICAgICAgIC5tYXAobGFzdHZhbHVlLmZ0aW1lKCkpO1xuICAgICAgfSlcbiAgICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuIFsnIGZyb20nLCBkWzBdLCAndG8nLCBkWzFdXS5qb2luKCcgJyk7XG4gICAgICB9KTtcbiAgfSk7XG5cblxudmFyIHNwYXJrbGluZSA9IHJlcXVpcmUoJy4uL3ZpZXcnKS5leHRlbmQoKVxuICAucHJvcCgnbGFzdHZhbHVlJylcblxuICAucHJvcCgnaGVpZ2h0JykuZGVmYXVsdCgyNSlcblxuICAucHJvcCgnbWFyZ2luJykuZGVmYXVsdCh7XG4gICAgdG9wOiA0LFxuICAgIGxlZnQ6IDQsXG4gICAgYm90dG9tOiA0LFxuICAgIHJpZ2h0OiA0IFxuICB9KVxuXG4gIC5pbml0KGZ1bmN0aW9uKGxhc3R2YWx1ZSkge1xuICAgIHRoaXMubGFzdHZhbHVlKGxhc3R2YWx1ZSk7XG4gIH0pXG5cbiAgLmVudGVyKGZ1bmN0aW9uKGVsKSB7XG4gICAgdmFyIHN2ZyA9IGVsLmFwcGVuZCgnc3ZnJylcbiAgICAgIC5hcHBlbmQoJ2cnKTtcblxuICAgIHN2Zy5hcHBlbmQoJ3BhdGgnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3Jlc3QgcGF0aCcpO1xuXG4gICAgc3ZnLmFwcGVuZCgncGF0aCcpXG4gICAgICAuYXR0cignY2xhc3MnLCAnZGlmZiBwYXRoJyk7XG4gIH0pXG5cbiAgLmRyYXcoZnVuY3Rpb24oZWwpIHtcbiAgICB2YXIgbWFyZ2luID0gdGhpcy5tYXJnaW4oKTtcbiAgICB2YXIgd2lkdGggPSBwYXJzZUludChlbC5zdHlsZSgnd2lkdGgnKSk7XG5cbiAgICB2YXIgZnggPSBkMy5zY2FsZS5saW5lYXIoKVxuICAgICAgLmRvbWFpbihkMy5leHRlbnQoZWwuZGF0dW0oKSwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC54OyB9KSlcbiAgICAgIC5yYW5nZShbMCwgd2lkdGggLSAobWFyZ2luLmxlZnQgKyBtYXJnaW4ucmlnaHQpXSk7XG5cbiAgICB2YXIgZnkgPSBkMy5zY2FsZS5saW5lYXIoKVxuICAgICAgLmRvbWFpbihkMy5leHRlbnQoZWwuZGF0dW0oKSwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC55OyB9KSlcbiAgICAgIC5yYW5nZShbdGhpcy5oZWlnaHQoKSAtIChtYXJnaW4udG9wICsgbWFyZ2luLmJvdHRvbSksIDBdKTtcblxuICAgIHZhciBsaW5lID0gZDMuc3ZnLmxpbmUoKVxuICAgICAgLngoZnVuY3Rpb24oZCkgeyByZXR1cm4gZngoZC54KTsgfSlcbiAgICAgIC55KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGZ5KGQueSk7IH0pO1xuXG4gICAgdmFyIHN2ZyA9IGVsLnNlbGVjdCgnc3ZnJylcbiAgICAgIC5hdHRyKCd3aWR0aCcsIHdpZHRoKVxuICAgICAgLmF0dHIoJ2hlaWdodCcsIHRoaXMuaGVpZ2h0KCkpXG4gICAgICAuc2VsZWN0KCdnJylcbiAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIHV0aWxzLnRyYW5zbGF0ZShtYXJnaW4ubGVmdCwgbWFyZ2luLnRvcCkpO1xuXG4gICAgc3ZnLnNlbGVjdCgnLnJlc3QucGF0aCcpXG4gICAgICAuYXR0cignZCcsIGxpbmUpO1xuXG4gICAgc3ZnLnNlbGVjdCgnLmRpZmYucGF0aCcpXG4gICAgICAuZGF0dW0oZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5zbGljZSgtMik7IH0pXG4gICAgICAuYXR0cignZCcsIGxpbmUpO1xuXG4gICAgdmFyIGRvdCA9IHN2Zy5zZWxlY3RBbGwoJy5kb3QnKVxuICAgICAgLmRhdGEoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5zbGljZSgtMSk7IH0pO1xuXG4gICAgZG90LmVudGVyKCkuYXBwZW5kKCdjaXJjbGUnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ2RvdCcpXG4gICAgICAuYXR0cigncicsIDQpO1xuXG4gICAgZG90XG4gICAgICAuYXR0cignY3gnLCBmdW5jdGlvbihkKSB7IHJldHVybiBmeChkLngpOyB9KVxuICAgICAgLmF0dHIoJ2N5JywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZnkoZC55KTsgfSk7XG5cbiAgICBkb3QuZXhpdCgpLnJlbW92ZSgpO1xuICB9KTtcbiIsInZhciB1dGlscyA9IHJlcXVpcmUoJy4uL3V0aWxzJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL3dpZGdldCcpLmV4dGVuZCgpXG4gIC5wcm9wKCd3aWR0aCcpXG4gIC5kZWZhdWx0KDYwMClcblxuICAucHJvcCgnY29sc3BhbicpXG4gIC5kZWZhdWx0KDMpXG5cbiAgLnByb3AoJ3RpdGxlJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLnRpdGxlOyB9KVxuXG4gIC5wcm9wKCdzZXRzJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLnNldHM7IH0pXG5cbiAgLnByb3AoJ2tleScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5rZXk7IH0pXG5cbiAgLnByb3AoJ3NldFRpdGxlJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLnRpdGxlOyB9KVxuXG4gIC5wcm9wKCd2YWx1ZXMnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudmFsdWVzOyB9KVxuXG4gIC5wcm9wKCd4JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLng7IH0pXG5cbiAgLnByb3AoJ3knKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueTsgfSlcblxuICAucHJvcCgnZnZhbHVlJylcbiAgLmRlZmF1bHQoZDMuZm9ybWF0KCcsMnMnKSlcblxuICAucHJvcCgnZnRpY2snKVxuICAuZGVmYXVsdChudWxsKVxuXG4gIC5wcm9wKCd0aWNrcycpXG4gIC5kZWZhdWx0KDcpXG5cbiAgLnByb3AoJ2NvbG9ycycpXG4gIC5kZWZhdWx0KGQzLnNjYWxlLmNhdGVnb3J5MTAoKSlcblxuICAucHJvcCgnbm9uZScpXG4gIC5kZWZhdWx0KDApXG5cbiAgLnByb3AoJ2NoYXJ0JylcbiAgLnByb3AoJ2xlZ2VuZCcpXG5cbiAgLmluaXQoZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5jaGFydChjaGFydCh0aGlzKSk7XG4gICAgdGhpcy5sZWdlbmQobGVnZW5kKHRoaXMpKTtcbiAgfSlcblxuICAuZW50ZXIoZnVuY3Rpb24oZWwpIHtcbiAgICBlbC5hdHRyKCdjbGFzcycsICdsaW5lcyB3aWRnZXQnKTtcblxuICAgIGVsLmFwcGVuZCgnZGl2JylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd3aWRnZXQgdGl0bGUnKTtcblxuICAgIHZhciB2YWx1ZXMgPSBlbC5hcHBlbmQoJ2RpdicpXG4gICAgICAuYXR0cignY2xhc3MnLCAndmFsdWVzJyk7XG5cbiAgICB2YWx1ZXMuYXBwZW5kKCdkaXYnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ2NoYXJ0Jyk7XG5cbiAgICB2YWx1ZXMuYXBwZW5kKCdkaXYnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ2xlZ2VuZCcpO1xuICB9KVxuXG4gIC5kcmF3KGZ1bmN0aW9uKGVsKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBub2RlID0gZWwubm9kZSgpO1xuICAgIHZhciBjb2xvcnMgPSB0aGlzLmNvbG9ycygpO1xuXG4gICAgZWwuc2VsZWN0KCcud2lkZ2V0LnRpdGxlJylcbiAgICAgIC50ZXh0KGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgICAgcmV0dXJuIHNlbGYudGl0bGUoKS5jYWxsKG5vZGUsIGQsIGkpO1xuICAgICAgfSk7XG5cbiAgICB2YXIgbGVuO1xuICAgIHZhciB2YWx1ZXMgPSBlbC5zZWxlY3QoJy52YWx1ZXMnKVxuICAgICAgLmRhdHVtKGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgICAgZCA9IHNlbGYuc2V0cygpLmNhbGwobm9kZSwgZCwgaSk7XG4gICAgICAgIGxlbiA9IGQubGVuZ3RoO1xuICAgICAgICByZXR1cm4gZC5tYXAoc2V0KTtcbiAgICAgIH0pO1xuXG4gICAgdmFsdWVzLnNlbGVjdCgnLmNoYXJ0JylcbiAgICAgIC5jYWxsKHRoaXMuY2hhcnQoKSk7XG5cbiAgICB2YWx1ZXMuc2VsZWN0KCcubGVnZW5kJylcbiAgICAgIC5jYWxsKHRoaXMubGVnZW5kKCkpO1xuXG4gICAgZnVuY3Rpb24gc2V0KGQsIGkpIHtcbiAgICAgIHZhciBrZXkgPSBzZWxmLmtleSgpXG4gICAgICAgIC5jYWxsKG5vZGUsIGQsIGkpXG4gICAgICAgIC50b1N0cmluZygpO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgY29sb3I6IGNvbG9ycyh1dGlscy5oYXNoKGtleSkgJSBsZW4pLFxuICAgICAgICB0aXRsZTogc2VsZi5zZXRUaXRsZSgpLmNhbGwobm9kZSwgZCwgaSksXG4gICAgICAgIHZhbHVlczogc2VsZi52YWx1ZXMoKVxuICAgICAgICAgIC5jYWxsKG5vZGUsIGQsIGkpXG4gICAgICAgICAgLm1hcCh2YWx1ZSlcbiAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdmFsdWUoZCwgaSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgeDogc2VsZi54KCkuY2FsbChub2RlLCBkLCBpKSxcbiAgICAgICAgeTogc2VsZi55KCkuY2FsbChub2RlLCBkLCBpKVxuICAgICAgfTtcbiAgICB9XG4gIH0pO1xuXG5cbnZhciBjaGFydCA9IHJlcXVpcmUoJy4uL3ZpZXcnKS5leHRlbmQoKVxuICAucHJvcCgnaGVpZ2h0JylcbiAgLmRlZmF1bHQoMTUwKVxuXG4gIC5wcm9wKCdtYXJnaW4nKVxuICAuZGVmYXVsdCh7XG4gICAgdG9wOiA0LFxuICAgIGxlZnQ6IDI1LFxuICAgIHJpZ2h0OiAyNSxcbiAgICBib3R0b206IDI1XG4gIH0pXG5cbiAgLnByb3AoJ3dpZGdldCcpXG5cbiAgLmluaXQoZnVuY3Rpb24od2lkZ2V0KSB7XG4gICAgdGhpcy53aWRnZXQod2lkZ2V0KTtcbiAgfSlcblxuICAuZW50ZXIoZnVuY3Rpb24oZWwpIHtcbiAgICB2YXIgc3ZnID0gZWwuYXBwZW5kKCdzdmcnKVxuICAgICAgLmFwcGVuZCgnZycpO1xuXG4gICAgc3ZnLmFwcGVuZCgnZycpXG4gICAgICAuYXR0cignY2xhc3MnLCAnbGluZXMnKTtcblxuICAgIHN2Zy5hcHBlbmQoJ2cnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ2F4aXMnKTtcbiAgfSlcblxuICAuZHJhdyhmdW5jdGlvbihlbCkge1xuICAgIHZhciBtYXJnaW4gPSB0aGlzLm1hcmdpbigpO1xuICAgIHZhciB3aWR0aCA9IHBhcnNlSW50KGVsLnN0eWxlKCd3aWR0aCcpKTtcbiAgICB2YXIgaW5uZXJIZWlnaHQgPSB0aGlzLmhlaWdodCgpIC0gKG1hcmdpbi50b3AgKyBtYXJnaW4uYm90dG9tKTtcblxuICAgIHZhciBhbGxWYWx1ZXMgPSBlbFxuICAgICAgLmRhdHVtKClcbiAgICAgIC5yZWR1Y2UoZnVuY3Rpb24ocmVzdWx0cywgc2V0KSB7XG4gICAgICAgIHJlc3VsdHMucHVzaC5hcHBseShyZXN1bHRzLCBzZXQudmFsdWVzKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgICB9LCBbXSk7XG5cbiAgICB2YXIgZnggPSBkMy50aW1lLnNjYWxlKClcbiAgICAgIC5kb21haW4oZDMuZXh0ZW50KGFsbFZhbHVlcywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC54OyB9KSlcbiAgICAgIC5yYW5nZShbMCwgd2lkdGggLSAobWFyZ2luLmxlZnQgKyBtYXJnaW4ucmlnaHQpXSk7XG5cbiAgICB2YXIgZnkgPSBkMy5zY2FsZS5saW5lYXIoKVxuICAgICAgLmRvbWFpbihkMy5leHRlbnQoYWxsVmFsdWVzLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLnk7IH0pKVxuICAgICAgLnJhbmdlKFtpbm5lckhlaWdodCwgMF0pO1xuXG4gICAgdmFyIGF4aXMgPSBkMy5zdmcuYXhpcygpXG4gICAgICAuc2NhbGUoZngpXG4gICAgICAudGlja3ModGhpcy53aWRnZXQoKS50aWNrcygpKVxuICAgICAgLnRpY2tGb3JtYXQodGhpcy53aWRnZXQoKS5mdGljaygpKTtcblxuICAgIHZhciBsaW5lID0gZDMuc3ZnLmxpbmUoKVxuICAgICAgLngoZnVuY3Rpb24oZCkgeyByZXR1cm4gZngoZC54KTsgfSlcbiAgICAgIC55KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGZ5KGQueSk7IH0pO1xuXG4gICAgdmFyIHN2ZyA9IGVsLnNlbGVjdCgnc3ZnJylcbiAgICAgIC5hdHRyKCd3aWR0aCcsIHdpZHRoKVxuICAgICAgLmF0dHIoJ2hlaWdodCcsIHRoaXMuaGVpZ2h0KCkpXG4gICAgICAuc2VsZWN0KCdnJylcbiAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIHV0aWxzLnRyYW5zbGF0ZShtYXJnaW4ubGVmdCwgbWFyZ2luLnRvcCkpO1xuXG4gICAgdmFyIHNldCA9IHN2Zy5zZWxlY3QoJy5saW5lcycpLnNlbGVjdEFsbCgnLnNldCcpXG4gICAgICAuZGF0YShmdW5jdGlvbihkKSB7IHJldHVybiBkOyB9LFxuICAgICAgICAgICAgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5rZXk7IH0pO1xuXG4gICAgc2V0LmVudGVyKCkuYXBwZW5kKCdnJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdzZXQnKVxuICAgICAgLmF0dHIoJ2RhdGEtaWQnLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLmtleTsgfSlcbiAgICAgIC5hcHBlbmQoJ3BhdGgnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnbGluZScpO1xuXG4gICAgc2V0LnNlbGVjdCgnLmxpbmUnKVxuICAgICAgLmF0dHIoJ3N0cm9rZScsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuY29sb3I7IH0pXG4gICAgICAuYXR0cignZCcsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGxpbmUoZC52YWx1ZXMpOyB9KTtcblxuICAgIHZhciBkb3QgPSBzZXQuc2VsZWN0QWxsKCcuZG90JylcbiAgICAgIC5kYXRhKGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgaWYgKCFkLnZhbHVlcy5sZW5ndGgpIHsgcmV0dXJuIFtdOyB9XG4gICAgICAgIHZhciBsYXN0ID0gZC52YWx1ZXNbZC52YWx1ZXMubGVuZ3RoIC0gMV07XG5cbiAgICAgICAgcmV0dXJuIFt7XG4gICAgICAgICAgeDogbGFzdC54LFxuICAgICAgICAgIHk6IGxhc3QueSxcbiAgICAgICAgICBjb2xvcjogZC5jb2xvclxuICAgICAgICB9XTtcbiAgICAgIH0pO1xuXG4gICAgZG90LmVudGVyKCkuYXBwZW5kKCdjaXJjbGUnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ2RvdCcpXG4gICAgICAuYXR0cigncicsIDQpO1xuXG4gICAgZG90XG4gICAgICAuYXR0cignZmlsbCcsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuY29sb3I7IH0pXG4gICAgICAuYXR0cignY3gnLCBmdW5jdGlvbihkKSB7IHJldHVybiBmeChkLngpOyB9KVxuICAgICAgLmF0dHIoJ2N5JywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZnkoZC55KTsgfSk7XG5cbiAgICBkb3QuZXhpdCgpXG4gICAgICAucmVtb3ZlKCk7XG5cbiAgICBzZXQuZXhpdCgpXG4gICAgICAucmVtb3ZlKCk7XG5cbiAgICBzdmdcbiAgICAgIC5zZWxlY3QoJy5heGlzJylcbiAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCB1dGlscy50cmFuc2xhdGUoMCwgaW5uZXJIZWlnaHQpKVxuICAgICAgLmNhbGwoYXhpcyk7XG4gIH0pO1xuXG5cbnZhciBsZWdlbmQgPSByZXF1aXJlKCcuLi92aWV3JykuZXh0ZW5kKClcbiAgLnByb3AoJ3dpZGdldCcpXG5cbiAgLmluaXQoZnVuY3Rpb24od2lkZ2V0KSB7XG4gICAgdGhpcy53aWRnZXQod2lkZ2V0KTtcbiAgfSlcblxuICAuZW50ZXIoZnVuY3Rpb24oZWwpIHtcbiAgICBlbC5hcHBlbmQoJ3RhYmxlJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd0YWJsZScpO1xuICB9KVxuXG4gIC5kcmF3KGZ1bmN0aW9uKGVsKSB7XG4gICAgdmFyIG5vbmUgPSB0aGlzLndpZGdldCgpLm5vbmUoKTtcbiAgICB2YXIgZnZhbHVlID0gdGhpcy53aWRnZXQoKS5mdmFsdWUoKTtcblxuICAgIHZhciBzZXQgPSBlbC5zZWxlY3QoJy50YWJsZScpLnNlbGVjdEFsbCgnLnNldCcpXG4gICAgICAuZGF0YShmdW5jdGlvbihkKSB7IHJldHVybiBkOyB9LFxuICAgICAgICAgICAgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5rZXk7IH0pO1xuXG4gICAgdmFyIGVudGVyU2V0ID0gc2V0LmVudGVyKCkuYXBwZW5kKCd0cicpXG4gICAgICAuYXR0cignZGF0YS1pZCcsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQua2V5OyB9KVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3NldCcpO1xuXG4gICAgZW50ZXJTZXQuYXBwZW5kKCd0ZCcpXG4gICAgICAuYXR0cignY2xhc3MnLCAnc3dhdGNoJyk7XG5cbiAgICBlbnRlclNldC5hcHBlbmQoJ3RkJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd0aXRsZScpO1xuXG4gICAgZW50ZXJTZXQuYXBwZW5kKCd0ZCcpXG4gICAgICAuYXR0cignY2xhc3MnLCAndmFsdWUnKTtcblxuICAgIHNldC5zZWxlY3QoJy5zd2F0Y2gnKVxuICAgICAgLnN0eWxlKCdiYWNrZ3JvdW5kJywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5jb2xvcjsgfSk7XG5cbiAgICBzZXQuc2VsZWN0KCcudGl0bGUnKVxuICAgICAgLnRleHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50aXRsZTsgfSk7XG5cbiAgICBzZXQuc2VsZWN0KCcudmFsdWUnKVxuICAgICAgLnRleHQoZnVuY3Rpb24oZCkge1xuICAgICAgICBkID0gZC52YWx1ZXNbZC52YWx1ZXMubGVuZ3RoIC0gMV07XG5cbiAgICAgICAgcmV0dXJuIGRcbiAgICAgICAgICA/IGZ2YWx1ZShkLnkpXG4gICAgICAgICAgOiBmdmFsdWUobm9uZSk7XG4gICAgICB9KTtcblxuICAgIHNldC5leGl0KClcbiAgICAgIC5yZW1vdmUoKTtcbiAgfSk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4uL3ZpZXcnKS5leHRlbmQoKVxuICAucHJvcCgnY29sc3BhbicpXG4gIC5kZWZhdWx0KDEpXG5cbiAgLnByb3AoJ3Jvd3NwYW4nKVxuICAuZGVmYXVsdCgxKVxuXG4gIC5wcm9wKCd3aWR0aCcpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoMjAwKVxuXG4gIC5wcm9wKCdoZWlnaHQnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KDIwMClcblxuICAuZHJhdyhmdW5jdGlvbihlbCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIGVsLnN0eWxlKCd3aWR0aCcsIGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgICAgcmV0dXJuIHNlbGYud2lkdGgoKS5jYWxsKHRoaXMsIGQsIGkpICsgJ3B4JztcbiAgICAgIH0pXG4gICAgICAuc3R5bGUoJ2hlaWdodCcsIGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgICAgcmV0dXJuIHNlbGYuaGVpZ2h0KCkuY2FsbCh0aGlzLCBkLCBpKSArICdweCc7XG4gICAgICB9KTtcbiAgfSk7XG4iXX0=
(3)
});
