!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.sapphire=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
var utils = _dereq_('./utils');
var layout = _dereq_('./grid');
var widgets = _dereq_('./widgets');


module.exports = _dereq_('./view').extend()
  .prop('scale')
  .default(100)

  .prop('types')

  .prop('title')
  .set(d3.functor)
  .default(function(d) { return d.title; })

  .prop('key')
  .set(d3.functor)
  .default(function(d, i) { return i; })

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

    this.types()
      .forEach(function(name, type) { type.standalone(false); });

    var grid = layout()
      .scale(this.scale())
      .numcols(this.numcols())
      .padding(this.padding())
      .col(function(d) { return d.col; })
      .row(function(d) { return d.row; })
      .colspan(function(d) { return d.colspan; })
      .rowspan(function(d) { return d.rowspan; });
    
    el.style('width', (grid.scale() * grid.numcols()) + 'px');

    var widgets = el.select('.widgets')
      .datum(widgetData);

    var widget = widgets.selectAll('.widget')
      .data(function(d) { return d; }, widgetKey);

    widget.enter().append('div')
      .attr('data-key', widgetKey);

    widget
      .classed('widget', true)
      .style('width', function(d) {
        return grid.spanLength(d.colspan) + 'px';
      })
      .style('min-height', function(d) {
        return grid.spanLength(d.rowspan) + 'px';
      })
      .each(function(d) {
        var widgetEl = d3.select(this)
          .datum(d.data)
          .call(d.type);

        var width = parseInt(widgetEl.style('width'));
        d.colspan = Math.max(d.colspan, grid.lengthSpan(width));

        var height = parseInt(widgetEl.style('height'));
        d.rowspan = Math.max(d.rowspan, grid.lengthSpan(height));
      });

    var gridEls = grid(widgets.datum());

    widget
      .style('left', function(d, i) { return gridEls[i].x + 'px'; })
      .style('top', function(d, i) { return gridEls[i].y + 'px'; })
      .style('width', function(d, i) { return gridEls[i].width + 'px'; })
      .style('height', function(d, i) { return gridEls[i].height + 'px'; });

    widget.exit().remove();

    function widgetData(d, i) {
      return self.widgets()
        .call(node, d, i)
        .map(widgetDatum);
    }

    function widgetDatum(d, i) {
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

    function widgetKey(d) {
      return d.key;
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

    data = (data || [])
      .map(function(d, i) {
        return {
          data: d,
          col: self.col().call(self, d, i), 
          row: self.row().call(self, d, i),
          rowspan: self.rowspan().call(self, d, i),
          colspan: self.colspan().call(self, d, i)
        };
      })
      .map(best);

    var quadtree = d3.geom.quadtree()
      .x(function(d) { return d.col; })
      .y(function(d) { return d.row; });

    var root = quadtree(data);

    data.forEach(function(d) {
      root.visit(grid.uncollide(d));
      d.x = self.indexOffset(d.col);
      d.y = self.indexOffset(d.row);
      d.width = self.spanLength(d.colspan);
      d.height = self.spanLength(d.rowspan);
    });

    return data;
  })

  .meth(function indexOffset(index) {
    return (index * this.scale()) + this.padding();
  })

  .meth(function spanLength(span) {
    return (span * this.scale()) - (this.padding() * 2);
  })

  .meth(function offsetIndex(offset) {
    return Math.ceil((offset - this.padding()) / this.scale());
  })

  .meth(function lengthSpan(len) {
    return Math.ceil((len + (this.padding() * 2)) / this.scale());
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

  .invoke(function(d) {
    d.col = utils.ensure(d.col, this.col());
    d.row = utils.ensure(d.row, this.row());

    if (d.col + d.colspan > this.numcols()) {
      d.col = 0;
      d.row += this.rowspan();
      this.rowspan(0);
    }

    this
      .col(d.col + d.colspan)
      .row(d.row)
      .rowspan(Math.max(this.rowspan(), d.rowspan));

    return d;
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
exports.lines = _dereq_('./lines');
exports.last = _dereq_('./last');

},{"./last":7,"./lines":8,"./widget":9}],7:[function(_dereq_,module,exports){
var utils = _dereq_('../utils');


module.exports = _dereq_('./widget').extend()
  .prop('width')
  .default(400)

  .prop('colspan')
  .default(4)

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

  .prop('valueFormat')
  .default(d3.format(',2s'))

  .prop('diffFormat')
  .default(d3.format('+,2s'))

  .prop('timeFormat')
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
    el.attr('class', 'last widget');

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
      .text(this.valueFormat());

    values.select('.sparkline')
      .call(this.sparkline());

    values.select('.summary')
      .call(this.summary());
  });


var summary = _dereq_('../view').extend()
  .prop('widget')

  .init(function(widget) {
    this.widget(widget);
  })

  .enter(function(el) {
    el.append('span')
      .attr('class', 'diff');

    el.append('span')
      .attr('class', 'time');
  })

  .draw(function(el) {
    var widget = this.widget();
    if (el.datum().length < 2) { return; }

    el.select('.diff')
      .datum(function(d) {
        d = d.slice(-2);
        return d[1].y - d[0].y;
      })
      .text(widget.diffFormat());

    el.select('.time')
      .datum(function(d) {
        d = d.slice(-2);

        return [d[0].x, d[1].x]
          .map(utils.date)
          .map(widget.timeFormat());
      })
      .text(function(d) {
        return [' from', d[0], 'to', d[1]].join(' ');
      });
  });


var sparkline = _dereq_('../view').extend()
  .prop('widget')

  .prop('height').default(25)

  .prop('margin').default({
    top: 4,
    left: 4,
    bottom: 4,
    right: 4 
  })

  .init(function(widget) {
    this.widget(widget);
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

  .prop('metrics')
  .set(d3.functor)
  .default(function(d) { return d.metrics; })

  .prop('key')
  .set(d3.functor)
  .default(function(d, i) { return i; })

  .prop('metricTitle')
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

  .prop('valueFormat')
  .default(d3.format(',2s'))

  .prop('tickFormat')
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
      .attr('class', 'title');

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

    el.select('.widget .title')
      .text(function(d, i) {
        return self.title().call(node, d, i);
      });

    var values = el.select('.values')
      .datum(function(d, i) {
        return self.metrics()
          .call(node, d, i)
          .map(metric);
      });

    values.select('.chart')
      .call(this.chart());

    values.select('.legend')
      .call(this.legend());

    function metric(d, i) {
      var key = self.key()
        .call(node, d, i)
        .toString();

      return {
        key: key,
        color: colors(i),
        title: self.metricTitle().call(node, d, i),
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
      .reduce(function(results, metric) {
        results.push.apply(results, metric.values);
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
      .tickFormat(this.widget().tickFormat());

    var line = d3.svg.line()
      .x(function(d) { return fx(d.x); })
      .y(function(d) { return fy(d.y); });

    var svg = el.select('svg')
      .attr('width', width)
      .attr('height', this.height())
      .select('g')
        .attr('transform', utils.translate(margin.left, margin.top));

    var metric = svg.select('.lines').selectAll('.metric')
      .data(function(d) { return d; },
            function(d) { return d.key; });

    metric.enter().append('g')
      .attr('class', 'metric')
      .attr('data-key', function(d) { return d.key; })
      .append('path')
        .attr('class', 'line');

    metric.select('.line')
      .attr('stroke', function(d) { return d.color; })
      .attr('d', function(d) { return line(d.values); });

    var dot = metric.selectAll('.dot')
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

    metric.exit()
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
    var valueFormat = this.widget().valueFormat();

    var metric = el.select('.table').selectAll('.metric')
      .data(function(d) { return d; },
            function(d) { return d.key; });

    var enterMetric = metric.enter().append('tr')
      .attr('data-key', function(d) { return d.key; })
      .attr('class', 'metric');

    enterMetric.append('td')
      .attr('class', 'swatch');

    enterMetric.append('td')
      .attr('class', 'title');

    enterMetric.append('td')
      .attr('class', 'value');

    metric.select('.swatch')
      .style('background', function(d) { return d.color; });

    metric.select('.title')
      .text(function(d) { return d.title; });

    metric.select('.value')
      .text(function(d) {
        d = d.values[d.values.length - 1];

        return d
          ? valueFormat(d.y)
          : valueFormat(none);
      });

    metric.exit()
      .remove();
  });

},{"../utils":4,"../view":5,"./widget":9}],9:[function(_dereq_,module,exports){
module.exports = _dereq_('../view').extend()
  .prop('standalone')
  .default(true)

  .prop('colspan')
  .default(1)

  .prop('rowspan')
  .default(1)

  .prop('width')
  .set(d3.functor)
  .default(100)

  .prop('height')
  .set(d3.functor)
  .default(100)

  .draw(function(el) {
    if (!this.standalone()) { return; }
    var self = this;

    el.style('width', function(d, i) {
        return self.width().call(this, d, i) + 'px';
      })
      .style('min-height', function(d, i) {
        return self.height().call(this, d, i) + 'px';
      });
  });

},{"../view":5}]},{},[3])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy9kYXNoYm9hcmQuanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvZ3JpZC5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy9pbmRleC5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy91dGlscy5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy92aWV3LmpzIiwiL2hvbWUvanVzdGluL3ByYWVrZWx0L3NhcHBoaXJlL3NyYy9zY3JpcHRzL3dpZGdldHMvaW5kZXguanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvd2lkZ2V0cy9sYXN0LmpzIiwiL2hvbWUvanVzdGluL3ByYWVrZWx0L3NhcHBoaXJlL3NyYy9zY3JpcHRzL3dpZGdldHMvbGluZXMuanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvd2lkZ2V0cy93aWRnZXQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaktBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9SQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcbnZhciBsYXlvdXQgPSByZXF1aXJlKCcuL2dyaWQnKTtcbnZhciB3aWRnZXRzID0gcmVxdWlyZSgnLi93aWRnZXRzJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL3ZpZXcnKS5leHRlbmQoKVxuICAucHJvcCgnc2NhbGUnKVxuICAuZGVmYXVsdCgxMDApXG5cbiAgLnByb3AoJ3R5cGVzJylcblxuICAucHJvcCgndGl0bGUnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGl0bGU7IH0pXG5cbiAgLnByb3AoJ2tleScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gaTsgfSlcblxuICAucHJvcCgndHlwZScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50eXBlOyB9KVxuXG4gIC5wcm9wKCd3aWRnZXRzJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLndpZGdldHM7IH0pXG5cbiAgLnByb3AoJ2NvbCcpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkge1xuICAgIHJldHVybiB1dGlscy5hY2Nlc3MoZCwgJ2NvbCcpO1xuICB9KVxuXG4gIC5wcm9wKCdyb3cnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHtcbiAgICByZXR1cm4gdXRpbHMuYWNjZXNzKGQsICdyb3cnKTtcbiAgfSlcblxuICAucHJvcCgnY29sc3BhbicpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkge1xuICAgIHJldHVybiB1dGlscy5hY2Nlc3MoZCwgJ2NvbHNwYW4nKTtcbiAgfSlcblxuICAucHJvcCgncm93c3BhbicpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkge1xuICAgIHJldHVybiB1dGlscy5hY2Nlc3MoZCwgJ3Jvd3NwYW4nKTtcbiAgfSlcblxuICAucHJvcCgnbnVtY29scycpXG4gIC5kZWZhdWx0KDgpXG5cbiAgLnByb3AoJ3BhZGRpbmcnKVxuICAuZGVmYXVsdCg1KVxuXG4gIC5pbml0KGZ1bmN0aW9uKCkge1xuICAgIHZhciB0eXBlcyA9IGQzLm1hcCgpO1xuXG4gICAgZDMua2V5cyh3aWRnZXRzKS5mb3JFYWNoKGZ1bmN0aW9uKGspIHtcbiAgICAgIHR5cGVzLnNldChrLCB3aWRnZXRzW2tdLm5ldygpKTtcbiAgICB9KTtcblxuICAgIHRoaXMudHlwZXModHlwZXMpO1xuICB9KVxuXG4gIC5lbnRlcihmdW5jdGlvbihlbCkge1xuICAgIGVsLmF0dHIoJ2NsYXNzJywgJ2Rhc2hib2FyZCcpXG4gICAgICAuYXBwZW5kKCdkaXYnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnd2lkZ2V0cycpO1xuICB9KVxuXG4gIC5kcmF3KGZ1bmN0aW9uKGVsKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBub2RlID0gZWwubm9kZSgpO1xuXG4gICAgdGhpcy50eXBlcygpXG4gICAgICAuZm9yRWFjaChmdW5jdGlvbihuYW1lLCB0eXBlKSB7IHR5cGUuc3RhbmRhbG9uZShmYWxzZSk7IH0pO1xuXG4gICAgdmFyIGdyaWQgPSBsYXlvdXQoKVxuICAgICAgLnNjYWxlKHRoaXMuc2NhbGUoKSlcbiAgICAgIC5udW1jb2xzKHRoaXMubnVtY29scygpKVxuICAgICAgLnBhZGRpbmcodGhpcy5wYWRkaW5nKCkpXG4gICAgICAuY29sKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuY29sOyB9KVxuICAgICAgLnJvdyhmdW5jdGlvbihkKSB7IHJldHVybiBkLnJvdzsgfSlcbiAgICAgIC5jb2xzcGFuKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuY29sc3BhbjsgfSlcbiAgICAgIC5yb3dzcGFuKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQucm93c3BhbjsgfSk7XG4gICAgXG4gICAgZWwuc3R5bGUoJ3dpZHRoJywgKGdyaWQuc2NhbGUoKSAqIGdyaWQubnVtY29scygpKSArICdweCcpO1xuXG4gICAgdmFyIHdpZGdldHMgPSBlbC5zZWxlY3QoJy53aWRnZXRzJylcbiAgICAgIC5kYXR1bSh3aWRnZXREYXRhKTtcblxuICAgIHZhciB3aWRnZXQgPSB3aWRnZXRzLnNlbGVjdEFsbCgnLndpZGdldCcpXG4gICAgICAuZGF0YShmdW5jdGlvbihkKSB7IHJldHVybiBkOyB9LCB3aWRnZXRLZXkpO1xuXG4gICAgd2lkZ2V0LmVudGVyKCkuYXBwZW5kKCdkaXYnKVxuICAgICAgLmF0dHIoJ2RhdGEta2V5Jywgd2lkZ2V0S2V5KTtcblxuICAgIHdpZGdldFxuICAgICAgLmNsYXNzZWQoJ3dpZGdldCcsIHRydWUpXG4gICAgICAuc3R5bGUoJ3dpZHRoJywgZnVuY3Rpb24oZCkge1xuICAgICAgICByZXR1cm4gZ3JpZC5zcGFuTGVuZ3RoKGQuY29sc3BhbikgKyAncHgnO1xuICAgICAgfSlcbiAgICAgIC5zdHlsZSgnbWluLWhlaWdodCcsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuIGdyaWQuc3Bhbkxlbmd0aChkLnJvd3NwYW4pICsgJ3B4JztcbiAgICAgIH0pXG4gICAgICAuZWFjaChmdW5jdGlvbihkKSB7XG4gICAgICAgIHZhciB3aWRnZXRFbCA9IGQzLnNlbGVjdCh0aGlzKVxuICAgICAgICAgIC5kYXR1bShkLmRhdGEpXG4gICAgICAgICAgLmNhbGwoZC50eXBlKTtcblxuICAgICAgICB2YXIgd2lkdGggPSBwYXJzZUludCh3aWRnZXRFbC5zdHlsZSgnd2lkdGgnKSk7XG4gICAgICAgIGQuY29sc3BhbiA9IE1hdGgubWF4KGQuY29sc3BhbiwgZ3JpZC5sZW5ndGhTcGFuKHdpZHRoKSk7XG5cbiAgICAgICAgdmFyIGhlaWdodCA9IHBhcnNlSW50KHdpZGdldEVsLnN0eWxlKCdoZWlnaHQnKSk7XG4gICAgICAgIGQucm93c3BhbiA9IE1hdGgubWF4KGQucm93c3BhbiwgZ3JpZC5sZW5ndGhTcGFuKGhlaWdodCkpO1xuICAgICAgfSk7XG5cbiAgICB2YXIgZ3JpZEVscyA9IGdyaWQod2lkZ2V0cy5kYXR1bSgpKTtcblxuICAgIHdpZGdldFxuICAgICAgLnN0eWxlKCdsZWZ0JywgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gZ3JpZEVsc1tpXS54ICsgJ3B4JzsgfSlcbiAgICAgIC5zdHlsZSgndG9wJywgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gZ3JpZEVsc1tpXS55ICsgJ3B4JzsgfSlcbiAgICAgIC5zdHlsZSgnd2lkdGgnLCBmdW5jdGlvbihkLCBpKSB7IHJldHVybiBncmlkRWxzW2ldLndpZHRoICsgJ3B4JzsgfSlcbiAgICAgIC5zdHlsZSgnaGVpZ2h0JywgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gZ3JpZEVsc1tpXS5oZWlnaHQgKyAncHgnOyB9KTtcblxuICAgIHdpZGdldC5leGl0KCkucmVtb3ZlKCk7XG5cbiAgICBmdW5jdGlvbiB3aWRnZXREYXRhKGQsIGkpIHtcbiAgICAgIHJldHVybiBzZWxmLndpZGdldHMoKVxuICAgICAgICAuY2FsbChub2RlLCBkLCBpKVxuICAgICAgICAubWFwKHdpZGdldERhdHVtKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB3aWRnZXREYXR1bShkLCBpKSB7XG4gICAgICB2YXIgdHlwZW5hbWUgPSBzZWxmLnR5cGUoKS5jYWxsKG5vZGUsIGQsIGkpO1xuICAgICAgdmFyIHR5cGUgPSBzZWxmLnR5cGVzKCkuZ2V0KHR5cGVuYW1lKTtcblxuICAgICAgaWYgKCF0eXBlKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVucmVjb2duaXNlZCBkYXNoYm9hcmQgd2lkZ2V0IHR5cGUgJ1wiICsgdHlwZW5hbWUgKyBcIidcIik7XG4gICAgICB9XG5cbiAgICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICAgIHJlc3VsdC5kYXRhID0gZDtcbiAgICAgIHJlc3VsdC50eXBlID0gdHlwZTtcbiAgICAgIHJlc3VsdC5rZXkgPSBzZWxmLmtleSgpLmNhbGwobm9kZSwgZCwgaSk7XG4gICAgICByZXN1bHQuY29sID0gc2VsZi5jb2woKS5jYWxsKG5vZGUsIGQsIGkpO1xuICAgICAgcmVzdWx0LnJvdyA9IHNlbGYucm93KCkuY2FsbChub2RlLCBkLCBpKTtcbiAgICAgIHJlc3VsdC5jb2xzcGFuID0gc2VsZi5jb2xzcGFuKCkuY2FsbChub2RlLCBkLCBpKTtcbiAgICAgIHJlc3VsdC5jb2xzcGFuID0gdXRpbHMuZW5zdXJlKHJlc3VsdC5jb2xzcGFuLCB0eXBlLmNvbHNwYW4oKSk7XG4gICAgICByZXN1bHQucm93c3BhbiA9IHNlbGYucm93c3BhbigpLmNhbGwobm9kZSwgZCwgaSk7XG4gICAgICByZXN1bHQucm93c3BhbiA9IHV0aWxzLmVuc3VyZShyZXN1bHQucm93c3BhbiwgdHlwZS5yb3dzcGFuKCkpO1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB3aWRnZXRLZXkoZCkge1xuICAgICAgcmV0dXJuIGQua2V5O1xuICAgIH1cbiAgfSk7XG4iLCJ2YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG5cblxudmFyIGdyaWQgPSBtb2R1bGUuZXhwb3J0cyA9IHN0cmFpbigpXG4gIC5wcm9wKCdjb2wnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHtcbiAgICByZXR1cm4gdXRpbHMuYWNjZXNzKGQsICdjb2wnKTtcbiAgfSlcblxuICAucHJvcCgncm93JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7XG4gICAgcmV0dXJuIHV0aWxzLmFjY2VzcyhkLCAncm93Jyk7XG4gIH0pXG5cbiAgLnByb3AoJ251bWNvbHMnKVxuICAuZGVmYXVsdCg4KVxuXG4gIC5wcm9wKCdzY2FsZScpXG4gIC5kZWZhdWx0KDEwKVxuXG4gIC5wcm9wKCdwYWRkaW5nJylcbiAgLmRlZmF1bHQoNSlcblxuICAucHJvcCgnY29sc3BhbicpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkge1xuICAgIHJldHVybiB1dGlscy5hY2Nlc3MoZCwgJ2NvbHNwYW4nLCAxKTtcbiAgfSlcblxuICAucHJvcCgncm93c3BhbicpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkge1xuICAgIHJldHVybiB1dGlscy5hY2Nlc3MoZCwgJ3Jvd3NwYW4nLCAxKTtcbiAgfSlcblxuICAuaW52b2tlKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIGJlc3QgPSBjb3VudGVyKCkubnVtY29scyh0aGlzLm51bWNvbHMoKSk7XG5cbiAgICBkYXRhID0gKGRhdGEgfHwgW10pXG4gICAgICAubWFwKGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBkYXRhOiBkLFxuICAgICAgICAgIGNvbDogc2VsZi5jb2woKS5jYWxsKHNlbGYsIGQsIGkpLCBcbiAgICAgICAgICByb3c6IHNlbGYucm93KCkuY2FsbChzZWxmLCBkLCBpKSxcbiAgICAgICAgICByb3dzcGFuOiBzZWxmLnJvd3NwYW4oKS5jYWxsKHNlbGYsIGQsIGkpLFxuICAgICAgICAgIGNvbHNwYW46IHNlbGYuY29sc3BhbigpLmNhbGwoc2VsZiwgZCwgaSlcbiAgICAgICAgfTtcbiAgICAgIH0pXG4gICAgICAubWFwKGJlc3QpO1xuXG4gICAgdmFyIHF1YWR0cmVlID0gZDMuZ2VvbS5xdWFkdHJlZSgpXG4gICAgICAueChmdW5jdGlvbihkKSB7IHJldHVybiBkLmNvbDsgfSlcbiAgICAgIC55KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQucm93OyB9KTtcblxuICAgIHZhciByb290ID0gcXVhZHRyZWUoZGF0YSk7XG5cbiAgICBkYXRhLmZvckVhY2goZnVuY3Rpb24oZCkge1xuICAgICAgcm9vdC52aXNpdChncmlkLnVuY29sbGlkZShkKSk7XG4gICAgICBkLnggPSBzZWxmLmluZGV4T2Zmc2V0KGQuY29sKTtcbiAgICAgIGQueSA9IHNlbGYuaW5kZXhPZmZzZXQoZC5yb3cpO1xuICAgICAgZC53aWR0aCA9IHNlbGYuc3Bhbkxlbmd0aChkLmNvbHNwYW4pO1xuICAgICAgZC5oZWlnaHQgPSBzZWxmLnNwYW5MZW5ndGgoZC5yb3dzcGFuKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBkYXRhO1xuICB9KVxuXG4gIC5tZXRoKGZ1bmN0aW9uIGluZGV4T2Zmc2V0KGluZGV4KSB7XG4gICAgcmV0dXJuIChpbmRleCAqIHRoaXMuc2NhbGUoKSkgKyB0aGlzLnBhZGRpbmcoKTtcbiAgfSlcblxuICAubWV0aChmdW5jdGlvbiBzcGFuTGVuZ3RoKHNwYW4pIHtcbiAgICByZXR1cm4gKHNwYW4gKiB0aGlzLnNjYWxlKCkpIC0gKHRoaXMucGFkZGluZygpICogMik7XG4gIH0pXG5cbiAgLm1ldGgoZnVuY3Rpb24gb2Zmc2V0SW5kZXgob2Zmc2V0KSB7XG4gICAgcmV0dXJuIE1hdGguY2VpbCgob2Zmc2V0IC0gdGhpcy5wYWRkaW5nKCkpIC8gdGhpcy5zY2FsZSgpKTtcbiAgfSlcblxuICAubWV0aChmdW5jdGlvbiBsZW5ndGhTcGFuKGxlbikge1xuICAgIHJldHVybiBNYXRoLmNlaWwoKGxlbiArICh0aGlzLnBhZGRpbmcoKSAqIDIpKSAvIHRoaXMuc2NhbGUoKSk7XG4gIH0pXG5cbiAgLnN0YXRpYyhmdW5jdGlvbiBib3goZCkge1xuICAgIHJldHVybiB7XG4gICAgICB4MTogZC5jb2wsXG4gICAgICB4MjogZC5jb2wgKyBkLmNvbHNwYW4gLSAxLFxuICAgICAgeTE6IGQucm93LFxuICAgICAgeTI6IGQucm93ICsgZC5yb3dzcGFuIC0gMVxuICAgIH07XG4gIH0pXG5cbiAgLnN0YXRpYyhmdW5jdGlvbiB1bmNvbGxpZGUoYSkge1xuICAgIHZhciBib3hBID0gZ3JpZC5ib3goYSk7XG4gICAgXG4gICAgcmV0dXJuIGZ1bmN0aW9uKG5vZGUsIHgxLCB5MSwgeDIsIHkyKSB7XG4gICAgICB2YXIgYiA9IG5vZGUucG9pbnQ7XG5cbiAgICAgIGlmIChiICYmIGEgIT09IGIgJiYgZ3JpZC5pbnRlcnNlY3Rpb24oYm94QSwgZ3JpZC5ib3goYikpKSB7XG4gICAgICAgIGIucm93ID0gYm94QS55MiArIDE7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiAhZ3JpZC5pbnRlcnNlY3Rpb24oYm94QSwge1xuICAgICAgICB4MTogeDEsIFxuICAgICAgICB5MTogeTEsIFxuICAgICAgICB4MjogeDIsXG4gICAgICAgIHkyOiB5MlxuICAgICAgfSk7XG4gICAgfTtcbiAgfSlcblxuICAuc3RhdGljKGZ1bmN0aW9uIGludGVyc2VjdGlvbihhLCBiKSB7XG4gICAgcmV0dXJuICgoYS54MSA8PSBiLngxICYmIGIueDEgPD0gYS54MikgJiYgKGEueTEgPD0gYi55MSAmJiBiLnkxIDw9IGEueTIpKVxuICAgICAgICB8fCAoKGIueDEgPD0gYS54MSAmJiBhLngxIDw9IGIueDIpICYmIChiLnkxIDw9IGEueTEgJiYgYS55MSA8PSBiLnkyKSlcbiAgICAgICAgfHwgKChhLngxIDw9IGIueDIgJiYgYi54MiA8PSBhLngyKSAmJiAoYS55MSA8PSBiLnkxICYmIGIueTEgPD0gYS55MikpXG4gICAgICAgIHx8ICgoYi54MSA8PSBhLngyICYmIGEueDIgPD0gYi54MikgJiYgKGIueTEgPD0gYS55MSAmJiBhLnkxIDw9IGIueTIpKTtcbiAgfSk7XG5cblxudmFyIGNvdW50ZXIgPSBzdHJhaW4oKVxuICAucHJvcCgnbnVtY29scycpXG5cbiAgLnByb3AoJ3Jvd3NwYW4nKVxuICAuZGVmYXVsdCgwKVxuXG4gIC5wcm9wKCdjb2wnKVxuICAuZGVmYXVsdCgwKVxuXG4gIC5wcm9wKCdyb3cnKVxuICAuZGVmYXVsdCgwKVxuXG4gIC5pbnZva2UoZnVuY3Rpb24oZCkge1xuICAgIGQuY29sID0gdXRpbHMuZW5zdXJlKGQuY29sLCB0aGlzLmNvbCgpKTtcbiAgICBkLnJvdyA9IHV0aWxzLmVuc3VyZShkLnJvdywgdGhpcy5yb3coKSk7XG5cbiAgICBpZiAoZC5jb2wgKyBkLmNvbHNwYW4gPiB0aGlzLm51bWNvbHMoKSkge1xuICAgICAgZC5jb2wgPSAwO1xuICAgICAgZC5yb3cgKz0gdGhpcy5yb3dzcGFuKCk7XG4gICAgICB0aGlzLnJvd3NwYW4oMCk7XG4gICAgfVxuXG4gICAgdGhpc1xuICAgICAgLmNvbChkLmNvbCArIGQuY29sc3BhbilcbiAgICAgIC5yb3coZC5yb3cpXG4gICAgICAucm93c3BhbihNYXRoLm1heCh0aGlzLnJvd3NwYW4oKSwgZC5yb3dzcGFuKSk7XG5cbiAgICByZXR1cm4gZDtcbiAgfSk7XG4iLCJleHBvcnRzLnV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xuZXhwb3J0cy52aWV3ID0gcmVxdWlyZSgnLi92aWV3Jyk7XG5leHBvcnRzLmdyaWQgPSByZXF1aXJlKCcuL2dyaWQnKTtcbmV4cG9ydHMud2lkZ2V0cyA9IHJlcXVpcmUoJy4vd2lkZ2V0cycpO1xuZXhwb3J0cy5kYXNoYm9hcmQgPSByZXF1aXJlKCcuL2Rhc2hib2FyZCcpO1xuIiwidmFyIHV0aWxzID0gZXhwb3J0cztcblxuXG51dGlscy5hY2Nlc3MgPSBmdW5jdGlvbihkLCBuYW1lLCBkZWZhdWx0dmFsKSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoIDwgMykge1xuICAgIGRlZmF1bHR2YWwgPSBudWxsO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBkICE9ICdvYmplY3QnKSB7XG4gICAgcmV0dXJuIGRlZmF1bHR2YWw7XG4gIH1cblxuICB2YXIgdmFsID0gZFtuYW1lXTtcbiAgcmV0dXJuIHR5cGVvZiB2YWwgPT0gJ3VuZGVmaW5lZCdcbiAgICA/IGRlZmF1bHR2YWxcbiAgICA6IHZhbDtcbn07XG5cblxudXRpbHMuZW5zdXJlID0gZnVuY3Rpb24odiwgZGVmYXVsdHZhbCkge1xuICByZXR1cm4gdiA9PT0gbnVsbCB8fCB0eXBlb2YgdiA9PSAndW5kZWZpbmVkJ1xuICAgID8gZGVmYXVsdHZhbFxuICAgIDogdjtcbn07XG5cblxudXRpbHMudHJhbnNsYXRlID0gZnVuY3Rpb24oeCwgeSkge1xuICByZXR1cm4gJ3RyYW5zbGF0ZSgnICsgeCArICcsICcgKyB5ICsgJyknO1xufTtcblxuXG51dGlscy5lbnN1cmVFbCA9IGZ1bmN0aW9uKGVsKSB7XG4gIHJldHVybiAhKGVsIGluc3RhbmNlb2YgZDMuc2VsZWN0aW9uKVxuICAgID8gZDMuc2VsZWN0KGVsKVxuICAgIDogZWw7XG59O1xuXG5cbnV0aWxzLmRhdGUgPSBmdW5jdGlvbih0KSB7XG4gIHJldHVybiBuZXcgRGF0ZSh0KTtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHN0cmFpbigpXG4gIC5zdGF0aWMoZnVuY3Rpb24gZHJhdyhmbikge1xuICAgIHRoaXMubWV0aCgnX2RyYXdfJywgZm4pO1xuICB9KVxuICAuZHJhdyhmdW5jdGlvbigpIHt9KVxuXG4gIC5zdGF0aWMoZnVuY3Rpb24gZW50ZXIoZm4pIHtcbiAgICB0aGlzLm1ldGgoJ19lbnRlcl8nLCBmbik7XG4gIH0pXG4gIC5lbnRlcihmdW5jdGlvbigpIHt9KVxuXG4gIC5tZXRoKGZ1bmN0aW9uIGRyYXcoZWwpIHtcbiAgICBlbCA9IHNhcHBoaXJlLnV0aWxzLmVuc3VyZUVsKGVsKTtcblxuICAgIGlmIChlbC5ub2RlKCkgJiYgIWVsLm5vZGUoKS5oYXNDaGlsZE5vZGVzKCkpIHtcbiAgICAgIHRoaXMuZW50ZXIoZWwpO1xuICAgIH1cblxuICAgIHZhciBwYXJlbnQgPSB0aGlzLl90eXBlXy5fc3VwZXJfLnByb3RvdHlwZTtcbiAgICBpZiAoJ19kcmF3XycgaW4gcGFyZW50KSB7XG4gICAgICBwYXJlbnQuX2RyYXdfLmNhbGwodGhpcywgZWwpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9kcmF3XyhlbCk7XG4gIH0pXG5cbiAgLm1ldGgoZnVuY3Rpb24gZW50ZXIoZWwpIHtcbiAgICBlbCA9IHNhcHBoaXJlLnV0aWxzLmVuc3VyZUVsKGVsKTtcblxuICAgIHZhciBwYXJlbnQgPSB0aGlzLl90eXBlXy5fc3VwZXJfLnByb3RvdHlwZTtcbiAgICBpZiAoJ19lbnRlcl8nIGluIHBhcmVudCkge1xuICAgICAgcGFyZW50Ll9lbnRlcl8uY2FsbCh0aGlzLCBlbCk7XG4gICAgfVxuXG4gICAgdGhpcy5fZW50ZXJfKGVsKTtcbiAgfSlcblxuICAuaW52b2tlKGZ1bmN0aW9uKGVsKSB7XG4gICAgcmV0dXJuIHRoaXMuZHJhdyhlbCk7XG4gIH0pO1xuIiwiZXhwb3J0cy53aWRnZXQgPSByZXF1aXJlKCcuL3dpZGdldCcpO1xuZXhwb3J0cy5saW5lcyA9IHJlcXVpcmUoJy4vbGluZXMnKTtcbmV4cG9ydHMubGFzdCA9IHJlcXVpcmUoJy4vbGFzdCcpO1xuIiwidmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vd2lkZ2V0JykuZXh0ZW5kKClcbiAgLnByb3AoJ3dpZHRoJylcbiAgLmRlZmF1bHQoNDAwKVxuXG4gIC5wcm9wKCdjb2xzcGFuJylcbiAgLmRlZmF1bHQoNClcblxuICAucHJvcCgndGl0bGUnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGl0bGU7IH0pXG5cbiAgLnByb3AoJ3ZhbHVlcycpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC52YWx1ZXM7IH0pXG5cbiAgLnByb3AoJ3gnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueDsgfSlcblxuICAucHJvcCgneScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC55OyB9KVxuXG4gIC5wcm9wKCd2YWx1ZUZvcm1hdCcpXG4gIC5kZWZhdWx0KGQzLmZvcm1hdCgnLDJzJykpXG5cbiAgLnByb3AoJ2RpZmZGb3JtYXQnKVxuICAuZGVmYXVsdChkMy5mb3JtYXQoJyssMnMnKSlcblxuICAucHJvcCgndGltZUZvcm1hdCcpXG4gIC5kZWZhdWx0KGQzLnRpbWUuZm9ybWF0KCclLWQgJWIgJS1IOiVNJykpXG5cbiAgLnByb3AoJ25vbmUnKVxuICAuZGVmYXVsdCgwKVxuXG4gIC5wcm9wKCdzcGFya2xpbmUnKVxuICAucHJvcCgnc3VtbWFyeScpXG5cbiAgLmluaXQoZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zcGFya2xpbmUoc3BhcmtsaW5lKHRoaXMpKTtcbiAgICB0aGlzLnN1bW1hcnkoc3VtbWFyeSh0aGlzKSk7XG4gIH0pXG5cbiAgLmVudGVyKGZ1bmN0aW9uKGVsKSB7XG4gICAgZWwuYXR0cignY2xhc3MnLCAnbGFzdCB3aWRnZXQnKTtcblxuICAgIGVsLmFwcGVuZCgnZGl2JylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd0aXRsZScpO1xuXG4gICAgdmFyIHZhbHVlcyA9IGVsLmFwcGVuZCgnZGl2JylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd2YWx1ZXMnKTtcblxuICAgIHZhbHVlcy5hcHBlbmQoJ2RpdicpXG4gICAgICAuYXR0cignY2xhc3MnLCAnbGFzdCB2YWx1ZScpO1xuXG4gICAgdmFsdWVzLmFwcGVuZCgnZGl2JylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdzcGFya2xpbmUnKTtcblxuICAgIHZhbHVlcy5hcHBlbmQoJ2RpdicpXG4gICAgICAuYXR0cignY2xhc3MnLCAnc3VtbWFyeScpO1xuICB9KVxuXG4gIC5kcmF3KGZ1bmN0aW9uKGVsKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBub2RlID0gZWwubm9kZSgpO1xuXG4gICAgZWwuc2VsZWN0KCcudGl0bGUnKVxuICAgICAgLnRleHQoZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICByZXR1cm4gc2VsZi50aXRsZSgpLmNhbGwobm9kZSwgZCwgaSk7XG4gICAgICB9KTtcblxuICAgIHZhciB2YWx1ZXMgPSBlbC5zZWxlY3QoJy52YWx1ZXMnKVxuICAgICAgLmRhdHVtKGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgICAgcmV0dXJuIHNlbGYudmFsdWVzKClcbiAgICAgICAgICAuY2FsbChub2RlLCBkLCBpKVxuICAgICAgICAgIC5tYXAoZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgeDogc2VsZi54KCkuY2FsbChub2RlLCBkLCBpKSxcbiAgICAgICAgICAgICAgeTogc2VsZi55KCkuY2FsbChub2RlLCBkLCBpKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9KTtcbiAgICAgIH0pXG4gICAgICAuYXR0cignY2xhc3MnLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIGQgPSBkLnNsaWNlKC0yKTtcblxuICAgICAgICBkID0gZC5sZW5ndGggPiAxXG4gICAgICAgICAgPyBkWzFdLnkgLSBkWzBdLnlcbiAgICAgICAgICA6IDA7XG5cbiAgICAgICAgaWYgKGQgPiAwKSB7IHJldHVybiAnZ29vZCB2YWx1ZXMnOyB9XG4gICAgICAgIGlmIChkIDwgMCkgeyByZXR1cm4gJ2JhZCB2YWx1ZXMnOyB9XG4gICAgICAgIHJldHVybiAnbmV1dHJhbCB2YWx1ZXMnO1xuICAgICAgfSk7XG5cbiAgICB2YWx1ZXMuc2VsZWN0KCcubGFzdC52YWx1ZScpXG4gICAgICAuZGF0dW0oZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICBkID0gZFtkLmxlbmd0aCAtIDFdO1xuXG4gICAgICAgIHJldHVybiAhZFxuICAgICAgICAgID8gc2VsZi5ub25lKClcbiAgICAgICAgICA6IGQueTtcbiAgICAgIH0pXG4gICAgICAudGV4dCh0aGlzLnZhbHVlRm9ybWF0KCkpO1xuXG4gICAgdmFsdWVzLnNlbGVjdCgnLnNwYXJrbGluZScpXG4gICAgICAuY2FsbCh0aGlzLnNwYXJrbGluZSgpKTtcblxuICAgIHZhbHVlcy5zZWxlY3QoJy5zdW1tYXJ5JylcbiAgICAgIC5jYWxsKHRoaXMuc3VtbWFyeSgpKTtcbiAgfSk7XG5cblxudmFyIHN1bW1hcnkgPSByZXF1aXJlKCcuLi92aWV3JykuZXh0ZW5kKClcbiAgLnByb3AoJ3dpZGdldCcpXG5cbiAgLmluaXQoZnVuY3Rpb24od2lkZ2V0KSB7XG4gICAgdGhpcy53aWRnZXQod2lkZ2V0KTtcbiAgfSlcblxuICAuZW50ZXIoZnVuY3Rpb24oZWwpIHtcbiAgICBlbC5hcHBlbmQoJ3NwYW4nKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ2RpZmYnKTtcblxuICAgIGVsLmFwcGVuZCgnc3BhbicpXG4gICAgICAuYXR0cignY2xhc3MnLCAndGltZScpO1xuICB9KVxuXG4gIC5kcmF3KGZ1bmN0aW9uKGVsKSB7XG4gICAgdmFyIHdpZGdldCA9IHRoaXMud2lkZ2V0KCk7XG4gICAgaWYgKGVsLmRhdHVtKCkubGVuZ3RoIDwgMikgeyByZXR1cm47IH1cblxuICAgIGVsLnNlbGVjdCgnLmRpZmYnKVxuICAgICAgLmRhdHVtKGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgZCA9IGQuc2xpY2UoLTIpO1xuICAgICAgICByZXR1cm4gZFsxXS55IC0gZFswXS55O1xuICAgICAgfSlcbiAgICAgIC50ZXh0KHdpZGdldC5kaWZmRm9ybWF0KCkpO1xuXG4gICAgZWwuc2VsZWN0KCcudGltZScpXG4gICAgICAuZGF0dW0oZnVuY3Rpb24oZCkge1xuICAgICAgICBkID0gZC5zbGljZSgtMik7XG5cbiAgICAgICAgcmV0dXJuIFtkWzBdLngsIGRbMV0ueF1cbiAgICAgICAgICAubWFwKHV0aWxzLmRhdGUpXG4gICAgICAgICAgLm1hcCh3aWRnZXQudGltZUZvcm1hdCgpKTtcbiAgICAgIH0pXG4gICAgICAudGV4dChmdW5jdGlvbihkKSB7XG4gICAgICAgIHJldHVybiBbJyBmcm9tJywgZFswXSwgJ3RvJywgZFsxXV0uam9pbignICcpO1xuICAgICAgfSk7XG4gIH0pO1xuXG5cbnZhciBzcGFya2xpbmUgPSByZXF1aXJlKCcuLi92aWV3JykuZXh0ZW5kKClcbiAgLnByb3AoJ3dpZGdldCcpXG5cbiAgLnByb3AoJ2hlaWdodCcpLmRlZmF1bHQoMjUpXG5cbiAgLnByb3AoJ21hcmdpbicpLmRlZmF1bHQoe1xuICAgIHRvcDogNCxcbiAgICBsZWZ0OiA0LFxuICAgIGJvdHRvbTogNCxcbiAgICByaWdodDogNCBcbiAgfSlcblxuICAuaW5pdChmdW5jdGlvbih3aWRnZXQpIHtcbiAgICB0aGlzLndpZGdldCh3aWRnZXQpO1xuICB9KVxuXG4gIC5lbnRlcihmdW5jdGlvbihlbCkge1xuICAgIHZhciBzdmcgPSBlbC5hcHBlbmQoJ3N2ZycpXG4gICAgICAuYXBwZW5kKCdnJyk7XG5cbiAgICBzdmcuYXBwZW5kKCdwYXRoJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdyZXN0IHBhdGgnKTtcblxuICAgIHN2Zy5hcHBlbmQoJ3BhdGgnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ2RpZmYgcGF0aCcpO1xuICB9KVxuXG4gIC5kcmF3KGZ1bmN0aW9uKGVsKSB7XG4gICAgdmFyIG1hcmdpbiA9IHRoaXMubWFyZ2luKCk7XG4gICAgdmFyIHdpZHRoID0gcGFyc2VJbnQoZWwuc3R5bGUoJ3dpZHRoJykpO1xuXG4gICAgdmFyIGZ4ID0gZDMuc2NhbGUubGluZWFyKClcbiAgICAgIC5kb21haW4oZDMuZXh0ZW50KGVsLmRhdHVtKCksIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueDsgfSkpXG4gICAgICAucmFuZ2UoWzAsIHdpZHRoIC0gKG1hcmdpbi5sZWZ0ICsgbWFyZ2luLnJpZ2h0KV0pO1xuXG4gICAgdmFyIGZ5ID0gZDMuc2NhbGUubGluZWFyKClcbiAgICAgIC5kb21haW4oZDMuZXh0ZW50KGVsLmRhdHVtKCksIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueTsgfSkpXG4gICAgICAucmFuZ2UoW3RoaXMuaGVpZ2h0KCkgLSAobWFyZ2luLnRvcCArIG1hcmdpbi5ib3R0b20pLCAwXSk7XG5cbiAgICB2YXIgbGluZSA9IGQzLnN2Zy5saW5lKClcbiAgICAgIC54KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGZ4KGQueCk7IH0pXG4gICAgICAueShmdW5jdGlvbihkKSB7IHJldHVybiBmeShkLnkpOyB9KTtcblxuICAgIHZhciBzdmcgPSBlbC5zZWxlY3QoJ3N2ZycpXG4gICAgICAuYXR0cignd2lkdGgnLCB3aWR0aClcbiAgICAgIC5hdHRyKCdoZWlnaHQnLCB0aGlzLmhlaWdodCgpKVxuICAgICAgLnNlbGVjdCgnZycpXG4gICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCB1dGlscy50cmFuc2xhdGUobWFyZ2luLmxlZnQsIG1hcmdpbi50b3ApKTtcblxuICAgIHN2Zy5zZWxlY3QoJy5yZXN0LnBhdGgnKVxuICAgICAgLmF0dHIoJ2QnLCBsaW5lKTtcblxuICAgIHN2Zy5zZWxlY3QoJy5kaWZmLnBhdGgnKVxuICAgICAgLmRhdHVtKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuc2xpY2UoLTIpOyB9KVxuICAgICAgLmF0dHIoJ2QnLCBsaW5lKTtcblxuICAgIHZhciBkb3QgPSBzdmcuc2VsZWN0QWxsKCcuZG90JylcbiAgICAgIC5kYXRhKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuc2xpY2UoLTEpOyB9KTtcblxuICAgIGRvdC5lbnRlcigpLmFwcGVuZCgnY2lyY2xlJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdkb3QnKVxuICAgICAgLmF0dHIoJ3InLCA0KTtcblxuICAgIGRvdFxuICAgICAgLmF0dHIoJ2N4JywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZngoZC54KTsgfSlcbiAgICAgIC5hdHRyKCdjeScsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGZ5KGQueSk7IH0pO1xuXG4gICAgZG90LmV4aXQoKS5yZW1vdmUoKTtcbiAgfSk7XG4iLCJ2YXIgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi93aWRnZXQnKS5leHRlbmQoKVxuICAucHJvcCgnd2lkdGgnKVxuICAuZGVmYXVsdCg2MDApXG5cbiAgLnByb3AoJ2NvbHNwYW4nKVxuICAuZGVmYXVsdCgzKVxuXG4gIC5wcm9wKCd0aXRsZScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50aXRsZTsgfSlcblxuICAucHJvcCgnbWV0cmljcycpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5tZXRyaWNzOyB9KVxuXG4gIC5wcm9wKCdrZXknKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIGk7IH0pXG5cbiAgLnByb3AoJ21ldHJpY1RpdGxlJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLnRpdGxlOyB9KVxuXG4gIC5wcm9wKCd2YWx1ZXMnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudmFsdWVzOyB9KVxuXG4gIC5wcm9wKCd4JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLng7IH0pXG5cbiAgLnByb3AoJ3knKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueTsgfSlcblxuICAucHJvcCgndmFsdWVGb3JtYXQnKVxuICAuZGVmYXVsdChkMy5mb3JtYXQoJywycycpKVxuXG4gIC5wcm9wKCd0aWNrRm9ybWF0JylcbiAgLmRlZmF1bHQobnVsbClcblxuICAucHJvcCgndGlja3MnKVxuICAuZGVmYXVsdCg3KVxuXG4gIC5wcm9wKCdjb2xvcnMnKVxuICAuZGVmYXVsdChkMy5zY2FsZS5jYXRlZ29yeTEwKCkpXG5cbiAgLnByb3AoJ25vbmUnKVxuICAuZGVmYXVsdCgwKVxuXG4gIC5wcm9wKCdjaGFydCcpXG4gIC5wcm9wKCdsZWdlbmQnKVxuXG4gIC5pbml0KGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuY2hhcnQoY2hhcnQodGhpcykpO1xuICAgIHRoaXMubGVnZW5kKGxlZ2VuZCh0aGlzKSk7XG4gIH0pXG5cbiAgLmVudGVyKGZ1bmN0aW9uKGVsKSB7XG4gICAgZWwuYXR0cignY2xhc3MnLCAnbGluZXMgd2lkZ2V0Jyk7XG5cbiAgICBlbC5hcHBlbmQoJ2RpdicpXG4gICAgICAuYXR0cignY2xhc3MnLCAndGl0bGUnKTtcblxuICAgIHZhciB2YWx1ZXMgPSBlbC5hcHBlbmQoJ2RpdicpXG4gICAgICAuYXR0cignY2xhc3MnLCAndmFsdWVzJyk7XG5cbiAgICB2YWx1ZXMuYXBwZW5kKCdkaXYnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ2NoYXJ0Jyk7XG5cbiAgICB2YWx1ZXMuYXBwZW5kKCdkaXYnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ2xlZ2VuZCcpO1xuICB9KVxuXG4gIC5kcmF3KGZ1bmN0aW9uKGVsKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBub2RlID0gZWwubm9kZSgpO1xuICAgIHZhciBjb2xvcnMgPSB0aGlzLmNvbG9ycygpO1xuXG4gICAgZWwuc2VsZWN0KCcud2lkZ2V0IC50aXRsZScpXG4gICAgICAudGV4dChmdW5jdGlvbihkLCBpKSB7XG4gICAgICAgIHJldHVybiBzZWxmLnRpdGxlKCkuY2FsbChub2RlLCBkLCBpKTtcbiAgICAgIH0pO1xuXG4gICAgdmFyIHZhbHVlcyA9IGVsLnNlbGVjdCgnLnZhbHVlcycpXG4gICAgICAuZGF0dW0oZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICByZXR1cm4gc2VsZi5tZXRyaWNzKClcbiAgICAgICAgICAuY2FsbChub2RlLCBkLCBpKVxuICAgICAgICAgIC5tYXAobWV0cmljKTtcbiAgICAgIH0pO1xuXG4gICAgdmFsdWVzLnNlbGVjdCgnLmNoYXJ0JylcbiAgICAgIC5jYWxsKHRoaXMuY2hhcnQoKSk7XG5cbiAgICB2YWx1ZXMuc2VsZWN0KCcubGVnZW5kJylcbiAgICAgIC5jYWxsKHRoaXMubGVnZW5kKCkpO1xuXG4gICAgZnVuY3Rpb24gbWV0cmljKGQsIGkpIHtcbiAgICAgIHZhciBrZXkgPSBzZWxmLmtleSgpXG4gICAgICAgIC5jYWxsKG5vZGUsIGQsIGkpXG4gICAgICAgIC50b1N0cmluZygpO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgY29sb3I6IGNvbG9ycyhpKSxcbiAgICAgICAgdGl0bGU6IHNlbGYubWV0cmljVGl0bGUoKS5jYWxsKG5vZGUsIGQsIGkpLFxuICAgICAgICB2YWx1ZXM6IHNlbGYudmFsdWVzKClcbiAgICAgICAgICAuY2FsbChub2RlLCBkLCBpKVxuICAgICAgICAgIC5tYXAodmFsdWUpXG4gICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHZhbHVlKGQsIGkpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHg6IHNlbGYueCgpLmNhbGwobm9kZSwgZCwgaSksXG4gICAgICAgIHk6IHNlbGYueSgpLmNhbGwobm9kZSwgZCwgaSlcbiAgICAgIH07XG4gICAgfVxuICB9KTtcblxuXG52YXIgY2hhcnQgPSByZXF1aXJlKCcuLi92aWV3JykuZXh0ZW5kKClcbiAgLnByb3AoJ2hlaWdodCcpXG4gIC5kZWZhdWx0KDE1MClcblxuICAucHJvcCgnbWFyZ2luJylcbiAgLmRlZmF1bHQoe1xuICAgIHRvcDogNCxcbiAgICBsZWZ0OiAyNSxcbiAgICByaWdodDogMjUsXG4gICAgYm90dG9tOiAyNVxuICB9KVxuXG4gIC5wcm9wKCd3aWRnZXQnKVxuXG4gIC5pbml0KGZ1bmN0aW9uKHdpZGdldCkge1xuICAgIHRoaXMud2lkZ2V0KHdpZGdldCk7XG4gIH0pXG5cbiAgLmVudGVyKGZ1bmN0aW9uKGVsKSB7XG4gICAgdmFyIHN2ZyA9IGVsLmFwcGVuZCgnc3ZnJylcbiAgICAgIC5hcHBlbmQoJ2cnKTtcblxuICAgIHN2Zy5hcHBlbmQoJ2cnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ2xpbmVzJyk7XG5cbiAgICBzdmcuYXBwZW5kKCdnJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdheGlzJyk7XG4gIH0pXG5cbiAgLmRyYXcoZnVuY3Rpb24oZWwpIHtcbiAgICB2YXIgbWFyZ2luID0gdGhpcy5tYXJnaW4oKTtcbiAgICB2YXIgd2lkdGggPSBwYXJzZUludChlbC5zdHlsZSgnd2lkdGgnKSk7XG4gICAgdmFyIGlubmVySGVpZ2h0ID0gdGhpcy5oZWlnaHQoKSAtIChtYXJnaW4udG9wICsgbWFyZ2luLmJvdHRvbSk7XG5cbiAgICB2YXIgYWxsVmFsdWVzID0gZWxcbiAgICAgIC5kYXR1bSgpXG4gICAgICAucmVkdWNlKGZ1bmN0aW9uKHJlc3VsdHMsIG1ldHJpYykge1xuICAgICAgICByZXN1bHRzLnB1c2guYXBwbHkocmVzdWx0cywgbWV0cmljLnZhbHVlcyk7XG4gICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgICAgfSwgW10pO1xuXG4gICAgdmFyIGZ4ID0gZDMudGltZS5zY2FsZSgpXG4gICAgICAuZG9tYWluKGQzLmV4dGVudChhbGxWYWx1ZXMsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueDsgfSkpXG4gICAgICAucmFuZ2UoWzAsIHdpZHRoIC0gKG1hcmdpbi5sZWZ0ICsgbWFyZ2luLnJpZ2h0KV0pO1xuXG4gICAgdmFyIGZ5ID0gZDMuc2NhbGUubGluZWFyKClcbiAgICAgIC5kb21haW4oZDMuZXh0ZW50KGFsbFZhbHVlcywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC55OyB9KSlcbiAgICAgIC5yYW5nZShbaW5uZXJIZWlnaHQsIDBdKTtcblxuICAgIHZhciBheGlzID0gZDMuc3ZnLmF4aXMoKVxuICAgICAgLnNjYWxlKGZ4KVxuICAgICAgLnRpY2tzKHRoaXMud2lkZ2V0KCkudGlja3MoKSlcbiAgICAgIC50aWNrRm9ybWF0KHRoaXMud2lkZ2V0KCkudGlja0Zvcm1hdCgpKTtcblxuICAgIHZhciBsaW5lID0gZDMuc3ZnLmxpbmUoKVxuICAgICAgLngoZnVuY3Rpb24oZCkgeyByZXR1cm4gZngoZC54KTsgfSlcbiAgICAgIC55KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGZ5KGQueSk7IH0pO1xuXG4gICAgdmFyIHN2ZyA9IGVsLnNlbGVjdCgnc3ZnJylcbiAgICAgIC5hdHRyKCd3aWR0aCcsIHdpZHRoKVxuICAgICAgLmF0dHIoJ2hlaWdodCcsIHRoaXMuaGVpZ2h0KCkpXG4gICAgICAuc2VsZWN0KCdnJylcbiAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIHV0aWxzLnRyYW5zbGF0ZShtYXJnaW4ubGVmdCwgbWFyZ2luLnRvcCkpO1xuXG4gICAgdmFyIG1ldHJpYyA9IHN2Zy5zZWxlY3QoJy5saW5lcycpLnNlbGVjdEFsbCgnLm1ldHJpYycpXG4gICAgICAuZGF0YShmdW5jdGlvbihkKSB7IHJldHVybiBkOyB9LFxuICAgICAgICAgICAgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5rZXk7IH0pO1xuXG4gICAgbWV0cmljLmVudGVyKCkuYXBwZW5kKCdnJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdtZXRyaWMnKVxuICAgICAgLmF0dHIoJ2RhdGEta2V5JywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5rZXk7IH0pXG4gICAgICAuYXBwZW5kKCdwYXRoJylcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2xpbmUnKTtcblxuICAgIG1ldHJpYy5zZWxlY3QoJy5saW5lJylcbiAgICAgIC5hdHRyKCdzdHJva2UnLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLmNvbG9yOyB9KVxuICAgICAgLmF0dHIoJ2QnLCBmdW5jdGlvbihkKSB7IHJldHVybiBsaW5lKGQudmFsdWVzKTsgfSk7XG5cbiAgICB2YXIgZG90ID0gbWV0cmljLnNlbGVjdEFsbCgnLmRvdCcpXG4gICAgICAuZGF0YShmdW5jdGlvbihkKSB7XG4gICAgICAgIGlmICghZC52YWx1ZXMubGVuZ3RoKSB7IHJldHVybiBbXTsgfVxuICAgICAgICB2YXIgbGFzdCA9IGQudmFsdWVzW2QudmFsdWVzLmxlbmd0aCAtIDFdO1xuXG4gICAgICAgIHJldHVybiBbe1xuICAgICAgICAgIHg6IGxhc3QueCxcbiAgICAgICAgICB5OiBsYXN0LnksXG4gICAgICAgICAgY29sb3I6IGQuY29sb3JcbiAgICAgICAgfV07XG4gICAgICB9KTtcblxuICAgIGRvdC5lbnRlcigpLmFwcGVuZCgnY2lyY2xlJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdkb3QnKVxuICAgICAgLmF0dHIoJ3InLCA0KTtcblxuICAgIGRvdFxuICAgICAgLmF0dHIoJ2ZpbGwnLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLmNvbG9yOyB9KVxuICAgICAgLmF0dHIoJ2N4JywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZngoZC54KTsgfSlcbiAgICAgIC5hdHRyKCdjeScsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGZ5KGQueSk7IH0pO1xuXG4gICAgZG90LmV4aXQoKVxuICAgICAgLnJlbW92ZSgpO1xuXG4gICAgbWV0cmljLmV4aXQoKVxuICAgICAgLnJlbW92ZSgpO1xuXG4gICAgc3ZnXG4gICAgICAuc2VsZWN0KCcuYXhpcycpXG4gICAgICAuYXR0cigndHJhbnNmb3JtJywgdXRpbHMudHJhbnNsYXRlKDAsIGlubmVySGVpZ2h0KSlcbiAgICAgIC5jYWxsKGF4aXMpO1xuICB9KTtcblxuXG52YXIgbGVnZW5kID0gcmVxdWlyZSgnLi4vdmlldycpLmV4dGVuZCgpXG4gIC5wcm9wKCd3aWRnZXQnKVxuXG4gIC5pbml0KGZ1bmN0aW9uKHdpZGdldCkge1xuICAgIHRoaXMud2lkZ2V0KHdpZGdldCk7XG4gIH0pXG5cbiAgLmVudGVyKGZ1bmN0aW9uKGVsKSB7XG4gICAgZWwuYXBwZW5kKCd0YWJsZScpXG4gICAgICAuYXR0cignY2xhc3MnLCAndGFibGUnKTtcbiAgfSlcblxuICAuZHJhdyhmdW5jdGlvbihlbCkge1xuICAgIHZhciBub25lID0gdGhpcy53aWRnZXQoKS5ub25lKCk7XG4gICAgdmFyIHZhbHVlRm9ybWF0ID0gdGhpcy53aWRnZXQoKS52YWx1ZUZvcm1hdCgpO1xuXG4gICAgdmFyIG1ldHJpYyA9IGVsLnNlbGVjdCgnLnRhYmxlJykuc2VsZWN0QWxsKCcubWV0cmljJylcbiAgICAgIC5kYXRhKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQ7IH0sXG4gICAgICAgICAgICBmdW5jdGlvbihkKSB7IHJldHVybiBkLmtleTsgfSk7XG5cbiAgICB2YXIgZW50ZXJNZXRyaWMgPSBtZXRyaWMuZW50ZXIoKS5hcHBlbmQoJ3RyJylcbiAgICAgIC5hdHRyKCdkYXRhLWtleScsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQua2V5OyB9KVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ21ldHJpYycpO1xuXG4gICAgZW50ZXJNZXRyaWMuYXBwZW5kKCd0ZCcpXG4gICAgICAuYXR0cignY2xhc3MnLCAnc3dhdGNoJyk7XG5cbiAgICBlbnRlck1ldHJpYy5hcHBlbmQoJ3RkJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd0aXRsZScpO1xuXG4gICAgZW50ZXJNZXRyaWMuYXBwZW5kKCd0ZCcpXG4gICAgICAuYXR0cignY2xhc3MnLCAndmFsdWUnKTtcblxuICAgIG1ldHJpYy5zZWxlY3QoJy5zd2F0Y2gnKVxuICAgICAgLnN0eWxlKCdiYWNrZ3JvdW5kJywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5jb2xvcjsgfSk7XG5cbiAgICBtZXRyaWMuc2VsZWN0KCcudGl0bGUnKVxuICAgICAgLnRleHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50aXRsZTsgfSk7XG5cbiAgICBtZXRyaWMuc2VsZWN0KCcudmFsdWUnKVxuICAgICAgLnRleHQoZnVuY3Rpb24oZCkge1xuICAgICAgICBkID0gZC52YWx1ZXNbZC52YWx1ZXMubGVuZ3RoIC0gMV07XG5cbiAgICAgICAgcmV0dXJuIGRcbiAgICAgICAgICA/IHZhbHVlRm9ybWF0KGQueSlcbiAgICAgICAgICA6IHZhbHVlRm9ybWF0KG5vbmUpO1xuICAgICAgfSk7XG5cbiAgICBtZXRyaWMuZXhpdCgpXG4gICAgICAucmVtb3ZlKCk7XG4gIH0pO1xuIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuLi92aWV3JykuZXh0ZW5kKClcbiAgLnByb3AoJ3N0YW5kYWxvbmUnKVxuICAuZGVmYXVsdCh0cnVlKVxuXG4gIC5wcm9wKCdjb2xzcGFuJylcbiAgLmRlZmF1bHQoMSlcblxuICAucHJvcCgncm93c3BhbicpXG4gIC5kZWZhdWx0KDEpXG5cbiAgLnByb3AoJ3dpZHRoJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdCgxMDApXG5cbiAgLnByb3AoJ2hlaWdodCcpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoMTAwKVxuXG4gIC5kcmF3KGZ1bmN0aW9uKGVsKSB7XG4gICAgaWYgKCF0aGlzLnN0YW5kYWxvbmUoKSkgeyByZXR1cm47IH1cbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICBlbC5zdHlsZSgnd2lkdGgnLCBmdW5jdGlvbihkLCBpKSB7XG4gICAgICAgIHJldHVybiBzZWxmLndpZHRoKCkuY2FsbCh0aGlzLCBkLCBpKSArICdweCc7XG4gICAgICB9KVxuICAgICAgLnN0eWxlKCdtaW4taGVpZ2h0JywgZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICByZXR1cm4gc2VsZi5oZWlnaHQoKS5jYWxsKHRoaXMsIGQsIGkpICsgJ3B4JztcbiAgICAgIH0pO1xuICB9KTtcbiJdfQ==
(3)
});
