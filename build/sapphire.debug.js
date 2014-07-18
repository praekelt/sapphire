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

},{"./grid":2,"./utils":4,"./view":5,"./widgets":7}],2:[function(_dereq_,module,exports){
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

},{"./dashboard":1,"./grid":2,"./utils":4,"./view":5,"./widgets":7}],4:[function(_dereq_,module,exports){
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


utils.box = strain()
  .prop('width')
  .default(0)

  .prop('height')
  .default(0)

  .prop('margin')
  .default({
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  })

  .meth(function calc() {
    var d = {};
    d.margin = this.margin();
    d.width = this.width();
    d.height = this.height();
    d.innerWidth = d.width - d.margin.left - d.margin.right;
    d.innerHeight = d.height - d.margin.top - d.margin.bottom;
    return d;
  })

  .invoke(function() {
    return this.calc();
  });

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
      this.enter.apply(this, arguments);
    }

    var parent = this._type_._super_.prototype;
    if ('_draw_' in parent) {
      parent._draw_.apply(this, arguments);
    }

    return this._draw_.apply(this, arguments);
  })

  .meth(function enter(el) {
    el = sapphire.utils.ensureEl(el);

    var parent = this._type_._super_.prototype;
    if ('_enter_' in parent) {
      parent._enter_.apply(this, arguments);
    }

    this._enter_.apply(this, arguments);
  })

  .invoke(function() {
    return this.draw.apply(this, arguments);
  });

},{}],6:[function(_dereq_,module,exports){
var utils = _dereq_('../utils');


module.exports = _dereq_('./widget').extend()
  .prop('width')
  .default(400)

  .prop('colspan')
  .default(4)

  .prop('rowspan')
  .default(2)

  .prop('height')
  .default(200)

  .prop('barPadding')
  .default(2.5)

  .prop('margin')
  .default({
    top: 10,
    left: 35,
    right: 15,
    bottom: 20
  })

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

  .prop('dx')
  .set(d3.functor)
  .default(null)

  .prop('xFormat')
  .default(null)

  .prop('xTicks')
  .default(8)

  .prop('yFormat')
  .default(d3.format('.2s'))

  .prop('yTicks')
  .default(5)

  .prop('colors')

  .init(function() {
    this.colors(d3.scale.category10());
  })

  .meth(function normalize(el) {
    var self = this;
    var node = el.node();

    el.datum(function(d, i) {
      var values = self.values()
        .call(node, d, i)
        .map(value);

      var len = values.length;
      var dxAvg = values.length
        ? (values[len - 1].x - values[0].x) / len
        : 0;

      values.forEach(function(d) {
        d.dx = utils.ensure(d.dx, dxAvg);
      });

      return {
        values: values,
        title: self.title().call(node, d, i)
      };
    });

    function value(d, i) {
      return {
        x: self.x().call(node, d, i),
        y: self.y().call(node, d, i),
        dx: self.dx().call(node, d, i)
      };
    }
  })

  .enter(function(el) {
    el.attr('class', 'histogram widget');

    el.append('div')
      .attr('class', 'title');

    var svg = el.append('div')
      .attr('class', 'chart')
      .append('svg')
      .append('g');

    svg.append('g')
      .attr('class', 'bars');

    svg.append('g')
      .attr('class', 'y axis');

    svg.append('g')
      .attr('class', 'x axis');
  })

  .draw(function(el) {
    var self = this;
    this.normalize(el);

    el.style('height', el.style('min-height'));

    el.select('.widget .title')
      .text(function(d) { return d.title; });

    var chart = el.select('.chart')
      .datum(function(d) { return d.values; });

    var fx = d3.time.scale()
      .domain([
        d3.min(chart.datum(), function(d) { return d.x; }),
        d3.max(chart.datum(), function(d) { return d.x + d.dx; })]);

    var fy = d3.scale.linear()
      .domain([0, d3.max(chart.datum(), function(d) { return d.y; })]);

    var dims = utils.box()
      .width(parseInt(chart.style('width')))
      .height(parseInt(chart.style('height')))
      .margin(this.margin())
      .calc();

    chart
      .style('width', dims.width + 'px')
      .style('height', dims.height + 'px');

    fx.range([0, dims.innerWidth]);
    fy.range([dims.innerHeight, 0]);

    var svg = chart.select('svg')
      .attr('width', dims.width)
      .attr('height', dims.height)
      .select('g')
        .attr('transform', utils.translate(dims.margin.left, dims.margin.top));

    var bar = svg.select('.bars')
      .selectAll('.bar')
      .data(function(d) { return d; },
            function(d) { return d.x; });

    bar.enter().append('g')
      .attr('class', 'bar')
      .append('rect');

    bar
      .attr('transform', function(d) {
        return utils.translate(fx(d.x), fy(d.y));
      });

    bar.select('rect')
      .style('fill', this.colors()(el.datum().title))
      .attr('width', function(d) {
        var width = fx(d.x + d.dx) - fx(d.x);
        width -= self.barPadding();
        return Math.max(width, 1);
      })
      .attr('height', function(d) {
        return dims.innerHeight - fy(d.y); 
      });

    bar.exit()
      .remove();

    var axis = d3.svg.axis()
      .scale(fx)
      .ticks(this.xTicks())
      .tickFormat(this.xFormat());

    svg.select('.x.axis')
      .attr('transform', utils.translate(0, dims.innerHeight))
      .call(axis);

    axis = d3.svg.axis()
      .orient('left')
      .scale(fy)
      .tickPadding(8)
      .tickSize(-dims.innerWidth)
      .ticks(this.yTicks())
      .tickFormat(this.yFormat());
    
    svg.select('.y.axis')
      .call(axis);
  });

},{"../utils":4,"./widget":10}],7:[function(_dereq_,module,exports){
exports.widget = _dereq_('./widget');
exports.lines = _dereq_('./lines');
exports.last = _dereq_('./last');
exports.histogram = _dereq_('./histogram');

},{"./histogram":6,"./last":8,"./lines":9,"./widget":10}],8:[function(_dereq_,module,exports){
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

  .prop('summaryLimit')
  .default(2)
  .set(function(v) { return Math.max(utils.ensure(v, 2), 2); })

  .prop('sparklineLimit')
  .default(15)
  .set(function(v) { return Math.max(utils.ensure(v, 2), 2); })

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

    if (el.datum().length < this.widget().summaryLimit()) {
      el.style('height', 0);
      return;
    }

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

  .prop('height')
  .default(25)

  .prop('margin')
  .default({
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
    if (el.datum().length < this.widget().sparklineLimit()) {
      el.style('height', 0);
      return;
    }

    var dims = utils.box()
      .margin(this.margin())
      .width(parseInt(el.style('width')))
      .height(this.height())
      .calc();

    var fx = d3.scale.linear()
      .domain(d3.extent(el.datum(), function(d) { return d.x; }))
      .range([0, dims.innerWidth]);

    var fy = d3.scale.linear()
      .domain(d3.extent(el.datum(), function(d) { return d.y; }))
      .range([dims.innerHeight, 0]);

    var line = d3.svg.line()
      .x(function(d) { return fx(d.x); })
      .y(function(d) { return fy(d.y); });

    var svg = el.select('svg')
      .attr('width', dims.width)
      .attr('height', dims.height)
      .select('g')
        .attr('transform', utils.translate(dims.margin.left, dims.margin.top));

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

},{"../utils":4,"../view":5,"./widget":10}],9:[function(_dereq_,module,exports){
var utils = _dereq_('../utils');


module.exports = _dereq_('./widget').extend()
  .prop('width')
  .default(400)

  .prop('colspan')
  .default(4)

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

  .prop('xFormat')
  .default(null)

  .prop('xTicks')
  .default(8)

  .prop('yFormat')
  .default(d3.format('.2s'))

  .prop('yTicks')
  .default(5)

  .prop('valueFormat')
  .default(d3.format(',2s'))

  .prop('none')
  .default(0)

  .prop('colors')
  .prop('chart')
  .prop('legend')

  .init(function() {
    this.chart(chart(this));
    this.legend(legend(this));
    this.colors(d3.scale.category10());
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

  .meth(function normalize(el) {
    var self = this;
    var node = el.node();

    el.datum(function(d, i) {
      var title = self.title().call(node, d, i);

      return {
        title: title,
        metrics: self.metrics()
          .call(node, d, i)
          .map(metric)
      };
    });

    function metric(d, i) {
      var key = self.key()
        .call(node, d, i)
        .toString();

      return {
        key: key,
        color: self.colors()(key),
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
  })

  .draw(function(el) {
    this.normalize(el);

    el.select('.widget .title')
      .text(function(d) { return d.title; });

    var values = el.select('.values')
      .datum(function(d, i) { return d.metrics; });

    values.select('.chart')
      .call(this.chart());

    values.select('.legend')
      .call(this.legend());
  });


var chart = _dereq_('../view').extend()
  .prop('height')
  .default(150)

  .prop('margin')
  .default({
    top: 10,
    left: 35,
    right: 15,
    bottom: 20
  })

  .prop('widget')

  .init(function(widget) {
    this.widget(widget);
  })

  .enter(function(el) {
    var svg = el.append('svg')
      .append('g');

    svg.append('g')
      .attr('class', 'x axis');

    svg.append('g')
      .attr('class', 'y axis');

    svg.append('g')
      .attr('class', 'lines');
  })

  .draw(function(el) {
    var dims = utils.box()
      .margin(this.margin())
      .width(parseInt(el.style('width')))
      .height(this.height())
      .calc();

    var allValues = el
      .datum()
      .reduce(function(results, metric) {
        results.push.apply(results, metric.values);
        return results;
      }, []);

    var fx = d3.time.scale()
      .domain(d3.extent(allValues, function(d) { return d.x; }))
      .range([0, dims.innerWidth]);

    var fy = d3.scale.linear()
      .domain(d3.extent(allValues, function(d) { return d.y; }))
      .range([dims.innerHeight, 0]);

    var line = d3.svg.line()
      .x(function(d) { return fx(d.x); })
      .y(function(d) { return fy(d.y); });

    var svg = el.select('svg')
      .attr('width', dims.width)
      .attr('height', dims.height)
      .select('g')
        .attr('transform', utils.translate(dims.margin.left, dims.margin.top));

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

    var axis = d3.svg.axis()
      .scale(fx)
      .tickPadding(8)
      .ticks(this.widget().xTicks())
      .tickFormat(this.widget().xFormat())
      .tickSize(-dims.innerHeight);

    svg.select('.x.axis')
      .attr('transform', utils.translate(0, dims.innerHeight))
      .call(axis);

    axis = d3.svg.axis()
      .orient('left')
      .scale(fy)
      .tickPadding(8)
      .ticks(this.widget().yTicks())
      .tickFormat(this.widget().yFormat())
      .tickSize(-dims.innerWidth);
    
    svg.select('.y.axis')
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

},{"../utils":4,"../view":5,"./widget":10}],10:[function(_dereq_,module,exports){
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy9kYXNoYm9hcmQuanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvZ3JpZC5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy9pbmRleC5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy91dGlscy5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy92aWV3LmpzIiwiL2hvbWUvanVzdGluL3ByYWVrZWx0L3NhcHBoaXJlL3NyYy9zY3JpcHRzL3dpZGdldHMvaGlzdG9ncmFtLmpzIiwiL2hvbWUvanVzdGluL3ByYWVrZWx0L3NhcHBoaXJlL3NyYy9zY3JpcHRzL3dpZGdldHMvaW5kZXguanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvd2lkZ2V0cy9sYXN0LmpzIiwiL2hvbWUvanVzdGluL3ByYWVrZWx0L3NhcHBoaXJlL3NyYy9zY3JpcHRzL3dpZGdldHMvbGluZXMuanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvd2lkZ2V0cy93aWRnZXQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaktBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0UEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcbnZhciBsYXlvdXQgPSByZXF1aXJlKCcuL2dyaWQnKTtcbnZhciB3aWRnZXRzID0gcmVxdWlyZSgnLi93aWRnZXRzJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL3ZpZXcnKS5leHRlbmQoKVxuICAucHJvcCgnc2NhbGUnKVxuICAuZGVmYXVsdCgxMDApXG5cbiAgLnByb3AoJ3R5cGVzJylcblxuICAucHJvcCgndGl0bGUnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGl0bGU7IH0pXG5cbiAgLnByb3AoJ2tleScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gaTsgfSlcblxuICAucHJvcCgndHlwZScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50eXBlOyB9KVxuXG4gIC5wcm9wKCd3aWRnZXRzJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLndpZGdldHM7IH0pXG5cbiAgLnByb3AoJ2NvbCcpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkge1xuICAgIHJldHVybiB1dGlscy5hY2Nlc3MoZCwgJ2NvbCcpO1xuICB9KVxuXG4gIC5wcm9wKCdyb3cnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHtcbiAgICByZXR1cm4gdXRpbHMuYWNjZXNzKGQsICdyb3cnKTtcbiAgfSlcblxuICAucHJvcCgnY29sc3BhbicpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkge1xuICAgIHJldHVybiB1dGlscy5hY2Nlc3MoZCwgJ2NvbHNwYW4nKTtcbiAgfSlcblxuICAucHJvcCgncm93c3BhbicpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkge1xuICAgIHJldHVybiB1dGlscy5hY2Nlc3MoZCwgJ3Jvd3NwYW4nKTtcbiAgfSlcblxuICAucHJvcCgnbnVtY29scycpXG4gIC5kZWZhdWx0KDgpXG5cbiAgLnByb3AoJ3BhZGRpbmcnKVxuICAuZGVmYXVsdCg1KVxuXG4gIC5pbml0KGZ1bmN0aW9uKCkge1xuICAgIHZhciB0eXBlcyA9IGQzLm1hcCgpO1xuXG4gICAgZDMua2V5cyh3aWRnZXRzKS5mb3JFYWNoKGZ1bmN0aW9uKGspIHtcbiAgICAgIHR5cGVzLnNldChrLCB3aWRnZXRzW2tdLm5ldygpKTtcbiAgICB9KTtcblxuICAgIHRoaXMudHlwZXModHlwZXMpO1xuICB9KVxuXG4gIC5lbnRlcihmdW5jdGlvbihlbCkge1xuICAgIGVsLmF0dHIoJ2NsYXNzJywgJ2Rhc2hib2FyZCcpXG4gICAgICAuYXBwZW5kKCdkaXYnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnd2lkZ2V0cycpO1xuICB9KVxuXG4gIC5kcmF3KGZ1bmN0aW9uKGVsKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBub2RlID0gZWwubm9kZSgpO1xuXG4gICAgdGhpcy50eXBlcygpXG4gICAgICAuZm9yRWFjaChmdW5jdGlvbihuYW1lLCB0eXBlKSB7IHR5cGUuc3RhbmRhbG9uZShmYWxzZSk7IH0pO1xuXG4gICAgdmFyIGdyaWQgPSBsYXlvdXQoKVxuICAgICAgLnNjYWxlKHRoaXMuc2NhbGUoKSlcbiAgICAgIC5udW1jb2xzKHRoaXMubnVtY29scygpKVxuICAgICAgLnBhZGRpbmcodGhpcy5wYWRkaW5nKCkpXG4gICAgICAuY29sKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuY29sOyB9KVxuICAgICAgLnJvdyhmdW5jdGlvbihkKSB7IHJldHVybiBkLnJvdzsgfSlcbiAgICAgIC5jb2xzcGFuKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuY29sc3BhbjsgfSlcbiAgICAgIC5yb3dzcGFuKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQucm93c3BhbjsgfSk7XG4gICAgXG4gICAgZWwuc3R5bGUoJ3dpZHRoJywgKGdyaWQuc2NhbGUoKSAqIGdyaWQubnVtY29scygpKSArICdweCcpO1xuXG4gICAgdmFyIHdpZGdldHMgPSBlbC5zZWxlY3QoJy53aWRnZXRzJylcbiAgICAgIC5kYXR1bSh3aWRnZXREYXRhKTtcblxuICAgIHZhciB3aWRnZXQgPSB3aWRnZXRzLnNlbGVjdEFsbCgnLndpZGdldCcpXG4gICAgICAuZGF0YShmdW5jdGlvbihkKSB7IHJldHVybiBkOyB9LCB3aWRnZXRLZXkpO1xuXG4gICAgd2lkZ2V0LmVudGVyKCkuYXBwZW5kKCdkaXYnKVxuICAgICAgLmF0dHIoJ2RhdGEta2V5Jywgd2lkZ2V0S2V5KTtcblxuICAgIHdpZGdldFxuICAgICAgLmNsYXNzZWQoJ3dpZGdldCcsIHRydWUpXG4gICAgICAuc3R5bGUoJ3dpZHRoJywgZnVuY3Rpb24oZCkge1xuICAgICAgICByZXR1cm4gZ3JpZC5zcGFuTGVuZ3RoKGQuY29sc3BhbikgKyAncHgnO1xuICAgICAgfSlcbiAgICAgIC5zdHlsZSgnbWluLWhlaWdodCcsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuIGdyaWQuc3Bhbkxlbmd0aChkLnJvd3NwYW4pICsgJ3B4JztcbiAgICAgIH0pXG4gICAgICAuZWFjaChmdW5jdGlvbihkKSB7XG4gICAgICAgIHZhciB3aWRnZXRFbCA9IGQzLnNlbGVjdCh0aGlzKVxuICAgICAgICAgIC5kYXR1bShkLmRhdGEpXG4gICAgICAgICAgLmNhbGwoZC50eXBlKTtcblxuICAgICAgICB2YXIgd2lkdGggPSBwYXJzZUludCh3aWRnZXRFbC5zdHlsZSgnd2lkdGgnKSk7XG4gICAgICAgIGQuY29sc3BhbiA9IE1hdGgubWF4KGQuY29sc3BhbiwgZ3JpZC5sZW5ndGhTcGFuKHdpZHRoKSk7XG5cbiAgICAgICAgdmFyIGhlaWdodCA9IHBhcnNlSW50KHdpZGdldEVsLnN0eWxlKCdoZWlnaHQnKSk7XG4gICAgICAgIGQucm93c3BhbiA9IE1hdGgubWF4KGQucm93c3BhbiwgZ3JpZC5sZW5ndGhTcGFuKGhlaWdodCkpO1xuICAgICAgfSk7XG5cbiAgICB2YXIgZ3JpZEVscyA9IGdyaWQod2lkZ2V0cy5kYXR1bSgpKTtcblxuICAgIHdpZGdldFxuICAgICAgLnN0eWxlKCdsZWZ0JywgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gZ3JpZEVsc1tpXS54ICsgJ3B4JzsgfSlcbiAgICAgIC5zdHlsZSgndG9wJywgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gZ3JpZEVsc1tpXS55ICsgJ3B4JzsgfSlcbiAgICAgIC5zdHlsZSgnd2lkdGgnLCBmdW5jdGlvbihkLCBpKSB7IHJldHVybiBncmlkRWxzW2ldLndpZHRoICsgJ3B4JzsgfSlcbiAgICAgIC5zdHlsZSgnaGVpZ2h0JywgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gZ3JpZEVsc1tpXS5oZWlnaHQgKyAncHgnOyB9KTtcblxuICAgIHdpZGdldC5leGl0KCkucmVtb3ZlKCk7XG5cbiAgICBmdW5jdGlvbiB3aWRnZXREYXRhKGQsIGkpIHtcbiAgICAgIHJldHVybiBzZWxmLndpZGdldHMoKVxuICAgICAgICAuY2FsbChub2RlLCBkLCBpKVxuICAgICAgICAubWFwKHdpZGdldERhdHVtKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB3aWRnZXREYXR1bShkLCBpKSB7XG4gICAgICB2YXIgdHlwZW5hbWUgPSBzZWxmLnR5cGUoKS5jYWxsKG5vZGUsIGQsIGkpO1xuICAgICAgdmFyIHR5cGUgPSBzZWxmLnR5cGVzKCkuZ2V0KHR5cGVuYW1lKTtcblxuICAgICAgaWYgKCF0eXBlKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVucmVjb2duaXNlZCBkYXNoYm9hcmQgd2lkZ2V0IHR5cGUgJ1wiICsgdHlwZW5hbWUgKyBcIidcIik7XG4gICAgICB9XG5cbiAgICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICAgIHJlc3VsdC5kYXRhID0gZDtcbiAgICAgIHJlc3VsdC50eXBlID0gdHlwZTtcbiAgICAgIHJlc3VsdC5rZXkgPSBzZWxmLmtleSgpLmNhbGwobm9kZSwgZCwgaSk7XG4gICAgICByZXN1bHQuY29sID0gc2VsZi5jb2woKS5jYWxsKG5vZGUsIGQsIGkpO1xuICAgICAgcmVzdWx0LnJvdyA9IHNlbGYucm93KCkuY2FsbChub2RlLCBkLCBpKTtcbiAgICAgIHJlc3VsdC5jb2xzcGFuID0gc2VsZi5jb2xzcGFuKCkuY2FsbChub2RlLCBkLCBpKTtcbiAgICAgIHJlc3VsdC5jb2xzcGFuID0gdXRpbHMuZW5zdXJlKHJlc3VsdC5jb2xzcGFuLCB0eXBlLmNvbHNwYW4oKSk7XG4gICAgICByZXN1bHQucm93c3BhbiA9IHNlbGYucm93c3BhbigpLmNhbGwobm9kZSwgZCwgaSk7XG4gICAgICByZXN1bHQucm93c3BhbiA9IHV0aWxzLmVuc3VyZShyZXN1bHQucm93c3BhbiwgdHlwZS5yb3dzcGFuKCkpO1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB3aWRnZXRLZXkoZCkge1xuICAgICAgcmV0dXJuIGQua2V5O1xuICAgIH1cbiAgfSk7XG4iLCJ2YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG5cblxudmFyIGdyaWQgPSBtb2R1bGUuZXhwb3J0cyA9IHN0cmFpbigpXG4gIC5wcm9wKCdjb2wnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHtcbiAgICByZXR1cm4gdXRpbHMuYWNjZXNzKGQsICdjb2wnKTtcbiAgfSlcblxuICAucHJvcCgncm93JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7XG4gICAgcmV0dXJuIHV0aWxzLmFjY2VzcyhkLCAncm93Jyk7XG4gIH0pXG5cbiAgLnByb3AoJ251bWNvbHMnKVxuICAuZGVmYXVsdCg4KVxuXG4gIC5wcm9wKCdzY2FsZScpXG4gIC5kZWZhdWx0KDEwKVxuXG4gIC5wcm9wKCdwYWRkaW5nJylcbiAgLmRlZmF1bHQoNSlcblxuICAucHJvcCgnY29sc3BhbicpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkge1xuICAgIHJldHVybiB1dGlscy5hY2Nlc3MoZCwgJ2NvbHNwYW4nLCAxKTtcbiAgfSlcblxuICAucHJvcCgncm93c3BhbicpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkge1xuICAgIHJldHVybiB1dGlscy5hY2Nlc3MoZCwgJ3Jvd3NwYW4nLCAxKTtcbiAgfSlcblxuICAuaW52b2tlKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIGJlc3QgPSBjb3VudGVyKCkubnVtY29scyh0aGlzLm51bWNvbHMoKSk7XG5cbiAgICBkYXRhID0gKGRhdGEgfHwgW10pXG4gICAgICAubWFwKGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBkYXRhOiBkLFxuICAgICAgICAgIGNvbDogc2VsZi5jb2woKS5jYWxsKHNlbGYsIGQsIGkpLCBcbiAgICAgICAgICByb3c6IHNlbGYucm93KCkuY2FsbChzZWxmLCBkLCBpKSxcbiAgICAgICAgICByb3dzcGFuOiBzZWxmLnJvd3NwYW4oKS5jYWxsKHNlbGYsIGQsIGkpLFxuICAgICAgICAgIGNvbHNwYW46IHNlbGYuY29sc3BhbigpLmNhbGwoc2VsZiwgZCwgaSlcbiAgICAgICAgfTtcbiAgICAgIH0pXG4gICAgICAubWFwKGJlc3QpO1xuXG4gICAgdmFyIHF1YWR0cmVlID0gZDMuZ2VvbS5xdWFkdHJlZSgpXG4gICAgICAueChmdW5jdGlvbihkKSB7IHJldHVybiBkLmNvbDsgfSlcbiAgICAgIC55KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQucm93OyB9KTtcblxuICAgIHZhciByb290ID0gcXVhZHRyZWUoZGF0YSk7XG5cbiAgICBkYXRhLmZvckVhY2goZnVuY3Rpb24oZCkge1xuICAgICAgcm9vdC52aXNpdChncmlkLnVuY29sbGlkZShkKSk7XG4gICAgICBkLnggPSBzZWxmLmluZGV4T2Zmc2V0KGQuY29sKTtcbiAgICAgIGQueSA9IHNlbGYuaW5kZXhPZmZzZXQoZC5yb3cpO1xuICAgICAgZC53aWR0aCA9IHNlbGYuc3Bhbkxlbmd0aChkLmNvbHNwYW4pO1xuICAgICAgZC5oZWlnaHQgPSBzZWxmLnNwYW5MZW5ndGgoZC5yb3dzcGFuKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBkYXRhO1xuICB9KVxuXG4gIC5tZXRoKGZ1bmN0aW9uIGluZGV4T2Zmc2V0KGluZGV4KSB7XG4gICAgcmV0dXJuIChpbmRleCAqIHRoaXMuc2NhbGUoKSkgKyB0aGlzLnBhZGRpbmcoKTtcbiAgfSlcblxuICAubWV0aChmdW5jdGlvbiBzcGFuTGVuZ3RoKHNwYW4pIHtcbiAgICByZXR1cm4gKHNwYW4gKiB0aGlzLnNjYWxlKCkpIC0gKHRoaXMucGFkZGluZygpICogMik7XG4gIH0pXG5cbiAgLm1ldGgoZnVuY3Rpb24gb2Zmc2V0SW5kZXgob2Zmc2V0KSB7XG4gICAgcmV0dXJuIE1hdGguY2VpbCgob2Zmc2V0IC0gdGhpcy5wYWRkaW5nKCkpIC8gdGhpcy5zY2FsZSgpKTtcbiAgfSlcblxuICAubWV0aChmdW5jdGlvbiBsZW5ndGhTcGFuKGxlbikge1xuICAgIHJldHVybiBNYXRoLmNlaWwoKGxlbiArICh0aGlzLnBhZGRpbmcoKSAqIDIpKSAvIHRoaXMuc2NhbGUoKSk7XG4gIH0pXG5cbiAgLnN0YXRpYyhmdW5jdGlvbiBib3goZCkge1xuICAgIHJldHVybiB7XG4gICAgICB4MTogZC5jb2wsXG4gICAgICB4MjogZC5jb2wgKyBkLmNvbHNwYW4gLSAxLFxuICAgICAgeTE6IGQucm93LFxuICAgICAgeTI6IGQucm93ICsgZC5yb3dzcGFuIC0gMVxuICAgIH07XG4gIH0pXG5cbiAgLnN0YXRpYyhmdW5jdGlvbiB1bmNvbGxpZGUoYSkge1xuICAgIHZhciBib3hBID0gZ3JpZC5ib3goYSk7XG4gICAgXG4gICAgcmV0dXJuIGZ1bmN0aW9uKG5vZGUsIHgxLCB5MSwgeDIsIHkyKSB7XG4gICAgICB2YXIgYiA9IG5vZGUucG9pbnQ7XG5cbiAgICAgIGlmIChiICYmIGEgIT09IGIgJiYgZ3JpZC5pbnRlcnNlY3Rpb24oYm94QSwgZ3JpZC5ib3goYikpKSB7XG4gICAgICAgIGIucm93ID0gYm94QS55MiArIDE7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiAhZ3JpZC5pbnRlcnNlY3Rpb24oYm94QSwge1xuICAgICAgICB4MTogeDEsIFxuICAgICAgICB5MTogeTEsIFxuICAgICAgICB4MjogeDIsXG4gICAgICAgIHkyOiB5MlxuICAgICAgfSk7XG4gICAgfTtcbiAgfSlcblxuICAuc3RhdGljKGZ1bmN0aW9uIGludGVyc2VjdGlvbihhLCBiKSB7XG4gICAgcmV0dXJuICgoYS54MSA8PSBiLngxICYmIGIueDEgPD0gYS54MikgJiYgKGEueTEgPD0gYi55MSAmJiBiLnkxIDw9IGEueTIpKVxuICAgICAgICB8fCAoKGIueDEgPD0gYS54MSAmJiBhLngxIDw9IGIueDIpICYmIChiLnkxIDw9IGEueTEgJiYgYS55MSA8PSBiLnkyKSlcbiAgICAgICAgfHwgKChhLngxIDw9IGIueDIgJiYgYi54MiA8PSBhLngyKSAmJiAoYS55MSA8PSBiLnkxICYmIGIueTEgPD0gYS55MikpXG4gICAgICAgIHx8ICgoYi54MSA8PSBhLngyICYmIGEueDIgPD0gYi54MikgJiYgKGIueTEgPD0gYS55MSAmJiBhLnkxIDw9IGIueTIpKTtcbiAgfSk7XG5cblxudmFyIGNvdW50ZXIgPSBzdHJhaW4oKVxuICAucHJvcCgnbnVtY29scycpXG5cbiAgLnByb3AoJ3Jvd3NwYW4nKVxuICAuZGVmYXVsdCgwKVxuXG4gIC5wcm9wKCdjb2wnKVxuICAuZGVmYXVsdCgwKVxuXG4gIC5wcm9wKCdyb3cnKVxuICAuZGVmYXVsdCgwKVxuXG4gIC5pbnZva2UoZnVuY3Rpb24oZCkge1xuICAgIGQuY29sID0gdXRpbHMuZW5zdXJlKGQuY29sLCB0aGlzLmNvbCgpKTtcbiAgICBkLnJvdyA9IHV0aWxzLmVuc3VyZShkLnJvdywgdGhpcy5yb3coKSk7XG5cbiAgICBpZiAoZC5jb2wgKyBkLmNvbHNwYW4gPiB0aGlzLm51bWNvbHMoKSkge1xuICAgICAgZC5jb2wgPSAwO1xuICAgICAgZC5yb3cgKz0gdGhpcy5yb3dzcGFuKCk7XG4gICAgICB0aGlzLnJvd3NwYW4oMCk7XG4gICAgfVxuXG4gICAgdGhpc1xuICAgICAgLmNvbChkLmNvbCArIGQuY29sc3BhbilcbiAgICAgIC5yb3coZC5yb3cpXG4gICAgICAucm93c3BhbihNYXRoLm1heCh0aGlzLnJvd3NwYW4oKSwgZC5yb3dzcGFuKSk7XG5cbiAgICByZXR1cm4gZDtcbiAgfSk7XG4iLCJleHBvcnRzLnV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xuZXhwb3J0cy52aWV3ID0gcmVxdWlyZSgnLi92aWV3Jyk7XG5leHBvcnRzLmdyaWQgPSByZXF1aXJlKCcuL2dyaWQnKTtcbmV4cG9ydHMud2lkZ2V0cyA9IHJlcXVpcmUoJy4vd2lkZ2V0cycpO1xuZXhwb3J0cy5kYXNoYm9hcmQgPSByZXF1aXJlKCcuL2Rhc2hib2FyZCcpO1xuIiwidmFyIHV0aWxzID0gZXhwb3J0cztcblxuXG51dGlscy5hY2Nlc3MgPSBmdW5jdGlvbihkLCBuYW1lLCBkZWZhdWx0dmFsKSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoIDwgMykge1xuICAgIGRlZmF1bHR2YWwgPSBudWxsO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBkICE9ICdvYmplY3QnKSB7XG4gICAgcmV0dXJuIGRlZmF1bHR2YWw7XG4gIH1cblxuICB2YXIgdmFsID0gZFtuYW1lXTtcbiAgcmV0dXJuIHR5cGVvZiB2YWwgPT0gJ3VuZGVmaW5lZCdcbiAgICA/IGRlZmF1bHR2YWxcbiAgICA6IHZhbDtcbn07XG5cblxudXRpbHMuZW5zdXJlID0gZnVuY3Rpb24odiwgZGVmYXVsdHZhbCkge1xuICByZXR1cm4gdiA9PT0gbnVsbCB8fCB0eXBlb2YgdiA9PSAndW5kZWZpbmVkJ1xuICAgID8gZGVmYXVsdHZhbFxuICAgIDogdjtcbn07XG5cblxudXRpbHMudHJhbnNsYXRlID0gZnVuY3Rpb24oeCwgeSkge1xuICByZXR1cm4gJ3RyYW5zbGF0ZSgnICsgeCArICcsICcgKyB5ICsgJyknO1xufTtcblxuXG51dGlscy5lbnN1cmVFbCA9IGZ1bmN0aW9uKGVsKSB7XG4gIHJldHVybiAhKGVsIGluc3RhbmNlb2YgZDMuc2VsZWN0aW9uKVxuICAgID8gZDMuc2VsZWN0KGVsKVxuICAgIDogZWw7XG59O1xuXG5cbnV0aWxzLmRhdGUgPSBmdW5jdGlvbih0KSB7XG4gIHJldHVybiBuZXcgRGF0ZSh0KTtcbn07XG5cblxudXRpbHMuYm94ID0gc3RyYWluKClcbiAgLnByb3AoJ3dpZHRoJylcbiAgLmRlZmF1bHQoMClcblxuICAucHJvcCgnaGVpZ2h0JylcbiAgLmRlZmF1bHQoMClcblxuICAucHJvcCgnbWFyZ2luJylcbiAgLmRlZmF1bHQoe1xuICAgIHRvcDogMCxcbiAgICBsZWZ0OiAwLFxuICAgIHJpZ2h0OiAwLFxuICAgIGJvdHRvbTogMFxuICB9KVxuXG4gIC5tZXRoKGZ1bmN0aW9uIGNhbGMoKSB7XG4gICAgdmFyIGQgPSB7fTtcbiAgICBkLm1hcmdpbiA9IHRoaXMubWFyZ2luKCk7XG4gICAgZC53aWR0aCA9IHRoaXMud2lkdGgoKTtcbiAgICBkLmhlaWdodCA9IHRoaXMuaGVpZ2h0KCk7XG4gICAgZC5pbm5lcldpZHRoID0gZC53aWR0aCAtIGQubWFyZ2luLmxlZnQgLSBkLm1hcmdpbi5yaWdodDtcbiAgICBkLmlubmVySGVpZ2h0ID0gZC5oZWlnaHQgLSBkLm1hcmdpbi50b3AgLSBkLm1hcmdpbi5ib3R0b207XG4gICAgcmV0dXJuIGQ7XG4gIH0pXG5cbiAgLmludm9rZShmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5jYWxjKCk7XG4gIH0pO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBzdHJhaW4oKVxuICAuc3RhdGljKGZ1bmN0aW9uIGRyYXcoZm4pIHtcbiAgICB0aGlzLm1ldGgoJ19kcmF3XycsIGZuKTtcbiAgfSlcbiAgLmRyYXcoZnVuY3Rpb24oKSB7fSlcblxuICAuc3RhdGljKGZ1bmN0aW9uIGVudGVyKGZuKSB7XG4gICAgdGhpcy5tZXRoKCdfZW50ZXJfJywgZm4pO1xuICB9KVxuICAuZW50ZXIoZnVuY3Rpb24oKSB7fSlcblxuICAubWV0aChmdW5jdGlvbiBkcmF3KGVsKSB7XG4gICAgZWwgPSBzYXBwaGlyZS51dGlscy5lbnN1cmVFbChlbCk7XG5cbiAgICBpZiAoZWwubm9kZSgpICYmICFlbC5ub2RlKCkuaGFzQ2hpbGROb2RlcygpKSB7XG4gICAgICB0aGlzLmVudGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgdmFyIHBhcmVudCA9IHRoaXMuX3R5cGVfLl9zdXBlcl8ucHJvdG90eXBlO1xuICAgIGlmICgnX2RyYXdfJyBpbiBwYXJlbnQpIHtcbiAgICAgIHBhcmVudC5fZHJhd18uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fZHJhd18uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfSlcblxuICAubWV0aChmdW5jdGlvbiBlbnRlcihlbCkge1xuICAgIGVsID0gc2FwcGhpcmUudXRpbHMuZW5zdXJlRWwoZWwpO1xuXG4gICAgdmFyIHBhcmVudCA9IHRoaXMuX3R5cGVfLl9zdXBlcl8ucHJvdG90eXBlO1xuICAgIGlmICgnX2VudGVyXycgaW4gcGFyZW50KSB7XG4gICAgICBwYXJlbnQuX2VudGVyXy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIHRoaXMuX2VudGVyXy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9KVxuXG4gIC5pbnZva2UoZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuZHJhdy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9KTtcbiIsInZhciB1dGlscyA9IHJlcXVpcmUoJy4uL3V0aWxzJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL3dpZGdldCcpLmV4dGVuZCgpXG4gIC5wcm9wKCd3aWR0aCcpXG4gIC5kZWZhdWx0KDQwMClcblxuICAucHJvcCgnY29sc3BhbicpXG4gIC5kZWZhdWx0KDQpXG5cbiAgLnByb3AoJ3Jvd3NwYW4nKVxuICAuZGVmYXVsdCgyKVxuXG4gIC5wcm9wKCdoZWlnaHQnKVxuICAuZGVmYXVsdCgyMDApXG5cbiAgLnByb3AoJ2JhclBhZGRpbmcnKVxuICAuZGVmYXVsdCgyLjUpXG5cbiAgLnByb3AoJ21hcmdpbicpXG4gIC5kZWZhdWx0KHtcbiAgICB0b3A6IDEwLFxuICAgIGxlZnQ6IDM1LFxuICAgIHJpZ2h0OiAxNSxcbiAgICBib3R0b206IDIwXG4gIH0pXG5cbiAgLnByb3AoJ3RpdGxlJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLnRpdGxlOyB9KVxuXG4gIC5wcm9wKCd2YWx1ZXMnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudmFsdWVzOyB9KVxuXG4gIC5wcm9wKCd4JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLng7IH0pXG5cbiAgLnByb3AoJ3knKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueTsgfSlcblxuICAucHJvcCgnZHgnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KG51bGwpXG5cbiAgLnByb3AoJ3hGb3JtYXQnKVxuICAuZGVmYXVsdChudWxsKVxuXG4gIC5wcm9wKCd4VGlja3MnKVxuICAuZGVmYXVsdCg4KVxuXG4gIC5wcm9wKCd5Rm9ybWF0JylcbiAgLmRlZmF1bHQoZDMuZm9ybWF0KCcuMnMnKSlcblxuICAucHJvcCgneVRpY2tzJylcbiAgLmRlZmF1bHQoNSlcblxuICAucHJvcCgnY29sb3JzJylcblxuICAuaW5pdChmdW5jdGlvbigpIHtcbiAgICB0aGlzLmNvbG9ycyhkMy5zY2FsZS5jYXRlZ29yeTEwKCkpO1xuICB9KVxuXG4gIC5tZXRoKGZ1bmN0aW9uIG5vcm1hbGl6ZShlbCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgbm9kZSA9IGVsLm5vZGUoKTtcblxuICAgIGVsLmRhdHVtKGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgIHZhciB2YWx1ZXMgPSBzZWxmLnZhbHVlcygpXG4gICAgICAgIC5jYWxsKG5vZGUsIGQsIGkpXG4gICAgICAgIC5tYXAodmFsdWUpO1xuXG4gICAgICB2YXIgbGVuID0gdmFsdWVzLmxlbmd0aDtcbiAgICAgIHZhciBkeEF2ZyA9IHZhbHVlcy5sZW5ndGhcbiAgICAgICAgPyAodmFsdWVzW2xlbiAtIDFdLnggLSB2YWx1ZXNbMF0ueCkgLyBsZW5cbiAgICAgICAgOiAwO1xuXG4gICAgICB2YWx1ZXMuZm9yRWFjaChmdW5jdGlvbihkKSB7XG4gICAgICAgIGQuZHggPSB1dGlscy5lbnN1cmUoZC5keCwgZHhBdmcpO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHZhbHVlczogdmFsdWVzLFxuICAgICAgICB0aXRsZTogc2VsZi50aXRsZSgpLmNhbGwobm9kZSwgZCwgaSlcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiB2YWx1ZShkLCBpKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB4OiBzZWxmLngoKS5jYWxsKG5vZGUsIGQsIGkpLFxuICAgICAgICB5OiBzZWxmLnkoKS5jYWxsKG5vZGUsIGQsIGkpLFxuICAgICAgICBkeDogc2VsZi5keCgpLmNhbGwobm9kZSwgZCwgaSlcbiAgICAgIH07XG4gICAgfVxuICB9KVxuXG4gIC5lbnRlcihmdW5jdGlvbihlbCkge1xuICAgIGVsLmF0dHIoJ2NsYXNzJywgJ2hpc3RvZ3JhbSB3aWRnZXQnKTtcblxuICAgIGVsLmFwcGVuZCgnZGl2JylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd0aXRsZScpO1xuXG4gICAgdmFyIHN2ZyA9IGVsLmFwcGVuZCgnZGl2JylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdjaGFydCcpXG4gICAgICAuYXBwZW5kKCdzdmcnKVxuICAgICAgLmFwcGVuZCgnZycpO1xuXG4gICAgc3ZnLmFwcGVuZCgnZycpXG4gICAgICAuYXR0cignY2xhc3MnLCAnYmFycycpO1xuXG4gICAgc3ZnLmFwcGVuZCgnZycpXG4gICAgICAuYXR0cignY2xhc3MnLCAneSBheGlzJyk7XG5cbiAgICBzdmcuYXBwZW5kKCdnJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd4IGF4aXMnKTtcbiAgfSlcblxuICAuZHJhdyhmdW5jdGlvbihlbCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB0aGlzLm5vcm1hbGl6ZShlbCk7XG5cbiAgICBlbC5zdHlsZSgnaGVpZ2h0JywgZWwuc3R5bGUoJ21pbi1oZWlnaHQnKSk7XG5cbiAgICBlbC5zZWxlY3QoJy53aWRnZXQgLnRpdGxlJylcbiAgICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGl0bGU7IH0pO1xuXG4gICAgdmFyIGNoYXJ0ID0gZWwuc2VsZWN0KCcuY2hhcnQnKVxuICAgICAgLmRhdHVtKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudmFsdWVzOyB9KTtcblxuICAgIHZhciBmeCA9IGQzLnRpbWUuc2NhbGUoKVxuICAgICAgLmRvbWFpbihbXG4gICAgICAgIGQzLm1pbihjaGFydC5kYXR1bSgpLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLng7IH0pLFxuICAgICAgICBkMy5tYXgoY2hhcnQuZGF0dW0oKSwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC54ICsgZC5keDsgfSldKTtcblxuICAgIHZhciBmeSA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgICAuZG9tYWluKFswLCBkMy5tYXgoY2hhcnQuZGF0dW0oKSwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC55OyB9KV0pO1xuXG4gICAgdmFyIGRpbXMgPSB1dGlscy5ib3goKVxuICAgICAgLndpZHRoKHBhcnNlSW50KGNoYXJ0LnN0eWxlKCd3aWR0aCcpKSlcbiAgICAgIC5oZWlnaHQocGFyc2VJbnQoY2hhcnQuc3R5bGUoJ2hlaWdodCcpKSlcbiAgICAgIC5tYXJnaW4odGhpcy5tYXJnaW4oKSlcbiAgICAgIC5jYWxjKCk7XG5cbiAgICBjaGFydFxuICAgICAgLnN0eWxlKCd3aWR0aCcsIGRpbXMud2lkdGggKyAncHgnKVxuICAgICAgLnN0eWxlKCdoZWlnaHQnLCBkaW1zLmhlaWdodCArICdweCcpO1xuXG4gICAgZngucmFuZ2UoWzAsIGRpbXMuaW5uZXJXaWR0aF0pO1xuICAgIGZ5LnJhbmdlKFtkaW1zLmlubmVySGVpZ2h0LCAwXSk7XG5cbiAgICB2YXIgc3ZnID0gY2hhcnQuc2VsZWN0KCdzdmcnKVxuICAgICAgLmF0dHIoJ3dpZHRoJywgZGltcy53aWR0aClcbiAgICAgIC5hdHRyKCdoZWlnaHQnLCBkaW1zLmhlaWdodClcbiAgICAgIC5zZWxlY3QoJ2cnKVxuICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgdXRpbHMudHJhbnNsYXRlKGRpbXMubWFyZ2luLmxlZnQsIGRpbXMubWFyZ2luLnRvcCkpO1xuXG4gICAgdmFyIGJhciA9IHN2Zy5zZWxlY3QoJy5iYXJzJylcbiAgICAgIC5zZWxlY3RBbGwoJy5iYXInKVxuICAgICAgLmRhdGEoZnVuY3Rpb24oZCkgeyByZXR1cm4gZDsgfSxcbiAgICAgICAgICAgIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueDsgfSk7XG5cbiAgICBiYXIuZW50ZXIoKS5hcHBlbmQoJ2cnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ2JhcicpXG4gICAgICAuYXBwZW5kKCdyZWN0Jyk7XG5cbiAgICBiYXJcbiAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIHJldHVybiB1dGlscy50cmFuc2xhdGUoZngoZC54KSwgZnkoZC55KSk7XG4gICAgICB9KTtcblxuICAgIGJhci5zZWxlY3QoJ3JlY3QnKVxuICAgICAgLnN0eWxlKCdmaWxsJywgdGhpcy5jb2xvcnMoKShlbC5kYXR1bSgpLnRpdGxlKSlcbiAgICAgIC5hdHRyKCd3aWR0aCcsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgdmFyIHdpZHRoID0gZngoZC54ICsgZC5keCkgLSBmeChkLngpO1xuICAgICAgICB3aWR0aCAtPSBzZWxmLmJhclBhZGRpbmcoKTtcbiAgICAgICAgcmV0dXJuIE1hdGgubWF4KHdpZHRoLCAxKTtcbiAgICAgIH0pXG4gICAgICAuYXR0cignaGVpZ2h0JywgZnVuY3Rpb24oZCkge1xuICAgICAgICByZXR1cm4gZGltcy5pbm5lckhlaWdodCAtIGZ5KGQueSk7IFxuICAgICAgfSk7XG5cbiAgICBiYXIuZXhpdCgpXG4gICAgICAucmVtb3ZlKCk7XG5cbiAgICB2YXIgYXhpcyA9IGQzLnN2Zy5heGlzKClcbiAgICAgIC5zY2FsZShmeClcbiAgICAgIC50aWNrcyh0aGlzLnhUaWNrcygpKVxuICAgICAgLnRpY2tGb3JtYXQodGhpcy54Rm9ybWF0KCkpO1xuXG4gICAgc3ZnLnNlbGVjdCgnLnguYXhpcycpXG4gICAgICAuYXR0cigndHJhbnNmb3JtJywgdXRpbHMudHJhbnNsYXRlKDAsIGRpbXMuaW5uZXJIZWlnaHQpKVxuICAgICAgLmNhbGwoYXhpcyk7XG5cbiAgICBheGlzID0gZDMuc3ZnLmF4aXMoKVxuICAgICAgLm9yaWVudCgnbGVmdCcpXG4gICAgICAuc2NhbGUoZnkpXG4gICAgICAudGlja1BhZGRpbmcoOClcbiAgICAgIC50aWNrU2l6ZSgtZGltcy5pbm5lcldpZHRoKVxuICAgICAgLnRpY2tzKHRoaXMueVRpY2tzKCkpXG4gICAgICAudGlja0Zvcm1hdCh0aGlzLnlGb3JtYXQoKSk7XG4gICAgXG4gICAgc3ZnLnNlbGVjdCgnLnkuYXhpcycpXG4gICAgICAuY2FsbChheGlzKTtcbiAgfSk7XG4iLCJleHBvcnRzLndpZGdldCA9IHJlcXVpcmUoJy4vd2lkZ2V0Jyk7XG5leHBvcnRzLmxpbmVzID0gcmVxdWlyZSgnLi9saW5lcycpO1xuZXhwb3J0cy5sYXN0ID0gcmVxdWlyZSgnLi9sYXN0Jyk7XG5leHBvcnRzLmhpc3RvZ3JhbSA9IHJlcXVpcmUoJy4vaGlzdG9ncmFtJyk7XG4iLCJ2YXIgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi93aWRnZXQnKS5leHRlbmQoKVxuICAucHJvcCgnd2lkdGgnKVxuICAuZGVmYXVsdCg0MDApXG5cbiAgLnByb3AoJ2NvbHNwYW4nKVxuICAuZGVmYXVsdCg0KVxuXG4gIC5wcm9wKCd0aXRsZScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50aXRsZTsgfSlcblxuICAucHJvcCgndmFsdWVzJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLnZhbHVlczsgfSlcblxuICAucHJvcCgneCcpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC54OyB9KVxuXG4gIC5wcm9wKCd5JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLnk7IH0pXG5cbiAgLnByb3AoJ3ZhbHVlRm9ybWF0JylcbiAgLmRlZmF1bHQoZDMuZm9ybWF0KCcsMnMnKSlcblxuICAucHJvcCgnZGlmZkZvcm1hdCcpXG4gIC5kZWZhdWx0KGQzLmZvcm1hdCgnKywycycpKVxuXG4gIC5wcm9wKCd0aW1lRm9ybWF0JylcbiAgLmRlZmF1bHQoZDMudGltZS5mb3JtYXQoJyUtZCAlYiAlLUg6JU0nKSlcblxuICAucHJvcCgnbm9uZScpXG4gIC5kZWZhdWx0KDApXG5cbiAgLnByb3AoJ3N1bW1hcnlMaW1pdCcpXG4gIC5kZWZhdWx0KDIpXG4gIC5zZXQoZnVuY3Rpb24odikgeyByZXR1cm4gTWF0aC5tYXgodXRpbHMuZW5zdXJlKHYsIDIpLCAyKTsgfSlcblxuICAucHJvcCgnc3BhcmtsaW5lTGltaXQnKVxuICAuZGVmYXVsdCgxNSlcbiAgLnNldChmdW5jdGlvbih2KSB7IHJldHVybiBNYXRoLm1heCh1dGlscy5lbnN1cmUodiwgMiksIDIpOyB9KVxuXG4gIC5wcm9wKCdzcGFya2xpbmUnKVxuICAucHJvcCgnc3VtbWFyeScpXG5cbiAgLmluaXQoZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zcGFya2xpbmUoc3BhcmtsaW5lKHRoaXMpKTtcbiAgICB0aGlzLnN1bW1hcnkoc3VtbWFyeSh0aGlzKSk7XG4gIH0pXG5cbiAgLmVudGVyKGZ1bmN0aW9uKGVsKSB7XG4gICAgZWwuYXR0cignY2xhc3MnLCAnbGFzdCB3aWRnZXQnKTtcblxuICAgIGVsLmFwcGVuZCgnZGl2JylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd0aXRsZScpO1xuXG4gICAgdmFyIHZhbHVlcyA9IGVsLmFwcGVuZCgnZGl2JylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd2YWx1ZXMnKTtcblxuICAgIHZhbHVlcy5hcHBlbmQoJ2RpdicpXG4gICAgICAuYXR0cignY2xhc3MnLCAnbGFzdCB2YWx1ZScpO1xuXG4gICAgdmFsdWVzLmFwcGVuZCgnZGl2JylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdzcGFya2xpbmUnKTtcblxuICAgIHZhbHVlcy5hcHBlbmQoJ2RpdicpXG4gICAgICAuYXR0cignY2xhc3MnLCAnc3VtbWFyeScpO1xuICB9KVxuXG4gIC5kcmF3KGZ1bmN0aW9uKGVsKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBub2RlID0gZWwubm9kZSgpO1xuXG4gICAgZWwuc2VsZWN0KCcudGl0bGUnKVxuICAgICAgLnRleHQoZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICByZXR1cm4gc2VsZi50aXRsZSgpLmNhbGwobm9kZSwgZCwgaSk7XG4gICAgICB9KTtcblxuICAgIHZhciB2YWx1ZXMgPSBlbC5zZWxlY3QoJy52YWx1ZXMnKVxuICAgICAgLmRhdHVtKGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgICAgcmV0dXJuIHNlbGYudmFsdWVzKClcbiAgICAgICAgICAuY2FsbChub2RlLCBkLCBpKVxuICAgICAgICAgIC5tYXAoZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgeDogc2VsZi54KCkuY2FsbChub2RlLCBkLCBpKSxcbiAgICAgICAgICAgICAgeTogc2VsZi55KCkuY2FsbChub2RlLCBkLCBpKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9KTtcbiAgICAgIH0pXG4gICAgICAuYXR0cignY2xhc3MnLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIGQgPSBkLnNsaWNlKC0yKTtcblxuICAgICAgICBkID0gZC5sZW5ndGggPiAxXG4gICAgICAgICAgPyBkWzFdLnkgLSBkWzBdLnlcbiAgICAgICAgICA6IDA7XG5cbiAgICAgICAgaWYgKGQgPiAwKSB7IHJldHVybiAnZ29vZCB2YWx1ZXMnOyB9XG4gICAgICAgIGlmIChkIDwgMCkgeyByZXR1cm4gJ2JhZCB2YWx1ZXMnOyB9XG4gICAgICAgIHJldHVybiAnbmV1dHJhbCB2YWx1ZXMnO1xuICAgICAgfSk7XG5cbiAgICB2YWx1ZXMuc2VsZWN0KCcubGFzdC52YWx1ZScpXG4gICAgICAuZGF0dW0oZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICBkID0gZFtkLmxlbmd0aCAtIDFdO1xuXG4gICAgICAgIHJldHVybiAhZFxuICAgICAgICAgID8gc2VsZi5ub25lKClcbiAgICAgICAgICA6IGQueTtcbiAgICAgIH0pXG4gICAgICAudGV4dCh0aGlzLnZhbHVlRm9ybWF0KCkpO1xuXG4gICAgdmFsdWVzLnNlbGVjdCgnLnNwYXJrbGluZScpXG4gICAgICAuY2FsbCh0aGlzLnNwYXJrbGluZSgpKTtcblxuICAgIHZhbHVlcy5zZWxlY3QoJy5zdW1tYXJ5JylcbiAgICAgIC5jYWxsKHRoaXMuc3VtbWFyeSgpKTtcbiAgfSk7XG5cblxudmFyIHN1bW1hcnkgPSByZXF1aXJlKCcuLi92aWV3JykuZXh0ZW5kKClcbiAgLnByb3AoJ3dpZGdldCcpXG5cbiAgLmluaXQoZnVuY3Rpb24od2lkZ2V0KSB7XG4gICAgdGhpcy53aWRnZXQod2lkZ2V0KTtcbiAgfSlcblxuICAuZW50ZXIoZnVuY3Rpb24oZWwpIHtcbiAgICBlbC5hcHBlbmQoJ3NwYW4nKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ2RpZmYnKTtcblxuICAgIGVsLmFwcGVuZCgnc3BhbicpXG4gICAgICAuYXR0cignY2xhc3MnLCAndGltZScpO1xuICB9KVxuXG4gIC5kcmF3KGZ1bmN0aW9uKGVsKSB7XG4gICAgdmFyIHdpZGdldCA9IHRoaXMud2lkZ2V0KCk7XG5cbiAgICBpZiAoZWwuZGF0dW0oKS5sZW5ndGggPCB0aGlzLndpZGdldCgpLnN1bW1hcnlMaW1pdCgpKSB7XG4gICAgICBlbC5zdHlsZSgnaGVpZ2h0JywgMCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZWwuc2VsZWN0KCcuZGlmZicpXG4gICAgICAuZGF0dW0oZnVuY3Rpb24oZCkge1xuICAgICAgICBkID0gZC5zbGljZSgtMik7XG4gICAgICAgIHJldHVybiBkWzFdLnkgLSBkWzBdLnk7XG4gICAgICB9KVxuICAgICAgLnRleHQod2lkZ2V0LmRpZmZGb3JtYXQoKSk7XG5cbiAgICBlbC5zZWxlY3QoJy50aW1lJylcbiAgICAgIC5kYXR1bShmdW5jdGlvbihkKSB7XG4gICAgICAgIGQgPSBkLnNsaWNlKC0yKTtcblxuICAgICAgICByZXR1cm4gW2RbMF0ueCwgZFsxXS54XVxuICAgICAgICAgIC5tYXAodXRpbHMuZGF0ZSlcbiAgICAgICAgICAubWFwKHdpZGdldC50aW1lRm9ybWF0KCkpO1xuICAgICAgfSlcbiAgICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuIFsnIGZyb20nLCBkWzBdLCAndG8nLCBkWzFdXS5qb2luKCcgJyk7XG4gICAgICB9KTtcbiAgfSk7XG5cblxudmFyIHNwYXJrbGluZSA9IHJlcXVpcmUoJy4uL3ZpZXcnKS5leHRlbmQoKVxuICAucHJvcCgnd2lkZ2V0JylcblxuICAucHJvcCgnaGVpZ2h0JylcbiAgLmRlZmF1bHQoMjUpXG5cbiAgLnByb3AoJ21hcmdpbicpXG4gIC5kZWZhdWx0KHtcbiAgICB0b3A6IDQsXG4gICAgbGVmdDogNCxcbiAgICBib3R0b206IDQsXG4gICAgcmlnaHQ6IDQgXG4gIH0pXG5cbiAgLmluaXQoZnVuY3Rpb24od2lkZ2V0KSB7XG4gICAgdGhpcy53aWRnZXQod2lkZ2V0KTtcbiAgfSlcblxuICAuZW50ZXIoZnVuY3Rpb24oZWwpIHtcbiAgICB2YXIgc3ZnID0gZWwuYXBwZW5kKCdzdmcnKVxuICAgICAgLmFwcGVuZCgnZycpO1xuXG4gICAgc3ZnLmFwcGVuZCgncGF0aCcpXG4gICAgICAuYXR0cignY2xhc3MnLCAncmVzdCBwYXRoJyk7XG5cbiAgICBzdmcuYXBwZW5kKCdwYXRoJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdkaWZmIHBhdGgnKTtcbiAgfSlcblxuICAuZHJhdyhmdW5jdGlvbihlbCkge1xuICAgIGlmIChlbC5kYXR1bSgpLmxlbmd0aCA8IHRoaXMud2lkZ2V0KCkuc3BhcmtsaW5lTGltaXQoKSkge1xuICAgICAgZWwuc3R5bGUoJ2hlaWdodCcsIDApO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBkaW1zID0gdXRpbHMuYm94KClcbiAgICAgIC5tYXJnaW4odGhpcy5tYXJnaW4oKSlcbiAgICAgIC53aWR0aChwYXJzZUludChlbC5zdHlsZSgnd2lkdGgnKSkpXG4gICAgICAuaGVpZ2h0KHRoaXMuaGVpZ2h0KCkpXG4gICAgICAuY2FsYygpO1xuXG4gICAgdmFyIGZ4ID0gZDMuc2NhbGUubGluZWFyKClcbiAgICAgIC5kb21haW4oZDMuZXh0ZW50KGVsLmRhdHVtKCksIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueDsgfSkpXG4gICAgICAucmFuZ2UoWzAsIGRpbXMuaW5uZXJXaWR0aF0pO1xuXG4gICAgdmFyIGZ5ID0gZDMuc2NhbGUubGluZWFyKClcbiAgICAgIC5kb21haW4oZDMuZXh0ZW50KGVsLmRhdHVtKCksIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueTsgfSkpXG4gICAgICAucmFuZ2UoW2RpbXMuaW5uZXJIZWlnaHQsIDBdKTtcblxuICAgIHZhciBsaW5lID0gZDMuc3ZnLmxpbmUoKVxuICAgICAgLngoZnVuY3Rpb24oZCkgeyByZXR1cm4gZngoZC54KTsgfSlcbiAgICAgIC55KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGZ5KGQueSk7IH0pO1xuXG4gICAgdmFyIHN2ZyA9IGVsLnNlbGVjdCgnc3ZnJylcbiAgICAgIC5hdHRyKCd3aWR0aCcsIGRpbXMud2lkdGgpXG4gICAgICAuYXR0cignaGVpZ2h0JywgZGltcy5oZWlnaHQpXG4gICAgICAuc2VsZWN0KCdnJylcbiAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIHV0aWxzLnRyYW5zbGF0ZShkaW1zLm1hcmdpbi5sZWZ0LCBkaW1zLm1hcmdpbi50b3ApKTtcblxuICAgIHN2Zy5zZWxlY3QoJy5yZXN0LnBhdGgnKVxuICAgICAgLmF0dHIoJ2QnLCBsaW5lKTtcblxuICAgIHN2Zy5zZWxlY3QoJy5kaWZmLnBhdGgnKVxuICAgICAgLmRhdHVtKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuc2xpY2UoLTIpOyB9KVxuICAgICAgLmF0dHIoJ2QnLCBsaW5lKTtcblxuICAgIHZhciBkb3QgPSBzdmcuc2VsZWN0QWxsKCcuZG90JylcbiAgICAgIC5kYXRhKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuc2xpY2UoLTEpOyB9KTtcblxuICAgIGRvdC5lbnRlcigpLmFwcGVuZCgnY2lyY2xlJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdkb3QnKVxuICAgICAgLmF0dHIoJ3InLCA0KTtcblxuICAgIGRvdFxuICAgICAgLmF0dHIoJ2N4JywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZngoZC54KTsgfSlcbiAgICAgIC5hdHRyKCdjeScsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGZ5KGQueSk7IH0pO1xuXG4gICAgZG90LmV4aXQoKS5yZW1vdmUoKTtcbiAgfSk7XG4iLCJ2YXIgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi93aWRnZXQnKS5leHRlbmQoKVxuICAucHJvcCgnd2lkdGgnKVxuICAuZGVmYXVsdCg0MDApXG5cbiAgLnByb3AoJ2NvbHNwYW4nKVxuICAuZGVmYXVsdCg0KVxuXG4gIC5wcm9wKCd0aXRsZScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50aXRsZTsgfSlcblxuICAucHJvcCgnbWV0cmljcycpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5tZXRyaWNzOyB9KVxuXG4gIC5wcm9wKCdrZXknKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIGk7IH0pXG5cbiAgLnByb3AoJ21ldHJpY1RpdGxlJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLnRpdGxlOyB9KVxuXG4gIC5wcm9wKCd2YWx1ZXMnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudmFsdWVzOyB9KVxuXG4gIC5wcm9wKCd4JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLng7IH0pXG5cbiAgLnByb3AoJ3knKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueTsgfSlcblxuICAucHJvcCgneEZvcm1hdCcpXG4gIC5kZWZhdWx0KG51bGwpXG5cbiAgLnByb3AoJ3hUaWNrcycpXG4gIC5kZWZhdWx0KDgpXG5cbiAgLnByb3AoJ3lGb3JtYXQnKVxuICAuZGVmYXVsdChkMy5mb3JtYXQoJy4ycycpKVxuXG4gIC5wcm9wKCd5VGlja3MnKVxuICAuZGVmYXVsdCg1KVxuXG4gIC5wcm9wKCd2YWx1ZUZvcm1hdCcpXG4gIC5kZWZhdWx0KGQzLmZvcm1hdCgnLDJzJykpXG5cbiAgLnByb3AoJ25vbmUnKVxuICAuZGVmYXVsdCgwKVxuXG4gIC5wcm9wKCdjb2xvcnMnKVxuICAucHJvcCgnY2hhcnQnKVxuICAucHJvcCgnbGVnZW5kJylcblxuICAuaW5pdChmdW5jdGlvbigpIHtcbiAgICB0aGlzLmNoYXJ0KGNoYXJ0KHRoaXMpKTtcbiAgICB0aGlzLmxlZ2VuZChsZWdlbmQodGhpcykpO1xuICAgIHRoaXMuY29sb3JzKGQzLnNjYWxlLmNhdGVnb3J5MTAoKSk7XG4gIH0pXG5cbiAgLmVudGVyKGZ1bmN0aW9uKGVsKSB7XG4gICAgZWwuYXR0cignY2xhc3MnLCAnbGluZXMgd2lkZ2V0Jyk7XG5cbiAgICBlbC5hcHBlbmQoJ2RpdicpXG4gICAgICAuYXR0cignY2xhc3MnLCAndGl0bGUnKTtcblxuICAgIHZhciB2YWx1ZXMgPSBlbC5hcHBlbmQoJ2RpdicpXG4gICAgICAuYXR0cignY2xhc3MnLCAndmFsdWVzJyk7XG5cbiAgICB2YWx1ZXMuYXBwZW5kKCdkaXYnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ2NoYXJ0Jyk7XG5cbiAgICB2YWx1ZXMuYXBwZW5kKCdkaXYnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ2xlZ2VuZCcpO1xuICB9KVxuXG4gIC5tZXRoKGZ1bmN0aW9uIG5vcm1hbGl6ZShlbCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgbm9kZSA9IGVsLm5vZGUoKTtcblxuICAgIGVsLmRhdHVtKGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgIHZhciB0aXRsZSA9IHNlbGYudGl0bGUoKS5jYWxsKG5vZGUsIGQsIGkpO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICB0aXRsZTogdGl0bGUsXG4gICAgICAgIG1ldHJpY3M6IHNlbGYubWV0cmljcygpXG4gICAgICAgICAgLmNhbGwobm9kZSwgZCwgaSlcbiAgICAgICAgICAubWFwKG1ldHJpYylcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiBtZXRyaWMoZCwgaSkge1xuICAgICAgdmFyIGtleSA9IHNlbGYua2V5KClcbiAgICAgICAgLmNhbGwobm9kZSwgZCwgaSlcbiAgICAgICAgLnRvU3RyaW5nKCk7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGtleToga2V5LFxuICAgICAgICBjb2xvcjogc2VsZi5jb2xvcnMoKShrZXkpLFxuICAgICAgICB0aXRsZTogc2VsZi5tZXRyaWNUaXRsZSgpLmNhbGwobm9kZSwgZCwgaSksXG4gICAgICAgIHZhbHVlczogc2VsZi52YWx1ZXMoKVxuICAgICAgICAgIC5jYWxsKG5vZGUsIGQsIGkpXG4gICAgICAgICAgLm1hcCh2YWx1ZSlcbiAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdmFsdWUoZCwgaSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgeDogc2VsZi54KCkuY2FsbChub2RlLCBkLCBpKSxcbiAgICAgICAgeTogc2VsZi55KCkuY2FsbChub2RlLCBkLCBpKVxuICAgICAgfTtcbiAgICB9XG4gIH0pXG5cbiAgLmRyYXcoZnVuY3Rpb24oZWwpIHtcbiAgICB0aGlzLm5vcm1hbGl6ZShlbCk7XG5cbiAgICBlbC5zZWxlY3QoJy53aWRnZXQgLnRpdGxlJylcbiAgICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGl0bGU7IH0pO1xuXG4gICAgdmFyIHZhbHVlcyA9IGVsLnNlbGVjdCgnLnZhbHVlcycpXG4gICAgICAuZGF0dW0oZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gZC5tZXRyaWNzOyB9KTtcblxuICAgIHZhbHVlcy5zZWxlY3QoJy5jaGFydCcpXG4gICAgICAuY2FsbCh0aGlzLmNoYXJ0KCkpO1xuXG4gICAgdmFsdWVzLnNlbGVjdCgnLmxlZ2VuZCcpXG4gICAgICAuY2FsbCh0aGlzLmxlZ2VuZCgpKTtcbiAgfSk7XG5cblxudmFyIGNoYXJ0ID0gcmVxdWlyZSgnLi4vdmlldycpLmV4dGVuZCgpXG4gIC5wcm9wKCdoZWlnaHQnKVxuICAuZGVmYXVsdCgxNTApXG5cbiAgLnByb3AoJ21hcmdpbicpXG4gIC5kZWZhdWx0KHtcbiAgICB0b3A6IDEwLFxuICAgIGxlZnQ6IDM1LFxuICAgIHJpZ2h0OiAxNSxcbiAgICBib3R0b206IDIwXG4gIH0pXG5cbiAgLnByb3AoJ3dpZGdldCcpXG5cbiAgLmluaXQoZnVuY3Rpb24od2lkZ2V0KSB7XG4gICAgdGhpcy53aWRnZXQod2lkZ2V0KTtcbiAgfSlcblxuICAuZW50ZXIoZnVuY3Rpb24oZWwpIHtcbiAgICB2YXIgc3ZnID0gZWwuYXBwZW5kKCdzdmcnKVxuICAgICAgLmFwcGVuZCgnZycpO1xuXG4gICAgc3ZnLmFwcGVuZCgnZycpXG4gICAgICAuYXR0cignY2xhc3MnLCAneCBheGlzJyk7XG5cbiAgICBzdmcuYXBwZW5kKCdnJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd5IGF4aXMnKTtcblxuICAgIHN2Zy5hcHBlbmQoJ2cnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ2xpbmVzJyk7XG4gIH0pXG5cbiAgLmRyYXcoZnVuY3Rpb24oZWwpIHtcbiAgICB2YXIgZGltcyA9IHV0aWxzLmJveCgpXG4gICAgICAubWFyZ2luKHRoaXMubWFyZ2luKCkpXG4gICAgICAud2lkdGgocGFyc2VJbnQoZWwuc3R5bGUoJ3dpZHRoJykpKVxuICAgICAgLmhlaWdodCh0aGlzLmhlaWdodCgpKVxuICAgICAgLmNhbGMoKTtcblxuICAgIHZhciBhbGxWYWx1ZXMgPSBlbFxuICAgICAgLmRhdHVtKClcbiAgICAgIC5yZWR1Y2UoZnVuY3Rpb24ocmVzdWx0cywgbWV0cmljKSB7XG4gICAgICAgIHJlc3VsdHMucHVzaC5hcHBseShyZXN1bHRzLCBtZXRyaWMudmFsdWVzKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgICB9LCBbXSk7XG5cbiAgICB2YXIgZnggPSBkMy50aW1lLnNjYWxlKClcbiAgICAgIC5kb21haW4oZDMuZXh0ZW50KGFsbFZhbHVlcywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC54OyB9KSlcbiAgICAgIC5yYW5nZShbMCwgZGltcy5pbm5lcldpZHRoXSk7XG5cbiAgICB2YXIgZnkgPSBkMy5zY2FsZS5saW5lYXIoKVxuICAgICAgLmRvbWFpbihkMy5leHRlbnQoYWxsVmFsdWVzLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLnk7IH0pKVxuICAgICAgLnJhbmdlKFtkaW1zLmlubmVySGVpZ2h0LCAwXSk7XG5cbiAgICB2YXIgbGluZSA9IGQzLnN2Zy5saW5lKClcbiAgICAgIC54KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGZ4KGQueCk7IH0pXG4gICAgICAueShmdW5jdGlvbihkKSB7IHJldHVybiBmeShkLnkpOyB9KTtcblxuICAgIHZhciBzdmcgPSBlbC5zZWxlY3QoJ3N2ZycpXG4gICAgICAuYXR0cignd2lkdGgnLCBkaW1zLndpZHRoKVxuICAgICAgLmF0dHIoJ2hlaWdodCcsIGRpbXMuaGVpZ2h0KVxuICAgICAgLnNlbGVjdCgnZycpXG4gICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCB1dGlscy50cmFuc2xhdGUoZGltcy5tYXJnaW4ubGVmdCwgZGltcy5tYXJnaW4udG9wKSk7XG5cbiAgICB2YXIgbWV0cmljID0gc3ZnLnNlbGVjdCgnLmxpbmVzJykuc2VsZWN0QWxsKCcubWV0cmljJylcbiAgICAgIC5kYXRhKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQ7IH0sXG4gICAgICAgICAgICBmdW5jdGlvbihkKSB7IHJldHVybiBkLmtleTsgfSk7XG5cbiAgICBtZXRyaWMuZW50ZXIoKS5hcHBlbmQoJ2cnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ21ldHJpYycpXG4gICAgICAuYXR0cignZGF0YS1rZXknLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLmtleTsgfSlcbiAgICAgIC5hcHBlbmQoJ3BhdGgnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnbGluZScpO1xuXG4gICAgbWV0cmljLnNlbGVjdCgnLmxpbmUnKVxuICAgICAgLmF0dHIoJ3N0cm9rZScsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuY29sb3I7IH0pXG4gICAgICAuYXR0cignZCcsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGxpbmUoZC52YWx1ZXMpOyB9KTtcblxuICAgIHZhciBkb3QgPSBtZXRyaWMuc2VsZWN0QWxsKCcuZG90JylcbiAgICAgIC5kYXRhKGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgaWYgKCFkLnZhbHVlcy5sZW5ndGgpIHsgcmV0dXJuIFtdOyB9XG4gICAgICAgIHZhciBsYXN0ID0gZC52YWx1ZXNbZC52YWx1ZXMubGVuZ3RoIC0gMV07XG5cbiAgICAgICAgcmV0dXJuIFt7XG4gICAgICAgICAgeDogbGFzdC54LFxuICAgICAgICAgIHk6IGxhc3QueSxcbiAgICAgICAgICBjb2xvcjogZC5jb2xvclxuICAgICAgICB9XTtcbiAgICAgIH0pO1xuXG4gICAgZG90LmVudGVyKCkuYXBwZW5kKCdjaXJjbGUnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ2RvdCcpXG4gICAgICAuYXR0cigncicsIDQpO1xuXG4gICAgZG90XG4gICAgICAuYXR0cignZmlsbCcsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuY29sb3I7IH0pXG4gICAgICAuYXR0cignY3gnLCBmdW5jdGlvbihkKSB7IHJldHVybiBmeChkLngpOyB9KVxuICAgICAgLmF0dHIoJ2N5JywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZnkoZC55KTsgfSk7XG5cbiAgICBkb3QuZXhpdCgpXG4gICAgICAucmVtb3ZlKCk7XG5cbiAgICBtZXRyaWMuZXhpdCgpXG4gICAgICAucmVtb3ZlKCk7XG5cbiAgICB2YXIgYXhpcyA9IGQzLnN2Zy5heGlzKClcbiAgICAgIC5zY2FsZShmeClcbiAgICAgIC50aWNrUGFkZGluZyg4KVxuICAgICAgLnRpY2tzKHRoaXMud2lkZ2V0KCkueFRpY2tzKCkpXG4gICAgICAudGlja0Zvcm1hdCh0aGlzLndpZGdldCgpLnhGb3JtYXQoKSlcbiAgICAgIC50aWNrU2l6ZSgtZGltcy5pbm5lckhlaWdodCk7XG5cbiAgICBzdmcuc2VsZWN0KCcueC5heGlzJylcbiAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCB1dGlscy50cmFuc2xhdGUoMCwgZGltcy5pbm5lckhlaWdodCkpXG4gICAgICAuY2FsbChheGlzKTtcblxuICAgIGF4aXMgPSBkMy5zdmcuYXhpcygpXG4gICAgICAub3JpZW50KCdsZWZ0JylcbiAgICAgIC5zY2FsZShmeSlcbiAgICAgIC50aWNrUGFkZGluZyg4KVxuICAgICAgLnRpY2tzKHRoaXMud2lkZ2V0KCkueVRpY2tzKCkpXG4gICAgICAudGlja0Zvcm1hdCh0aGlzLndpZGdldCgpLnlGb3JtYXQoKSlcbiAgICAgIC50aWNrU2l6ZSgtZGltcy5pbm5lcldpZHRoKTtcbiAgICBcbiAgICBzdmcuc2VsZWN0KCcueS5heGlzJylcbiAgICAgIC5jYWxsKGF4aXMpO1xuICB9KTtcblxuXG52YXIgbGVnZW5kID0gcmVxdWlyZSgnLi4vdmlldycpLmV4dGVuZCgpXG4gIC5wcm9wKCd3aWRnZXQnKVxuXG4gIC5pbml0KGZ1bmN0aW9uKHdpZGdldCkge1xuICAgIHRoaXMud2lkZ2V0KHdpZGdldCk7XG4gIH0pXG5cbiAgLmVudGVyKGZ1bmN0aW9uKGVsKSB7XG4gICAgZWwuYXBwZW5kKCd0YWJsZScpXG4gICAgICAuYXR0cignY2xhc3MnLCAndGFibGUnKTtcbiAgfSlcblxuICAuZHJhdyhmdW5jdGlvbihlbCkge1xuICAgIHZhciBub25lID0gdGhpcy53aWRnZXQoKS5ub25lKCk7XG4gICAgdmFyIHZhbHVlRm9ybWF0ID0gdGhpcy53aWRnZXQoKS52YWx1ZUZvcm1hdCgpO1xuXG4gICAgdmFyIG1ldHJpYyA9IGVsLnNlbGVjdCgnLnRhYmxlJykuc2VsZWN0QWxsKCcubWV0cmljJylcbiAgICAgIC5kYXRhKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQ7IH0sXG4gICAgICAgICAgICBmdW5jdGlvbihkKSB7IHJldHVybiBkLmtleTsgfSk7XG5cbiAgICB2YXIgZW50ZXJNZXRyaWMgPSBtZXRyaWMuZW50ZXIoKS5hcHBlbmQoJ3RyJylcbiAgICAgIC5hdHRyKCdkYXRhLWtleScsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQua2V5OyB9KVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ21ldHJpYycpO1xuXG4gICAgZW50ZXJNZXRyaWMuYXBwZW5kKCd0ZCcpXG4gICAgICAuYXR0cignY2xhc3MnLCAnc3dhdGNoJyk7XG5cbiAgICBlbnRlck1ldHJpYy5hcHBlbmQoJ3RkJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd0aXRsZScpO1xuXG4gICAgZW50ZXJNZXRyaWMuYXBwZW5kKCd0ZCcpXG4gICAgICAuYXR0cignY2xhc3MnLCAndmFsdWUnKTtcblxuICAgIG1ldHJpYy5zZWxlY3QoJy5zd2F0Y2gnKVxuICAgICAgLnN0eWxlKCdiYWNrZ3JvdW5kJywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5jb2xvcjsgfSk7XG5cbiAgICBtZXRyaWMuc2VsZWN0KCcudGl0bGUnKVxuICAgICAgLnRleHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50aXRsZTsgfSk7XG5cbiAgICBtZXRyaWMuc2VsZWN0KCcudmFsdWUnKVxuICAgICAgLnRleHQoZnVuY3Rpb24oZCkge1xuICAgICAgICBkID0gZC52YWx1ZXNbZC52YWx1ZXMubGVuZ3RoIC0gMV07XG5cbiAgICAgICAgcmV0dXJuIGRcbiAgICAgICAgICA/IHZhbHVlRm9ybWF0KGQueSlcbiAgICAgICAgICA6IHZhbHVlRm9ybWF0KG5vbmUpO1xuICAgICAgfSk7XG5cbiAgICBtZXRyaWMuZXhpdCgpXG4gICAgICAucmVtb3ZlKCk7XG4gIH0pO1xuIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuLi92aWV3JykuZXh0ZW5kKClcbiAgLnByb3AoJ3N0YW5kYWxvbmUnKVxuICAuZGVmYXVsdCh0cnVlKVxuXG4gIC5wcm9wKCdjb2xzcGFuJylcbiAgLmRlZmF1bHQoMSlcblxuICAucHJvcCgncm93c3BhbicpXG4gIC5kZWZhdWx0KDEpXG5cbiAgLnByb3AoJ3dpZHRoJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdCgxMDApXG5cbiAgLnByb3AoJ2hlaWdodCcpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoMTAwKVxuXG4gIC5kcmF3KGZ1bmN0aW9uKGVsKSB7XG4gICAgaWYgKCF0aGlzLnN0YW5kYWxvbmUoKSkgeyByZXR1cm47IH1cbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICBlbC5zdHlsZSgnd2lkdGgnLCBmdW5jdGlvbihkLCBpKSB7XG4gICAgICAgIHJldHVybiBzZWxmLndpZHRoKCkuY2FsbCh0aGlzLCBkLCBpKSArICdweCc7XG4gICAgICB9KVxuICAgICAgLnN0eWxlKCdtaW4taGVpZ2h0JywgZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICByZXR1cm4gc2VsZi5oZWlnaHQoKS5jYWxsKHRoaXMsIGQsIGkpICsgJ3B4JztcbiAgICAgIH0pO1xuICB9KTtcbiJdfQ==
(3)
});
