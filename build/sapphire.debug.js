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

  .meth('normalize', function(el) {
    var self = this;
    var node = el.node();

    el.datum(function(d, i) {
      return {
        title: self.title()
          .call(node, d, i),
        widgets: self.widgets()
          .call(node, d, i)
          .map(widgetDatum)
      };
    });

    function widgetDatum(d, i) {
      var typename = self.type().call(node, d, i);
      var type = self.types().get(typename);

      if (!type) {
        throw new Error("Unrecognised dashboard widget type '" + typename + "'");
      }

      var colspan = self.colspan().call(node, d, i);
      colspan = utils.ensure(colspan, type.colspan());
      var rowspan = self.rowspan().call(node, d, i);
      rowspan = utils.ensure(rowspan, type.rowspan());

      return {
        data: d,
        type: type,
        colspan: colspan,
        rowspan: rowspan,
        key: self.key().call(node, d, i),
        col: self.col().call(node, d, i),
        row: self.row().call(node, d, i)
      };
    }
  })

  .draw(function(el) {
    this.normalize(el);
    var widgetData = el.datum().widgets;

    this.types()
      .forEach(function(name, type) {
        type.width(widgetWidth);
        type.height(widgetHeight);
      });

    var grid = layout()
      .scale(this.scale())
      .numcols(this.numcols())
      .padding(this.padding())
      .col(function(d) { return d.col; })
      .row(function(d) { return d.row; })
      .colspan(function(d) { return d.colspan; })
      .rowspan(function(d) { return d.rowspan; });
    
    el.style('width', utils.px(grid.scale() * grid.numcols()));

    var widget = el.select('.widgets').selectAll('.widget')
      .data(widgetData, function(d) { return d.key; });

    widget.enter().append('div');
    utils.meta(widget, function(d) { return d; });

    widget
      .classed('widget', true)
      .each(function(d) {
        var widgetEl = d3.select(this)
          .datum(d.data)
          .call(d.type);

        var width = parseInt(widgetEl.style('width'));
        d.colspan = Math.max(d.colspan, grid.lengthSpan(width));

        var height = parseInt(widgetEl.style('height'));
        d.rowspan = Math.max(d.rowspan, grid.lengthSpan(height));
      });

    var gridEls = grid(widgetData);

    widget
      .style('left', utils.px(function(d, i) { return gridEls[i].x; }))
      .style('top', utils.px(function(d, i) { return gridEls[i].y; }));

    widget.exit().remove();

    function widgetWidth() {
      return grid.spanLength(utils.meta(this).colspan);
    }

    function widgetHeight() {
      return grid.spanLength(utils.meta(this).rowspan);
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

  .meth('indexOffset', function(index) {
    return (index * this.scale()) + this.padding();
  })

  .meth('spanLength', function(span) {
    return (span * this.scale()) - (this.padding() * 2);
  })

  .meth('offsetIndex', function(offset) {
    return Math.ceil((offset - this.padding()) / this.scale());
  })

  .meth('lengthSpan', function(len) {
    return Math.ceil((len + (this.padding() * 2)) / this.scale());
  })

  .static('box', function(d) {
    return {
      x1: d.col,
      x2: d.col + d.colspan - 1,
      y1: d.row,
      y2: d.row + d.rowspan - 1
    };
  })

  .static('uncollide', function(a) {
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

  .static('intersection', function(a, b) {
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


utils.px = function(fn) {
  fn = d3.functor(fn);

  return function(d, i) {
    return fn.call(this, d, i) + 'px';
  };
};


utils.meta = function(el, fn) {
  el = utils.ensureEl(el);

  return arguments.length > 1
    ? el.property('__sapphire_meta__', fn)
    : el.property('__sapphire_meta__');
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

  .meth('calc', function() {
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


utils.innerWidth = function(el) {
  return utils.measure(el, 'width')
       - utils.measure(el, 'padding-left')
       - utils.measure(el, 'padding-right');
};


utils.innerHeight = function(el) {
  return utils.measure(el, 'height')
       - utils.measure(el, 'padding-top')
       - utils.measure(el, 'padding-bottom');
};


utils.measure = function(el, name) {
  el = utils.ensureEl(el);
  return parseInt(el.style(name));
};

},{}],5:[function(_dereq_,module,exports){
module.exports = strain()
  .static('draw', function(fn) {
    this.meth('_draw_', fn);
  })
  .draw(function() {})

  .static('enter', function(fn) {
    this.meth('_enter_', fn);
  })
  .enter(function() {})

  .meth('draw', function(el) {
    var datum;
    el = sapphire.utils.ensureEl(el);

    if (el.node()) {
      datum = el.datum();
    }

    if (el.node() && !el.node().hasChildNodes()) {
      this.enter.apply(this, arguments);
    }

    var parent = this._type_._super_.prototype;
    if ('_draw_' in parent) {
      parent._draw_.apply(this, arguments);
    }

    this._draw_.apply(this, arguments);

    if (typeof datum != 'undefined') {
      el.datum(datum);
    }
  })

  .meth('enter', function(el) {
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
    left: 38,
    right: 15,
    bottom: 45
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

  .prop('xTickFormat')
  .default(null)

  .prop('xTicks')
  .default(8)

  .prop('yTickFormat')
  .default(d3.format('.2s'))

  .prop('yTicks')
  .default(5)

  .prop('colors')

  .init(function() {
    this.colors(d3.scale.category10());
  })

  .meth('normalize', function(el) {
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
        dx: self.dx().call(node, d, i),
        width: self.width().call(node, d, i),
        height: self.height().call(node, d, i)
      };
    }
  })

  .enter(function(el) {
    el.attr('class', 'bars widget');

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

    el.style('width', utils.px(this.width()))
      .style('height', utils.px(this.height()));

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
      .width(utils.innerWidth(chart))
      .height(utils.innerHeight(chart))
      .margin(this.margin())
      .calc();

    chart
      .style('width', utils.px(dims.width))
      .style('height', utils.px(dims.height));

    fx.range([0, dims.innerWidth]);
    fy.range([dims.innerHeight, 0]);

    var svg = chart.select('svg')
      .attr('width', dims.width)
      .attr('height', dims.height)
      .select('g')
        .attr('transform', utils.translate(
          dims.margin.left,
          dims.margin.top));

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
      .tickFormat(this.xTickFormat());

    svg.select('.x.axis')
      .attr('transform', utils.translate(0, dims.innerHeight))
      .call(axis);

    axis = d3.svg.axis()
      .orient('left')
      .scale(fy)
      .tickPadding(8)
      .tickSize(-dims.innerWidth)
      .ticks(this.yTicks())
      .tickFormat(this.yTickFormat());
    
    svg.select('.y.axis')
      .call(axis);
  });

},{"../utils":4,"./widget":11}],7:[function(_dereq_,module,exports){
exports.pie = _dereq_('./pie');
exports.bars = _dereq_('./bars');
exports.last = _dereq_('./last');
exports.lines = _dereq_('./lines');
exports.widget = _dereq_('./widget');

},{"./bars":6,"./last":8,"./lines":9,"./pie":10,"./widget":11}],8:[function(_dereq_,module,exports){
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

  .prop('yFormat')
  .default(d3.format(',2s'))

  .prop('diffFormat')
  .default(d3.format('+,2s'))

  .prop('xFormat')
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

    el.style('width', utils.px(this.width()));

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
      .text(this.yFormat());

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
          .map(widget.xFormat());
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
      .width(utils.innerWidth(el))
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

},{"../utils":4,"../view":5,"./widget":11}],9:[function(_dereq_,module,exports){
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

  .prop('xTickFormat')
  .default(null)

  .prop('xTicks')
  .default(8)

  .prop('yFormat')
  .default(d3.format(',2s'))

  .prop('yTicks')
  .default(5)

  .prop('yTickFormat')
  .default(d3.format('.2s'))

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

  .meth('normalize', function(el) {
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

    el.style('width', utils.px(this.width()));

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
      .width(utils.innerWidth(el))
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
      .tickFormat(this.widget().xTickFormat())
      .tickSize(-dims.innerHeight);

    svg.select('.x.axis')
      .attr('transform', utils.translate(0, dims.innerHeight))
      .call(axis);

    axis = d3.svg.axis()
      .orient('left')
      .scale(fy)
      .tickPadding(8)
      .ticks(this.widget().yTicks())
      .tickFormat(this.widget().yTickFormat())
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
    var yFormat = this.widget().yFormat();

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
          ? yFormat(d.y)
          : yFormat(none);
      });

    metric.exit()
      .remove();
  });

},{"../utils":4,"../view":5,"./widget":11}],10:[function(_dereq_,module,exports){
var utils = _dereq_('../utils');


module.exports = _dereq_('./widget').extend()
  .prop('width')
  .default(400)

  .prop('colspan')
  .default(4)

  .prop('colors')

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

  .prop('value')
  .set(d3.functor)
  .default(function(d) { return d.value; })

  .prop('margin')
  .default({
    top: 20,
    left: 20,
    right: 20,
    bottom: 20
  })

  .prop('innerRadius')
  .set(d3.functor)
  .default(function(r) { return 0.35 * r; })

  .prop('valueFormat')
  .default(d3.format(',2s'))

  .prop('percentFormat')
  .default(d3.format('.0%'))

  .init(function() {
    this.colors(d3.scale.category10());
  })

  .meth('normalize', function(el) {
    var self = this;
    var node = el.node();

    el.datum(function(d, i) {
      return {
        title: self.title().call(node, d, i),
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
        value: self.value().call(node, d, i)
      };
    }

    var sum = d3.sum(el.datum().metrics, function(d) { return d.value; });
    el.datum().metrics.forEach(function(d) { d.percent = d.value / sum; });
  })

  .enter(function(el) {
    el.attr('class', 'pie widget');

    el.append('div')
      .attr('class', 'title');

    el.append('div')
      .attr('class', 'chart');

    el.append('div')
      .attr('class', 'legend');
  })

  .draw(function(el) {
    this.normalize(el);

    el.style('width', utils.px(this.width()));

    el.select('.widget .title')
      .text(function(d) { return d.title; });

    el.select('.legend')
      .call(legend(this));

    el.select('.chart')
      .call(chart(this));
  });


var chart = _dereq_('../view').extend()
  .prop('widget')

  .init(function(widget) {
    this.widget(widget);
  })

  .enter(function(el) {
    el.append('svg')
      .append('g');
  })

  .draw(function(el) {
    var width = utils.innerWidth(el);

    var dims = utils.box()
      .margin(this.widget().margin())
      .width(width)
      .height(width)
      .calc();

    var radius = Math.min(dims.innerWidth, dims.innerHeight) / 2;

    var svg = el.select('svg')
      .attr('width', dims.width)
      .attr('height', dims.height)
      .select('g')
        .attr('transform', utils.translate(
          (dims.width / 2) - radius,
          (dims.height / 2) - radius));

    var arc = d3.svg.arc()
      .innerRadius(this.widget().innerRadius()(radius))
      .outerRadius(radius);

    var layout = d3.layout.pie()
      .value(function(d) { return d.value; });

    var slice = svg.selectAll('.slice')
      .data(function(d) { return layout(d.metrics); },
            function(d) { return d.data.key; });

    slice.enter().append('g')
      .attr('class', 'slice')
      .append('path');

    slice
      .attr('transform', utils.translate(radius, radius));

    slice.select('path')
      .attr('d', arc)
      .style('fill', function(d) { return d.data.color; });

    slice.exit()
      .remove();
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
    var valueFormat = this.widget().valueFormat();
    var percentFormat = this.widget().percentFormat();

    var metric = el.select('.table').selectAll('.metric')
      .data(function(d) { return d.metrics; },
            function(d) { return d.key; });

    var enterMetric = metric.enter().append('tr')
      .attr('class', 'metric');

    enterMetric.append('td')
      .attr('class', 'swatch');

    enterMetric.append('td')
      .attr('class', 'title');

    enterMetric.append('td')
      .attr('class', 'percent');

    enterMetric.append('td')
      .attr('class', 'value');

    metric.select('.swatch')
      .style('background', function(d) { return d.color; });

    metric.select('.title')
      .text(function(d) { return d.title; });

    metric.select('.percent')
      .text(function(d) { return percentFormat(d.percent); });

    metric.select('.value')
      .text(function(d) { return valueFormat(d.value); });

    metric.exit()
      .remove();
  });

},{"../utils":4,"../view":5,"./widget":11}],11:[function(_dereq_,module,exports){
module.exports = _dereq_('../view').extend()
  .prop('colspan')
  .default(0)

  .prop('rowspan')
  .default(0)

  .prop('width')
  .set(d3.functor)
  .default(0)

  .prop('height')
  .set(d3.functor)
  .default(0);

},{"../view":5}]},{},[3])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy9kYXNoYm9hcmQuanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvZ3JpZC5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy9pbmRleC5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy91dGlscy5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy92aWV3LmpzIiwiL2hvbWUvanVzdGluL3ByYWVrZWx0L3NhcHBoaXJlL3NyYy9zY3JpcHRzL3dpZGdldHMvYmFycy5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy93aWRnZXRzL2luZGV4LmpzIiwiL2hvbWUvanVzdGluL3ByYWVrZWx0L3NhcHBoaXJlL3NyYy9zY3JpcHRzL3dpZGdldHMvbGFzdC5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy93aWRnZXRzL2xpbmVzLmpzIiwiL2hvbWUvanVzdGluL3ByYWVrZWx0L3NhcHBoaXJlL3NyYy9zY3JpcHRzL3dpZGdldHMvcGllLmpzIiwiL2hvbWUvanVzdGluL3ByYWVrZWx0L3NhcHBoaXJlL3NyYy9zY3JpcHRzL3dpZGdldHMvd2lkZ2V0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbk5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeFBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG52YXIgbGF5b3V0ID0gcmVxdWlyZSgnLi9ncmlkJyk7XG52YXIgd2lkZ2V0cyA9IHJlcXVpcmUoJy4vd2lkZ2V0cycpO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi92aWV3JykuZXh0ZW5kKClcbiAgLnByb3AoJ3NjYWxlJylcbiAgLmRlZmF1bHQoMTAwKVxuXG4gIC5wcm9wKCd0eXBlcycpXG5cbiAgLnByb3AoJ3RpdGxlJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLnRpdGxlOyB9KVxuXG4gIC5wcm9wKCdrZXknKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIGk7IH0pXG5cbiAgLnByb3AoJ3R5cGUnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudHlwZTsgfSlcblxuICAucHJvcCgnd2lkZ2V0cycpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC53aWRnZXRzOyB9KVxuXG4gIC5wcm9wKCdjb2wnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHtcbiAgICByZXR1cm4gdXRpbHMuYWNjZXNzKGQsICdjb2wnKTtcbiAgfSlcblxuICAucHJvcCgncm93JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7XG4gICAgcmV0dXJuIHV0aWxzLmFjY2VzcyhkLCAncm93Jyk7XG4gIH0pXG5cbiAgLnByb3AoJ2NvbHNwYW4nKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHtcbiAgICByZXR1cm4gdXRpbHMuYWNjZXNzKGQsICdjb2xzcGFuJyk7XG4gIH0pXG5cbiAgLnByb3AoJ3Jvd3NwYW4nKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHtcbiAgICByZXR1cm4gdXRpbHMuYWNjZXNzKGQsICdyb3dzcGFuJyk7XG4gIH0pXG5cbiAgLnByb3AoJ251bWNvbHMnKVxuICAuZGVmYXVsdCg4KVxuXG4gIC5wcm9wKCdwYWRkaW5nJylcbiAgLmRlZmF1bHQoNSlcblxuICAuaW5pdChmdW5jdGlvbigpIHtcbiAgICB2YXIgdHlwZXMgPSBkMy5tYXAoKTtcblxuICAgIGQzLmtleXMod2lkZ2V0cykuZm9yRWFjaChmdW5jdGlvbihrKSB7XG4gICAgICB0eXBlcy5zZXQoaywgd2lkZ2V0c1trXS5uZXcoKSk7XG4gICAgfSk7XG5cbiAgICB0aGlzLnR5cGVzKHR5cGVzKTtcbiAgfSlcblxuICAuZW50ZXIoZnVuY3Rpb24oZWwpIHtcbiAgICBlbC5hdHRyKCdjbGFzcycsICdkYXNoYm9hcmQnKVxuICAgICAgLmFwcGVuZCgnZGl2JylcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ3dpZGdldHMnKTtcbiAgfSlcblxuICAubWV0aCgnbm9ybWFsaXplJywgZnVuY3Rpb24oZWwpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIG5vZGUgPSBlbC5ub2RlKCk7XG5cbiAgICBlbC5kYXR1bShmdW5jdGlvbihkLCBpKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0aXRsZTogc2VsZi50aXRsZSgpXG4gICAgICAgICAgLmNhbGwobm9kZSwgZCwgaSksXG4gICAgICAgIHdpZGdldHM6IHNlbGYud2lkZ2V0cygpXG4gICAgICAgICAgLmNhbGwobm9kZSwgZCwgaSlcbiAgICAgICAgICAubWFwKHdpZGdldERhdHVtKVxuICAgICAgfTtcbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uIHdpZGdldERhdHVtKGQsIGkpIHtcbiAgICAgIHZhciB0eXBlbmFtZSA9IHNlbGYudHlwZSgpLmNhbGwobm9kZSwgZCwgaSk7XG4gICAgICB2YXIgdHlwZSA9IHNlbGYudHlwZXMoKS5nZXQodHlwZW5hbWUpO1xuXG4gICAgICBpZiAoIXR5cGUpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5yZWNvZ25pc2VkIGRhc2hib2FyZCB3aWRnZXQgdHlwZSAnXCIgKyB0eXBlbmFtZSArIFwiJ1wiKTtcbiAgICAgIH1cblxuICAgICAgdmFyIGNvbHNwYW4gPSBzZWxmLmNvbHNwYW4oKS5jYWxsKG5vZGUsIGQsIGkpO1xuICAgICAgY29sc3BhbiA9IHV0aWxzLmVuc3VyZShjb2xzcGFuLCB0eXBlLmNvbHNwYW4oKSk7XG4gICAgICB2YXIgcm93c3BhbiA9IHNlbGYucm93c3BhbigpLmNhbGwobm9kZSwgZCwgaSk7XG4gICAgICByb3dzcGFuID0gdXRpbHMuZW5zdXJlKHJvd3NwYW4sIHR5cGUucm93c3BhbigpKTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgZGF0YTogZCxcbiAgICAgICAgdHlwZTogdHlwZSxcbiAgICAgICAgY29sc3BhbjogY29sc3BhbixcbiAgICAgICAgcm93c3Bhbjogcm93c3BhbixcbiAgICAgICAga2V5OiBzZWxmLmtleSgpLmNhbGwobm9kZSwgZCwgaSksXG4gICAgICAgIGNvbDogc2VsZi5jb2woKS5jYWxsKG5vZGUsIGQsIGkpLFxuICAgICAgICByb3c6IHNlbGYucm93KCkuY2FsbChub2RlLCBkLCBpKVxuICAgICAgfTtcbiAgICB9XG4gIH0pXG5cbiAgLmRyYXcoZnVuY3Rpb24oZWwpIHtcbiAgICB0aGlzLm5vcm1hbGl6ZShlbCk7XG4gICAgdmFyIHdpZGdldERhdGEgPSBlbC5kYXR1bSgpLndpZGdldHM7XG5cbiAgICB0aGlzLnR5cGVzKClcbiAgICAgIC5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUsIHR5cGUpIHtcbiAgICAgICAgdHlwZS53aWR0aCh3aWRnZXRXaWR0aCk7XG4gICAgICAgIHR5cGUuaGVpZ2h0KHdpZGdldEhlaWdodCk7XG4gICAgICB9KTtcblxuICAgIHZhciBncmlkID0gbGF5b3V0KClcbiAgICAgIC5zY2FsZSh0aGlzLnNjYWxlKCkpXG4gICAgICAubnVtY29scyh0aGlzLm51bWNvbHMoKSlcbiAgICAgIC5wYWRkaW5nKHRoaXMucGFkZGluZygpKVxuICAgICAgLmNvbChmdW5jdGlvbihkKSB7IHJldHVybiBkLmNvbDsgfSlcbiAgICAgIC5yb3coZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5yb3c7IH0pXG4gICAgICAuY29sc3BhbihmdW5jdGlvbihkKSB7IHJldHVybiBkLmNvbHNwYW47IH0pXG4gICAgICAucm93c3BhbihmdW5jdGlvbihkKSB7IHJldHVybiBkLnJvd3NwYW47IH0pO1xuICAgIFxuICAgIGVsLnN0eWxlKCd3aWR0aCcsIHV0aWxzLnB4KGdyaWQuc2NhbGUoKSAqIGdyaWQubnVtY29scygpKSk7XG5cbiAgICB2YXIgd2lkZ2V0ID0gZWwuc2VsZWN0KCcud2lkZ2V0cycpLnNlbGVjdEFsbCgnLndpZGdldCcpXG4gICAgICAuZGF0YSh3aWRnZXREYXRhLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLmtleTsgfSk7XG5cbiAgICB3aWRnZXQuZW50ZXIoKS5hcHBlbmQoJ2RpdicpO1xuICAgIHV0aWxzLm1ldGEod2lkZ2V0LCBmdW5jdGlvbihkKSB7IHJldHVybiBkOyB9KTtcblxuICAgIHdpZGdldFxuICAgICAgLmNsYXNzZWQoJ3dpZGdldCcsIHRydWUpXG4gICAgICAuZWFjaChmdW5jdGlvbihkKSB7XG4gICAgICAgIHZhciB3aWRnZXRFbCA9IGQzLnNlbGVjdCh0aGlzKVxuICAgICAgICAgIC5kYXR1bShkLmRhdGEpXG4gICAgICAgICAgLmNhbGwoZC50eXBlKTtcblxuICAgICAgICB2YXIgd2lkdGggPSBwYXJzZUludCh3aWRnZXRFbC5zdHlsZSgnd2lkdGgnKSk7XG4gICAgICAgIGQuY29sc3BhbiA9IE1hdGgubWF4KGQuY29sc3BhbiwgZ3JpZC5sZW5ndGhTcGFuKHdpZHRoKSk7XG5cbiAgICAgICAgdmFyIGhlaWdodCA9IHBhcnNlSW50KHdpZGdldEVsLnN0eWxlKCdoZWlnaHQnKSk7XG4gICAgICAgIGQucm93c3BhbiA9IE1hdGgubWF4KGQucm93c3BhbiwgZ3JpZC5sZW5ndGhTcGFuKGhlaWdodCkpO1xuICAgICAgfSk7XG5cbiAgICB2YXIgZ3JpZEVscyA9IGdyaWQod2lkZ2V0RGF0YSk7XG5cbiAgICB3aWRnZXRcbiAgICAgIC5zdHlsZSgnbGVmdCcsIHV0aWxzLnB4KGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIGdyaWRFbHNbaV0ueDsgfSkpXG4gICAgICAuc3R5bGUoJ3RvcCcsIHV0aWxzLnB4KGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIGdyaWRFbHNbaV0ueTsgfSkpO1xuXG4gICAgd2lkZ2V0LmV4aXQoKS5yZW1vdmUoKTtcblxuICAgIGZ1bmN0aW9uIHdpZGdldFdpZHRoKCkge1xuICAgICAgcmV0dXJuIGdyaWQuc3Bhbkxlbmd0aCh1dGlscy5tZXRhKHRoaXMpLmNvbHNwYW4pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHdpZGdldEhlaWdodCgpIHtcbiAgICAgIHJldHVybiBncmlkLnNwYW5MZW5ndGgodXRpbHMubWV0YSh0aGlzKS5yb3dzcGFuKTtcbiAgICB9XG4gIH0pO1xuIiwidmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xuXG5cbnZhciBncmlkID0gbW9kdWxlLmV4cG9ydHMgPSBzdHJhaW4oKVxuICAucHJvcCgnY29sJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7XG4gICAgcmV0dXJuIHV0aWxzLmFjY2VzcyhkLCAnY29sJyk7XG4gIH0pXG5cbiAgLnByb3AoJ3JvdycpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkge1xuICAgIHJldHVybiB1dGlscy5hY2Nlc3MoZCwgJ3JvdycpO1xuICB9KVxuXG4gIC5wcm9wKCdudW1jb2xzJylcbiAgLmRlZmF1bHQoOClcblxuICAucHJvcCgnc2NhbGUnKVxuICAuZGVmYXVsdCgxMClcblxuICAucHJvcCgncGFkZGluZycpXG4gIC5kZWZhdWx0KDUpXG5cbiAgLnByb3AoJ2NvbHNwYW4nKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHtcbiAgICByZXR1cm4gdXRpbHMuYWNjZXNzKGQsICdjb2xzcGFuJywgMSk7XG4gIH0pXG5cbiAgLnByb3AoJ3Jvd3NwYW4nKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHtcbiAgICByZXR1cm4gdXRpbHMuYWNjZXNzKGQsICdyb3dzcGFuJywgMSk7XG4gIH0pXG5cbiAgLmludm9rZShmdW5jdGlvbihkYXRhKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBiZXN0ID0gY291bnRlcigpLm51bWNvbHModGhpcy5udW1jb2xzKCkpO1xuXG4gICAgZGF0YSA9IChkYXRhIHx8IFtdKVxuICAgICAgLm1hcChmdW5jdGlvbihkLCBpKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgZGF0YTogZCxcbiAgICAgICAgICBjb2w6IHNlbGYuY29sKCkuY2FsbChzZWxmLCBkLCBpKSwgXG4gICAgICAgICAgcm93OiBzZWxmLnJvdygpLmNhbGwoc2VsZiwgZCwgaSksXG4gICAgICAgICAgcm93c3Bhbjogc2VsZi5yb3dzcGFuKCkuY2FsbChzZWxmLCBkLCBpKSxcbiAgICAgICAgICBjb2xzcGFuOiBzZWxmLmNvbHNwYW4oKS5jYWxsKHNlbGYsIGQsIGkpXG4gICAgICAgIH07XG4gICAgICB9KVxuICAgICAgLm1hcChiZXN0KTtcblxuICAgIHZhciBxdWFkdHJlZSA9IGQzLmdlb20ucXVhZHRyZWUoKVxuICAgICAgLngoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5jb2w7IH0pXG4gICAgICAueShmdW5jdGlvbihkKSB7IHJldHVybiBkLnJvdzsgfSk7XG5cbiAgICB2YXIgcm9vdCA9IHF1YWR0cmVlKGRhdGEpO1xuXG4gICAgZGF0YS5mb3JFYWNoKGZ1bmN0aW9uKGQpIHtcbiAgICAgIHJvb3QudmlzaXQoZ3JpZC51bmNvbGxpZGUoZCkpO1xuICAgICAgZC54ID0gc2VsZi5pbmRleE9mZnNldChkLmNvbCk7XG4gICAgICBkLnkgPSBzZWxmLmluZGV4T2Zmc2V0KGQucm93KTtcbiAgICAgIGQud2lkdGggPSBzZWxmLnNwYW5MZW5ndGgoZC5jb2xzcGFuKTtcbiAgICAgIGQuaGVpZ2h0ID0gc2VsZi5zcGFuTGVuZ3RoKGQucm93c3Bhbik7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gZGF0YTtcbiAgfSlcblxuICAubWV0aCgnaW5kZXhPZmZzZXQnLCBmdW5jdGlvbihpbmRleCkge1xuICAgIHJldHVybiAoaW5kZXggKiB0aGlzLnNjYWxlKCkpICsgdGhpcy5wYWRkaW5nKCk7XG4gIH0pXG5cbiAgLm1ldGgoJ3NwYW5MZW5ndGgnLCBmdW5jdGlvbihzcGFuKSB7XG4gICAgcmV0dXJuIChzcGFuICogdGhpcy5zY2FsZSgpKSAtICh0aGlzLnBhZGRpbmcoKSAqIDIpO1xuICB9KVxuXG4gIC5tZXRoKCdvZmZzZXRJbmRleCcsIGZ1bmN0aW9uKG9mZnNldCkge1xuICAgIHJldHVybiBNYXRoLmNlaWwoKG9mZnNldCAtIHRoaXMucGFkZGluZygpKSAvIHRoaXMuc2NhbGUoKSk7XG4gIH0pXG5cbiAgLm1ldGgoJ2xlbmd0aFNwYW4nLCBmdW5jdGlvbihsZW4pIHtcbiAgICByZXR1cm4gTWF0aC5jZWlsKChsZW4gKyAodGhpcy5wYWRkaW5nKCkgKiAyKSkgLyB0aGlzLnNjYWxlKCkpO1xuICB9KVxuXG4gIC5zdGF0aWMoJ2JveCcsIGZ1bmN0aW9uKGQpIHtcbiAgICByZXR1cm4ge1xuICAgICAgeDE6IGQuY29sLFxuICAgICAgeDI6IGQuY29sICsgZC5jb2xzcGFuIC0gMSxcbiAgICAgIHkxOiBkLnJvdyxcbiAgICAgIHkyOiBkLnJvdyArIGQucm93c3BhbiAtIDFcbiAgICB9O1xuICB9KVxuXG4gIC5zdGF0aWMoJ3VuY29sbGlkZScsIGZ1bmN0aW9uKGEpIHtcbiAgICB2YXIgYm94QSA9IGdyaWQuYm94KGEpO1xuICAgIFxuICAgIHJldHVybiBmdW5jdGlvbihub2RlLCB4MSwgeTEsIHgyLCB5Mikge1xuICAgICAgdmFyIGIgPSBub2RlLnBvaW50O1xuXG4gICAgICBpZiAoYiAmJiBhICE9PSBiICYmIGdyaWQuaW50ZXJzZWN0aW9uKGJveEEsIGdyaWQuYm94KGIpKSkge1xuICAgICAgICBiLnJvdyA9IGJveEEueTIgKyAxO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gIWdyaWQuaW50ZXJzZWN0aW9uKGJveEEsIHtcbiAgICAgICAgeDE6IHgxLCBcbiAgICAgICAgeTE6IHkxLCBcbiAgICAgICAgeDI6IHgyLFxuICAgICAgICB5MjogeTJcbiAgICAgIH0pO1xuICAgIH07XG4gIH0pXG5cbiAgLnN0YXRpYygnaW50ZXJzZWN0aW9uJywgZnVuY3Rpb24oYSwgYikge1xuICAgIHJldHVybiAoKGEueDEgPD0gYi54MSAmJiBiLngxIDw9IGEueDIpICYmIChhLnkxIDw9IGIueTEgJiYgYi55MSA8PSBhLnkyKSlcbiAgICAgICAgfHwgKChiLngxIDw9IGEueDEgJiYgYS54MSA8PSBiLngyKSAmJiAoYi55MSA8PSBhLnkxICYmIGEueTEgPD0gYi55MikpXG4gICAgICAgIHx8ICgoYS54MSA8PSBiLngyICYmIGIueDIgPD0gYS54MikgJiYgKGEueTEgPD0gYi55MSAmJiBiLnkxIDw9IGEueTIpKVxuICAgICAgICB8fCAoKGIueDEgPD0gYS54MiAmJiBhLngyIDw9IGIueDIpICYmIChiLnkxIDw9IGEueTEgJiYgYS55MSA8PSBiLnkyKSk7XG4gIH0pO1xuXG5cbnZhciBjb3VudGVyID0gc3RyYWluKClcbiAgLnByb3AoJ251bWNvbHMnKVxuXG4gIC5wcm9wKCdyb3dzcGFuJylcbiAgLmRlZmF1bHQoMClcblxuICAucHJvcCgnY29sJylcbiAgLmRlZmF1bHQoMClcblxuICAucHJvcCgncm93JylcbiAgLmRlZmF1bHQoMClcblxuICAuaW52b2tlKGZ1bmN0aW9uKGQpIHtcbiAgICBkLmNvbCA9IHV0aWxzLmVuc3VyZShkLmNvbCwgdGhpcy5jb2woKSk7XG4gICAgZC5yb3cgPSB1dGlscy5lbnN1cmUoZC5yb3csIHRoaXMucm93KCkpO1xuXG4gICAgaWYgKGQuY29sICsgZC5jb2xzcGFuID4gdGhpcy5udW1jb2xzKCkpIHtcbiAgICAgIGQuY29sID0gMDtcbiAgICAgIGQucm93ICs9IHRoaXMucm93c3BhbigpO1xuICAgICAgdGhpcy5yb3dzcGFuKDApO1xuICAgIH1cblxuICAgIHRoaXNcbiAgICAgIC5jb2woZC5jb2wgKyBkLmNvbHNwYW4pXG4gICAgICAucm93KGQucm93KVxuICAgICAgLnJvd3NwYW4oTWF0aC5tYXgodGhpcy5yb3dzcGFuKCksIGQucm93c3BhbikpO1xuXG4gICAgcmV0dXJuIGQ7XG4gIH0pO1xuIiwiZXhwb3J0cy51dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcbmV4cG9ydHMudmlldyA9IHJlcXVpcmUoJy4vdmlldycpO1xuZXhwb3J0cy5ncmlkID0gcmVxdWlyZSgnLi9ncmlkJyk7XG5leHBvcnRzLndpZGdldHMgPSByZXF1aXJlKCcuL3dpZGdldHMnKTtcbmV4cG9ydHMuZGFzaGJvYXJkID0gcmVxdWlyZSgnLi9kYXNoYm9hcmQnKTtcbiIsInZhciB1dGlscyA9IGV4cG9ydHM7XG5cblxudXRpbHMuYWNjZXNzID0gZnVuY3Rpb24oZCwgbmFtZSwgZGVmYXVsdHZhbCkge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDMpIHtcbiAgICBkZWZhdWx0dmFsID0gbnVsbDtcbiAgfVxuXG4gIGlmICh0eXBlb2YgZCAhPSAnb2JqZWN0Jykge1xuICAgIHJldHVybiBkZWZhdWx0dmFsO1xuICB9XG5cbiAgdmFyIHZhbCA9IGRbbmFtZV07XG4gIHJldHVybiB0eXBlb2YgdmFsID09ICd1bmRlZmluZWQnXG4gICAgPyBkZWZhdWx0dmFsXG4gICAgOiB2YWw7XG59O1xuXG5cbnV0aWxzLmVuc3VyZSA9IGZ1bmN0aW9uKHYsIGRlZmF1bHR2YWwpIHtcbiAgcmV0dXJuIHYgPT09IG51bGwgfHwgdHlwZW9mIHYgPT0gJ3VuZGVmaW5lZCdcbiAgICA/IGRlZmF1bHR2YWxcbiAgICA6IHY7XG59O1xuXG5cbnV0aWxzLnRyYW5zbGF0ZSA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgcmV0dXJuICd0cmFuc2xhdGUoJyArIHggKyAnLCAnICsgeSArICcpJztcbn07XG5cblxudXRpbHMuZW5zdXJlRWwgPSBmdW5jdGlvbihlbCkge1xuICByZXR1cm4gIShlbCBpbnN0YW5jZW9mIGQzLnNlbGVjdGlvbilcbiAgICA/IGQzLnNlbGVjdChlbClcbiAgICA6IGVsO1xufTtcblxuXG51dGlscy5kYXRlID0gZnVuY3Rpb24odCkge1xuICByZXR1cm4gbmV3IERhdGUodCk7XG59O1xuXG5cbnV0aWxzLnB4ID0gZnVuY3Rpb24oZm4pIHtcbiAgZm4gPSBkMy5mdW5jdG9yKGZuKTtcblxuICByZXR1cm4gZnVuY3Rpb24oZCwgaSkge1xuICAgIHJldHVybiBmbi5jYWxsKHRoaXMsIGQsIGkpICsgJ3B4JztcbiAgfTtcbn07XG5cblxudXRpbHMubWV0YSA9IGZ1bmN0aW9uKGVsLCBmbikge1xuICBlbCA9IHV0aWxzLmVuc3VyZUVsKGVsKTtcblxuICByZXR1cm4gYXJndW1lbnRzLmxlbmd0aCA+IDFcbiAgICA/IGVsLnByb3BlcnR5KCdfX3NhcHBoaXJlX21ldGFfXycsIGZuKVxuICAgIDogZWwucHJvcGVydHkoJ19fc2FwcGhpcmVfbWV0YV9fJyk7XG59O1xuXG5cbnV0aWxzLmJveCA9IHN0cmFpbigpXG4gIC5wcm9wKCd3aWR0aCcpXG4gIC5kZWZhdWx0KDApXG5cbiAgLnByb3AoJ2hlaWdodCcpXG4gIC5kZWZhdWx0KDApXG5cbiAgLnByb3AoJ21hcmdpbicpXG4gIC5kZWZhdWx0KHtcbiAgICB0b3A6IDAsXG4gICAgbGVmdDogMCxcbiAgICByaWdodDogMCxcbiAgICBib3R0b206IDBcbiAgfSlcblxuICAubWV0aCgnY2FsYycsIGZ1bmN0aW9uKCkge1xuICAgIHZhciBkID0ge307XG4gICAgZC5tYXJnaW4gPSB0aGlzLm1hcmdpbigpO1xuICAgIGQud2lkdGggPSB0aGlzLndpZHRoKCk7XG4gICAgZC5oZWlnaHQgPSB0aGlzLmhlaWdodCgpO1xuICAgIGQuaW5uZXJXaWR0aCA9IGQud2lkdGggLSBkLm1hcmdpbi5sZWZ0IC0gZC5tYXJnaW4ucmlnaHQ7XG4gICAgZC5pbm5lckhlaWdodCA9IGQuaGVpZ2h0IC0gZC5tYXJnaW4udG9wIC0gZC5tYXJnaW4uYm90dG9tO1xuICAgIHJldHVybiBkO1xuICB9KVxuXG4gIC5pbnZva2UoZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuY2FsYygpO1xuICB9KTtcblxuXG51dGlscy5pbm5lcldpZHRoID0gZnVuY3Rpb24oZWwpIHtcbiAgcmV0dXJuIHV0aWxzLm1lYXN1cmUoZWwsICd3aWR0aCcpXG4gICAgICAgLSB1dGlscy5tZWFzdXJlKGVsLCAncGFkZGluZy1sZWZ0JylcbiAgICAgICAtIHV0aWxzLm1lYXN1cmUoZWwsICdwYWRkaW5nLXJpZ2h0Jyk7XG59O1xuXG5cbnV0aWxzLmlubmVySGVpZ2h0ID0gZnVuY3Rpb24oZWwpIHtcbiAgcmV0dXJuIHV0aWxzLm1lYXN1cmUoZWwsICdoZWlnaHQnKVxuICAgICAgIC0gdXRpbHMubWVhc3VyZShlbCwgJ3BhZGRpbmctdG9wJylcbiAgICAgICAtIHV0aWxzLm1lYXN1cmUoZWwsICdwYWRkaW5nLWJvdHRvbScpO1xufTtcblxuXG51dGlscy5tZWFzdXJlID0gZnVuY3Rpb24oZWwsIG5hbWUpIHtcbiAgZWwgPSB1dGlscy5lbnN1cmVFbChlbCk7XG4gIHJldHVybiBwYXJzZUludChlbC5zdHlsZShuYW1lKSk7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBzdHJhaW4oKVxuICAuc3RhdGljKCdkcmF3JywgZnVuY3Rpb24oZm4pIHtcbiAgICB0aGlzLm1ldGgoJ19kcmF3XycsIGZuKTtcbiAgfSlcbiAgLmRyYXcoZnVuY3Rpb24oKSB7fSlcblxuICAuc3RhdGljKCdlbnRlcicsIGZ1bmN0aW9uKGZuKSB7XG4gICAgdGhpcy5tZXRoKCdfZW50ZXJfJywgZm4pO1xuICB9KVxuICAuZW50ZXIoZnVuY3Rpb24oKSB7fSlcblxuICAubWV0aCgnZHJhdycsIGZ1bmN0aW9uKGVsKSB7XG4gICAgdmFyIGRhdHVtO1xuICAgIGVsID0gc2FwcGhpcmUudXRpbHMuZW5zdXJlRWwoZWwpO1xuXG4gICAgaWYgKGVsLm5vZGUoKSkge1xuICAgICAgZGF0dW0gPSBlbC5kYXR1bSgpO1xuICAgIH1cblxuICAgIGlmIChlbC5ub2RlKCkgJiYgIWVsLm5vZGUoKS5oYXNDaGlsZE5vZGVzKCkpIHtcbiAgICAgIHRoaXMuZW50ZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICB2YXIgcGFyZW50ID0gdGhpcy5fdHlwZV8uX3N1cGVyXy5wcm90b3R5cGU7XG4gICAgaWYgKCdfZHJhd18nIGluIHBhcmVudCkge1xuICAgICAgcGFyZW50Ll9kcmF3Xy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIHRoaXMuX2RyYXdfLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICBpZiAodHlwZW9mIGRhdHVtICE9ICd1bmRlZmluZWQnKSB7XG4gICAgICBlbC5kYXR1bShkYXR1bSk7XG4gICAgfVxuICB9KVxuXG4gIC5tZXRoKCdlbnRlcicsIGZ1bmN0aW9uKGVsKSB7XG4gICAgZWwgPSBzYXBwaGlyZS51dGlscy5lbnN1cmVFbChlbCk7XG5cbiAgICB2YXIgcGFyZW50ID0gdGhpcy5fdHlwZV8uX3N1cGVyXy5wcm90b3R5cGU7XG4gICAgaWYgKCdfZW50ZXJfJyBpbiBwYXJlbnQpIHtcbiAgICAgIHBhcmVudC5fZW50ZXJfLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgdGhpcy5fZW50ZXJfLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH0pXG5cbiAgLmludm9rZShmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5kcmF3LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH0pO1xuIiwidmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vd2lkZ2V0JykuZXh0ZW5kKClcbiAgLnByb3AoJ3dpZHRoJylcbiAgLmRlZmF1bHQoNDAwKVxuXG4gIC5wcm9wKCdjb2xzcGFuJylcbiAgLmRlZmF1bHQoNClcblxuICAucHJvcCgncm93c3BhbicpXG4gIC5kZWZhdWx0KDIpXG5cbiAgLnByb3AoJ2hlaWdodCcpXG4gIC5kZWZhdWx0KDIwMClcblxuICAucHJvcCgnYmFyUGFkZGluZycpXG4gIC5kZWZhdWx0KDIuNSlcblxuICAucHJvcCgnbWFyZ2luJylcbiAgLmRlZmF1bHQoe1xuICAgIHRvcDogMTAsXG4gICAgbGVmdDogMzgsXG4gICAgcmlnaHQ6IDE1LFxuICAgIGJvdHRvbTogNDVcbiAgfSlcblxuICAucHJvcCgndGl0bGUnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGl0bGU7IH0pXG5cbiAgLnByb3AoJ3ZhbHVlcycpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC52YWx1ZXM7IH0pXG5cbiAgLnByb3AoJ3gnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueDsgfSlcblxuICAucHJvcCgneScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC55OyB9KVxuXG4gIC5wcm9wKCdkeCcpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQobnVsbClcblxuICAucHJvcCgneFRpY2tGb3JtYXQnKVxuICAuZGVmYXVsdChudWxsKVxuXG4gIC5wcm9wKCd4VGlja3MnKVxuICAuZGVmYXVsdCg4KVxuXG4gIC5wcm9wKCd5VGlja0Zvcm1hdCcpXG4gIC5kZWZhdWx0KGQzLmZvcm1hdCgnLjJzJykpXG5cbiAgLnByb3AoJ3lUaWNrcycpXG4gIC5kZWZhdWx0KDUpXG5cbiAgLnByb3AoJ2NvbG9ycycpXG5cbiAgLmluaXQoZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5jb2xvcnMoZDMuc2NhbGUuY2F0ZWdvcnkxMCgpKTtcbiAgfSlcblxuICAubWV0aCgnbm9ybWFsaXplJywgZnVuY3Rpb24oZWwpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIG5vZGUgPSBlbC5ub2RlKCk7XG5cbiAgICBlbC5kYXR1bShmdW5jdGlvbihkLCBpKSB7XG4gICAgICB2YXIgdmFsdWVzID0gc2VsZi52YWx1ZXMoKVxuICAgICAgICAuY2FsbChub2RlLCBkLCBpKVxuICAgICAgICAubWFwKHZhbHVlKTtcblxuICAgICAgdmFyIGxlbiA9IHZhbHVlcy5sZW5ndGg7XG4gICAgICB2YXIgZHhBdmcgPSB2YWx1ZXMubGVuZ3RoXG4gICAgICAgID8gKHZhbHVlc1tsZW4gLSAxXS54IC0gdmFsdWVzWzBdLngpIC8gbGVuXG4gICAgICAgIDogMDtcblxuICAgICAgdmFsdWVzLmZvckVhY2goZnVuY3Rpb24oZCkge1xuICAgICAgICBkLmR4ID0gdXRpbHMuZW5zdXJlKGQuZHgsIGR4QXZnKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICB2YWx1ZXM6IHZhbHVlcyxcbiAgICAgICAgdGl0bGU6IHNlbGYudGl0bGUoKS5jYWxsKG5vZGUsIGQsIGkpXG4gICAgICB9O1xuICAgIH0pO1xuXG4gICAgZnVuY3Rpb24gdmFsdWUoZCwgaSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgeDogc2VsZi54KCkuY2FsbChub2RlLCBkLCBpKSxcbiAgICAgICAgeTogc2VsZi55KCkuY2FsbChub2RlLCBkLCBpKSxcbiAgICAgICAgZHg6IHNlbGYuZHgoKS5jYWxsKG5vZGUsIGQsIGkpLFxuICAgICAgICB3aWR0aDogc2VsZi53aWR0aCgpLmNhbGwobm9kZSwgZCwgaSksXG4gICAgICAgIGhlaWdodDogc2VsZi5oZWlnaHQoKS5jYWxsKG5vZGUsIGQsIGkpXG4gICAgICB9O1xuICAgIH1cbiAgfSlcblxuICAuZW50ZXIoZnVuY3Rpb24oZWwpIHtcbiAgICBlbC5hdHRyKCdjbGFzcycsICdiYXJzIHdpZGdldCcpO1xuXG4gICAgZWwuYXBwZW5kKCdkaXYnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3RpdGxlJyk7XG5cbiAgICB2YXIgc3ZnID0gZWwuYXBwZW5kKCdkaXYnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ2NoYXJ0JylcbiAgICAgIC5hcHBlbmQoJ3N2ZycpXG4gICAgICAuYXBwZW5kKCdnJyk7XG5cbiAgICBzdmcuYXBwZW5kKCdnJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdiYXJzJyk7XG5cbiAgICBzdmcuYXBwZW5kKCdnJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd5IGF4aXMnKTtcblxuICAgIHN2Zy5hcHBlbmQoJ2cnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3ggYXhpcycpO1xuICB9KVxuXG4gIC5kcmF3KGZ1bmN0aW9uKGVsKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHRoaXMubm9ybWFsaXplKGVsKTtcblxuICAgIGVsLnN0eWxlKCd3aWR0aCcsIHV0aWxzLnB4KHRoaXMud2lkdGgoKSkpXG4gICAgICAuc3R5bGUoJ2hlaWdodCcsIHV0aWxzLnB4KHRoaXMuaGVpZ2h0KCkpKTtcblxuICAgIGVsLnNlbGVjdCgnLndpZGdldCAudGl0bGUnKVxuICAgICAgLnRleHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50aXRsZTsgfSk7XG5cbiAgICB2YXIgY2hhcnQgPSBlbC5zZWxlY3QoJy5jaGFydCcpXG4gICAgICAuZGF0dW0oZnVuY3Rpb24oZCkgeyByZXR1cm4gZC52YWx1ZXM7IH0pO1xuXG4gICAgdmFyIGZ4ID0gZDMudGltZS5zY2FsZSgpXG4gICAgICAuZG9tYWluKFtcbiAgICAgICAgZDMubWluKGNoYXJ0LmRhdHVtKCksIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueDsgfSksXG4gICAgICAgIGQzLm1heChjaGFydC5kYXR1bSgpLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLnggKyBkLmR4OyB9KV0pO1xuXG4gICAgdmFyIGZ5ID0gZDMuc2NhbGUubGluZWFyKClcbiAgICAgIC5kb21haW4oWzAsIGQzLm1heChjaGFydC5kYXR1bSgpLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLnk7IH0pXSk7XG5cbiAgICB2YXIgZGltcyA9IHV0aWxzLmJveCgpXG4gICAgICAud2lkdGgodXRpbHMuaW5uZXJXaWR0aChjaGFydCkpXG4gICAgICAuaGVpZ2h0KHV0aWxzLmlubmVySGVpZ2h0KGNoYXJ0KSlcbiAgICAgIC5tYXJnaW4odGhpcy5tYXJnaW4oKSlcbiAgICAgIC5jYWxjKCk7XG5cbiAgICBjaGFydFxuICAgICAgLnN0eWxlKCd3aWR0aCcsIHV0aWxzLnB4KGRpbXMud2lkdGgpKVxuICAgICAgLnN0eWxlKCdoZWlnaHQnLCB1dGlscy5weChkaW1zLmhlaWdodCkpO1xuXG4gICAgZngucmFuZ2UoWzAsIGRpbXMuaW5uZXJXaWR0aF0pO1xuICAgIGZ5LnJhbmdlKFtkaW1zLmlubmVySGVpZ2h0LCAwXSk7XG5cbiAgICB2YXIgc3ZnID0gY2hhcnQuc2VsZWN0KCdzdmcnKVxuICAgICAgLmF0dHIoJ3dpZHRoJywgZGltcy53aWR0aClcbiAgICAgIC5hdHRyKCdoZWlnaHQnLCBkaW1zLmhlaWdodClcbiAgICAgIC5zZWxlY3QoJ2cnKVxuICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgdXRpbHMudHJhbnNsYXRlKFxuICAgICAgICAgIGRpbXMubWFyZ2luLmxlZnQsXG4gICAgICAgICAgZGltcy5tYXJnaW4udG9wKSk7XG5cbiAgICB2YXIgYmFyID0gc3ZnLnNlbGVjdCgnLmJhcnMnKVxuICAgICAgLnNlbGVjdEFsbCgnLmJhcicpXG4gICAgICAuZGF0YShmdW5jdGlvbihkKSB7IHJldHVybiBkOyB9LFxuICAgICAgICAgICAgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC54OyB9KTtcblxuICAgIGJhci5lbnRlcigpLmFwcGVuZCgnZycpXG4gICAgICAuYXR0cignY2xhc3MnLCAnYmFyJylcbiAgICAgIC5hcHBlbmQoJ3JlY3QnKTtcblxuICAgIGJhclxuICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuIHV0aWxzLnRyYW5zbGF0ZShmeChkLngpLCBmeShkLnkpKTtcbiAgICAgIH0pO1xuXG4gICAgYmFyLnNlbGVjdCgncmVjdCcpXG4gICAgICAuc3R5bGUoJ2ZpbGwnLCB0aGlzLmNvbG9ycygpKGVsLmRhdHVtKCkudGl0bGUpKVxuICAgICAgLmF0dHIoJ3dpZHRoJywgZnVuY3Rpb24oZCkge1xuICAgICAgICB2YXIgd2lkdGggPSBmeChkLnggKyBkLmR4KSAtIGZ4KGQueCk7XG4gICAgICAgIHdpZHRoIC09IHNlbGYuYmFyUGFkZGluZygpO1xuICAgICAgICByZXR1cm4gTWF0aC5tYXgod2lkdGgsIDEpO1xuICAgICAgfSlcbiAgICAgIC5hdHRyKCdoZWlnaHQnLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIHJldHVybiBkaW1zLmlubmVySGVpZ2h0IC0gZnkoZC55KTsgXG4gICAgICB9KTtcblxuICAgIGJhci5leGl0KClcbiAgICAgIC5yZW1vdmUoKTtcblxuICAgIHZhciBheGlzID0gZDMuc3ZnLmF4aXMoKVxuICAgICAgLnNjYWxlKGZ4KVxuICAgICAgLnRpY2tzKHRoaXMueFRpY2tzKCkpXG4gICAgICAudGlja0Zvcm1hdCh0aGlzLnhUaWNrRm9ybWF0KCkpO1xuXG4gICAgc3ZnLnNlbGVjdCgnLnguYXhpcycpXG4gICAgICAuYXR0cigndHJhbnNmb3JtJywgdXRpbHMudHJhbnNsYXRlKDAsIGRpbXMuaW5uZXJIZWlnaHQpKVxuICAgICAgLmNhbGwoYXhpcyk7XG5cbiAgICBheGlzID0gZDMuc3ZnLmF4aXMoKVxuICAgICAgLm9yaWVudCgnbGVmdCcpXG4gICAgICAuc2NhbGUoZnkpXG4gICAgICAudGlja1BhZGRpbmcoOClcbiAgICAgIC50aWNrU2l6ZSgtZGltcy5pbm5lcldpZHRoKVxuICAgICAgLnRpY2tzKHRoaXMueVRpY2tzKCkpXG4gICAgICAudGlja0Zvcm1hdCh0aGlzLnlUaWNrRm9ybWF0KCkpO1xuICAgIFxuICAgIHN2Zy5zZWxlY3QoJy55LmF4aXMnKVxuICAgICAgLmNhbGwoYXhpcyk7XG4gIH0pO1xuIiwiZXhwb3J0cy5waWUgPSByZXF1aXJlKCcuL3BpZScpO1xuZXhwb3J0cy5iYXJzID0gcmVxdWlyZSgnLi9iYXJzJyk7XG5leHBvcnRzLmxhc3QgPSByZXF1aXJlKCcuL2xhc3QnKTtcbmV4cG9ydHMubGluZXMgPSByZXF1aXJlKCcuL2xpbmVzJyk7XG5leHBvcnRzLndpZGdldCA9IHJlcXVpcmUoJy4vd2lkZ2V0Jyk7XG4iLCJ2YXIgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi93aWRnZXQnKS5leHRlbmQoKVxuICAucHJvcCgnd2lkdGgnKVxuICAuZGVmYXVsdCg0MDApXG5cbiAgLnByb3AoJ2NvbHNwYW4nKVxuICAuZGVmYXVsdCg0KVxuXG4gIC5wcm9wKCd0aXRsZScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50aXRsZTsgfSlcblxuICAucHJvcCgndmFsdWVzJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLnZhbHVlczsgfSlcblxuICAucHJvcCgneCcpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC54OyB9KVxuXG4gIC5wcm9wKCd5JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLnk7IH0pXG5cbiAgLnByb3AoJ3lGb3JtYXQnKVxuICAuZGVmYXVsdChkMy5mb3JtYXQoJywycycpKVxuXG4gIC5wcm9wKCdkaWZmRm9ybWF0JylcbiAgLmRlZmF1bHQoZDMuZm9ybWF0KCcrLDJzJykpXG5cbiAgLnByb3AoJ3hGb3JtYXQnKVxuICAuZGVmYXVsdChkMy50aW1lLmZvcm1hdCgnJS1kICViICUtSDolTScpKVxuXG4gIC5wcm9wKCdub25lJylcbiAgLmRlZmF1bHQoMClcblxuICAucHJvcCgnc3VtbWFyeUxpbWl0JylcbiAgLmRlZmF1bHQoMilcbiAgLnNldChmdW5jdGlvbih2KSB7IHJldHVybiBNYXRoLm1heCh1dGlscy5lbnN1cmUodiwgMiksIDIpOyB9KVxuXG4gIC5wcm9wKCdzcGFya2xpbmVMaW1pdCcpXG4gIC5kZWZhdWx0KDE1KVxuICAuc2V0KGZ1bmN0aW9uKHYpIHsgcmV0dXJuIE1hdGgubWF4KHV0aWxzLmVuc3VyZSh2LCAyKSwgMik7IH0pXG5cbiAgLnByb3AoJ3NwYXJrbGluZScpXG4gIC5wcm9wKCdzdW1tYXJ5JylcblxuICAuaW5pdChmdW5jdGlvbigpIHtcbiAgICB0aGlzLnNwYXJrbGluZShzcGFya2xpbmUodGhpcykpO1xuICAgIHRoaXMuc3VtbWFyeShzdW1tYXJ5KHRoaXMpKTtcbiAgfSlcblxuICAuZW50ZXIoZnVuY3Rpb24oZWwpIHtcbiAgICBlbC5hdHRyKCdjbGFzcycsICdsYXN0IHdpZGdldCcpO1xuXG4gICAgZWwuYXBwZW5kKCdkaXYnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3RpdGxlJyk7XG5cbiAgICB2YXIgdmFsdWVzID0gZWwuYXBwZW5kKCdkaXYnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3ZhbHVlcycpO1xuXG4gICAgdmFsdWVzLmFwcGVuZCgnZGl2JylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdsYXN0IHZhbHVlJyk7XG5cbiAgICB2YWx1ZXMuYXBwZW5kKCdkaXYnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3NwYXJrbGluZScpO1xuXG4gICAgdmFsdWVzLmFwcGVuZCgnZGl2JylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdzdW1tYXJ5Jyk7XG4gIH0pXG5cbiAgLmRyYXcoZnVuY3Rpb24oZWwpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIG5vZGUgPSBlbC5ub2RlKCk7XG5cbiAgICBlbC5zdHlsZSgnd2lkdGgnLCB1dGlscy5weCh0aGlzLndpZHRoKCkpKTtcblxuICAgIGVsLnNlbGVjdCgnLnRpdGxlJylcbiAgICAgIC50ZXh0KGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgICAgcmV0dXJuIHNlbGYudGl0bGUoKS5jYWxsKG5vZGUsIGQsIGkpO1xuICAgICAgfSk7XG5cbiAgICB2YXIgdmFsdWVzID0gZWwuc2VsZWN0KCcudmFsdWVzJylcbiAgICAgIC5kYXR1bShmdW5jdGlvbihkLCBpKSB7XG4gICAgICAgIHJldHVybiBzZWxmLnZhbHVlcygpXG4gICAgICAgICAgLmNhbGwobm9kZSwgZCwgaSlcbiAgICAgICAgICAubWFwKGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIHg6IHNlbGYueCgpLmNhbGwobm9kZSwgZCwgaSksXG4gICAgICAgICAgICAgIHk6IHNlbGYueSgpLmNhbGwobm9kZSwgZCwgaSlcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfSk7XG4gICAgICB9KVxuICAgICAgLmF0dHIoJ2NsYXNzJywgZnVuY3Rpb24oZCkge1xuICAgICAgICBkID0gZC5zbGljZSgtMik7XG5cbiAgICAgICAgZCA9IGQubGVuZ3RoID4gMVxuICAgICAgICAgID8gZFsxXS55IC0gZFswXS55XG4gICAgICAgICAgOiAwO1xuXG4gICAgICAgIGlmIChkID4gMCkgeyByZXR1cm4gJ2dvb2QgdmFsdWVzJzsgfVxuICAgICAgICBpZiAoZCA8IDApIHsgcmV0dXJuICdiYWQgdmFsdWVzJzsgfVxuICAgICAgICByZXR1cm4gJ25ldXRyYWwgdmFsdWVzJztcbiAgICAgIH0pO1xuXG4gICAgdmFsdWVzLnNlbGVjdCgnLmxhc3QudmFsdWUnKVxuICAgICAgLmRhdHVtKGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgICAgZCA9IGRbZC5sZW5ndGggLSAxXTtcblxuICAgICAgICByZXR1cm4gIWRcbiAgICAgICAgICA/IHNlbGYubm9uZSgpXG4gICAgICAgICAgOiBkLnk7XG4gICAgICB9KVxuICAgICAgLnRleHQodGhpcy55Rm9ybWF0KCkpO1xuXG4gICAgdmFsdWVzLnNlbGVjdCgnLnNwYXJrbGluZScpXG4gICAgICAuY2FsbCh0aGlzLnNwYXJrbGluZSgpKTtcblxuICAgIHZhbHVlcy5zZWxlY3QoJy5zdW1tYXJ5JylcbiAgICAgIC5jYWxsKHRoaXMuc3VtbWFyeSgpKTtcbiAgfSk7XG5cblxudmFyIHN1bW1hcnkgPSByZXF1aXJlKCcuLi92aWV3JykuZXh0ZW5kKClcbiAgLnByb3AoJ3dpZGdldCcpXG5cbiAgLmluaXQoZnVuY3Rpb24od2lkZ2V0KSB7XG4gICAgdGhpcy53aWRnZXQod2lkZ2V0KTtcbiAgfSlcblxuICAuZW50ZXIoZnVuY3Rpb24oZWwpIHtcbiAgICBlbC5hcHBlbmQoJ3NwYW4nKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ2RpZmYnKTtcblxuICAgIGVsLmFwcGVuZCgnc3BhbicpXG4gICAgICAuYXR0cignY2xhc3MnLCAndGltZScpO1xuICB9KVxuXG4gIC5kcmF3KGZ1bmN0aW9uKGVsKSB7XG4gICAgdmFyIHdpZGdldCA9IHRoaXMud2lkZ2V0KCk7XG5cbiAgICBpZiAoZWwuZGF0dW0oKS5sZW5ndGggPCB0aGlzLndpZGdldCgpLnN1bW1hcnlMaW1pdCgpKSB7XG4gICAgICBlbC5zdHlsZSgnaGVpZ2h0JywgMCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZWwuc2VsZWN0KCcuZGlmZicpXG4gICAgICAuZGF0dW0oZnVuY3Rpb24oZCkge1xuICAgICAgICBkID0gZC5zbGljZSgtMik7XG4gICAgICAgIHJldHVybiBkWzFdLnkgLSBkWzBdLnk7XG4gICAgICB9KVxuICAgICAgLnRleHQod2lkZ2V0LmRpZmZGb3JtYXQoKSk7XG5cbiAgICBlbC5zZWxlY3QoJy50aW1lJylcbiAgICAgIC5kYXR1bShmdW5jdGlvbihkKSB7XG4gICAgICAgIGQgPSBkLnNsaWNlKC0yKTtcblxuICAgICAgICByZXR1cm4gW2RbMF0ueCwgZFsxXS54XVxuICAgICAgICAgIC5tYXAodXRpbHMuZGF0ZSlcbiAgICAgICAgICAubWFwKHdpZGdldC54Rm9ybWF0KCkpO1xuICAgICAgfSlcbiAgICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuIFsnIGZyb20nLCBkWzBdLCAndG8nLCBkWzFdXS5qb2luKCcgJyk7XG4gICAgICB9KTtcbiAgfSk7XG5cblxudmFyIHNwYXJrbGluZSA9IHJlcXVpcmUoJy4uL3ZpZXcnKS5leHRlbmQoKVxuICAucHJvcCgnd2lkZ2V0JylcblxuICAucHJvcCgnaGVpZ2h0JylcbiAgLmRlZmF1bHQoMjUpXG5cbiAgLnByb3AoJ21hcmdpbicpXG4gIC5kZWZhdWx0KHtcbiAgICB0b3A6IDQsXG4gICAgbGVmdDogNCxcbiAgICBib3R0b206IDQsXG4gICAgcmlnaHQ6IDQgXG4gIH0pXG5cbiAgLmluaXQoZnVuY3Rpb24od2lkZ2V0KSB7XG4gICAgdGhpcy53aWRnZXQod2lkZ2V0KTtcbiAgfSlcblxuICAuZW50ZXIoZnVuY3Rpb24oZWwpIHtcbiAgICB2YXIgc3ZnID0gZWwuYXBwZW5kKCdzdmcnKVxuICAgICAgLmFwcGVuZCgnZycpO1xuXG4gICAgc3ZnLmFwcGVuZCgncGF0aCcpXG4gICAgICAuYXR0cignY2xhc3MnLCAncmVzdCBwYXRoJyk7XG5cbiAgICBzdmcuYXBwZW5kKCdwYXRoJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdkaWZmIHBhdGgnKTtcbiAgfSlcblxuICAuZHJhdyhmdW5jdGlvbihlbCkge1xuICAgIGlmIChlbC5kYXR1bSgpLmxlbmd0aCA8IHRoaXMud2lkZ2V0KCkuc3BhcmtsaW5lTGltaXQoKSkge1xuICAgICAgZWwuc3R5bGUoJ2hlaWdodCcsIDApO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBkaW1zID0gdXRpbHMuYm94KClcbiAgICAgIC5tYXJnaW4odGhpcy5tYXJnaW4oKSlcbiAgICAgIC53aWR0aCh1dGlscy5pbm5lcldpZHRoKGVsKSlcbiAgICAgIC5oZWlnaHQodGhpcy5oZWlnaHQoKSlcbiAgICAgIC5jYWxjKCk7XG5cbiAgICB2YXIgZnggPSBkMy5zY2FsZS5saW5lYXIoKVxuICAgICAgLmRvbWFpbihkMy5leHRlbnQoZWwuZGF0dW0oKSwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC54OyB9KSlcbiAgICAgIC5yYW5nZShbMCwgZGltcy5pbm5lcldpZHRoXSk7XG5cbiAgICB2YXIgZnkgPSBkMy5zY2FsZS5saW5lYXIoKVxuICAgICAgLmRvbWFpbihkMy5leHRlbnQoZWwuZGF0dW0oKSwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC55OyB9KSlcbiAgICAgIC5yYW5nZShbZGltcy5pbm5lckhlaWdodCwgMF0pO1xuXG4gICAgdmFyIGxpbmUgPSBkMy5zdmcubGluZSgpXG4gICAgICAueChmdW5jdGlvbihkKSB7IHJldHVybiBmeChkLngpOyB9KVxuICAgICAgLnkoZnVuY3Rpb24oZCkgeyByZXR1cm4gZnkoZC55KTsgfSk7XG5cbiAgICB2YXIgc3ZnID0gZWwuc2VsZWN0KCdzdmcnKVxuICAgICAgLmF0dHIoJ3dpZHRoJywgZGltcy53aWR0aClcbiAgICAgIC5hdHRyKCdoZWlnaHQnLCBkaW1zLmhlaWdodClcbiAgICAgIC5zZWxlY3QoJ2cnKVxuICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgdXRpbHMudHJhbnNsYXRlKGRpbXMubWFyZ2luLmxlZnQsIGRpbXMubWFyZ2luLnRvcCkpO1xuXG4gICAgc3ZnLnNlbGVjdCgnLnJlc3QucGF0aCcpXG4gICAgICAuYXR0cignZCcsIGxpbmUpO1xuXG4gICAgc3ZnLnNlbGVjdCgnLmRpZmYucGF0aCcpXG4gICAgICAuZGF0dW0oZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5zbGljZSgtMik7IH0pXG4gICAgICAuYXR0cignZCcsIGxpbmUpO1xuXG4gICAgdmFyIGRvdCA9IHN2Zy5zZWxlY3RBbGwoJy5kb3QnKVxuICAgICAgLmRhdGEoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5zbGljZSgtMSk7IH0pO1xuXG4gICAgZG90LmVudGVyKCkuYXBwZW5kKCdjaXJjbGUnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ2RvdCcpXG4gICAgICAuYXR0cigncicsIDQpO1xuXG4gICAgZG90XG4gICAgICAuYXR0cignY3gnLCBmdW5jdGlvbihkKSB7IHJldHVybiBmeChkLngpOyB9KVxuICAgICAgLmF0dHIoJ2N5JywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZnkoZC55KTsgfSk7XG5cbiAgICBkb3QuZXhpdCgpLnJlbW92ZSgpO1xuICB9KTtcbiIsInZhciB1dGlscyA9IHJlcXVpcmUoJy4uL3V0aWxzJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL3dpZGdldCcpLmV4dGVuZCgpXG4gIC5wcm9wKCd3aWR0aCcpXG4gIC5kZWZhdWx0KDQwMClcblxuICAucHJvcCgnY29sc3BhbicpXG4gIC5kZWZhdWx0KDQpXG5cbiAgLnByb3AoJ3RpdGxlJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLnRpdGxlOyB9KVxuXG4gIC5wcm9wKCdtZXRyaWNzJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLm1ldHJpY3M7IH0pXG5cbiAgLnByb3AoJ2tleScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gaTsgfSlcblxuICAucHJvcCgnbWV0cmljVGl0bGUnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGl0bGU7IH0pXG5cbiAgLnByb3AoJ3ZhbHVlcycpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC52YWx1ZXM7IH0pXG5cbiAgLnByb3AoJ3gnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueDsgfSlcblxuICAucHJvcCgneScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC55OyB9KVxuXG4gIC5wcm9wKCd4VGlja0Zvcm1hdCcpXG4gIC5kZWZhdWx0KG51bGwpXG5cbiAgLnByb3AoJ3hUaWNrcycpXG4gIC5kZWZhdWx0KDgpXG5cbiAgLnByb3AoJ3lGb3JtYXQnKVxuICAuZGVmYXVsdChkMy5mb3JtYXQoJywycycpKVxuXG4gIC5wcm9wKCd5VGlja3MnKVxuICAuZGVmYXVsdCg1KVxuXG4gIC5wcm9wKCd5VGlja0Zvcm1hdCcpXG4gIC5kZWZhdWx0KGQzLmZvcm1hdCgnLjJzJykpXG5cbiAgLnByb3AoJ25vbmUnKVxuICAuZGVmYXVsdCgwKVxuXG4gIC5wcm9wKCdjb2xvcnMnKVxuICAucHJvcCgnY2hhcnQnKVxuICAucHJvcCgnbGVnZW5kJylcblxuICAuaW5pdChmdW5jdGlvbigpIHtcbiAgICB0aGlzLmNoYXJ0KGNoYXJ0KHRoaXMpKTtcbiAgICB0aGlzLmxlZ2VuZChsZWdlbmQodGhpcykpO1xuICAgIHRoaXMuY29sb3JzKGQzLnNjYWxlLmNhdGVnb3J5MTAoKSk7XG4gIH0pXG5cbiAgLmVudGVyKGZ1bmN0aW9uKGVsKSB7XG4gICAgZWwuYXR0cignY2xhc3MnLCAnbGluZXMgd2lkZ2V0Jyk7XG5cbiAgICBlbC5hcHBlbmQoJ2RpdicpXG4gICAgICAuYXR0cignY2xhc3MnLCAndGl0bGUnKTtcblxuICAgIHZhciB2YWx1ZXMgPSBlbC5hcHBlbmQoJ2RpdicpXG4gICAgICAuYXR0cignY2xhc3MnLCAndmFsdWVzJyk7XG5cbiAgICB2YWx1ZXMuYXBwZW5kKCdkaXYnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ2NoYXJ0Jyk7XG5cbiAgICB2YWx1ZXMuYXBwZW5kKCdkaXYnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ2xlZ2VuZCcpO1xuICB9KVxuXG4gIC5tZXRoKCdub3JtYWxpemUnLCBmdW5jdGlvbihlbCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgbm9kZSA9IGVsLm5vZGUoKTtcblxuICAgIGVsLmRhdHVtKGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgIHZhciB0aXRsZSA9IHNlbGYudGl0bGUoKS5jYWxsKG5vZGUsIGQsIGkpO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICB0aXRsZTogdGl0bGUsXG4gICAgICAgIG1ldHJpY3M6IHNlbGYubWV0cmljcygpXG4gICAgICAgICAgLmNhbGwobm9kZSwgZCwgaSlcbiAgICAgICAgICAubWFwKG1ldHJpYylcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiBtZXRyaWMoZCwgaSkge1xuICAgICAgdmFyIGtleSA9IHNlbGYua2V5KClcbiAgICAgICAgLmNhbGwobm9kZSwgZCwgaSlcbiAgICAgICAgLnRvU3RyaW5nKCk7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGtleToga2V5LFxuICAgICAgICBjb2xvcjogc2VsZi5jb2xvcnMoKShrZXkpLFxuICAgICAgICB0aXRsZTogc2VsZi5tZXRyaWNUaXRsZSgpLmNhbGwobm9kZSwgZCwgaSksXG4gICAgICAgIHZhbHVlczogc2VsZi52YWx1ZXMoKVxuICAgICAgICAgIC5jYWxsKG5vZGUsIGQsIGkpXG4gICAgICAgICAgLm1hcCh2YWx1ZSlcbiAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdmFsdWUoZCwgaSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgeDogc2VsZi54KCkuY2FsbChub2RlLCBkLCBpKSxcbiAgICAgICAgeTogc2VsZi55KCkuY2FsbChub2RlLCBkLCBpKVxuICAgICAgfTtcbiAgICB9XG4gIH0pXG5cbiAgLmRyYXcoZnVuY3Rpb24oZWwpIHtcbiAgICB0aGlzLm5vcm1hbGl6ZShlbCk7XG5cbiAgICBlbC5zdHlsZSgnd2lkdGgnLCB1dGlscy5weCh0aGlzLndpZHRoKCkpKTtcblxuICAgIGVsLnNlbGVjdCgnLndpZGdldCAudGl0bGUnKVxuICAgICAgLnRleHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50aXRsZTsgfSk7XG5cbiAgICB2YXIgdmFsdWVzID0gZWwuc2VsZWN0KCcudmFsdWVzJylcbiAgICAgIC5kYXR1bShmdW5jdGlvbihkLCBpKSB7IHJldHVybiBkLm1ldHJpY3M7IH0pO1xuXG4gICAgdmFsdWVzLnNlbGVjdCgnLmNoYXJ0JylcbiAgICAgIC5jYWxsKHRoaXMuY2hhcnQoKSk7XG5cbiAgICB2YWx1ZXMuc2VsZWN0KCcubGVnZW5kJylcbiAgICAgIC5jYWxsKHRoaXMubGVnZW5kKCkpO1xuICB9KTtcblxuXG52YXIgY2hhcnQgPSByZXF1aXJlKCcuLi92aWV3JykuZXh0ZW5kKClcbiAgLnByb3AoJ2hlaWdodCcpXG4gIC5kZWZhdWx0KDE1MClcblxuICAucHJvcCgnbWFyZ2luJylcbiAgLmRlZmF1bHQoe1xuICAgIHRvcDogMTAsXG4gICAgbGVmdDogMzUsXG4gICAgcmlnaHQ6IDE1LFxuICAgIGJvdHRvbTogMjBcbiAgfSlcblxuICAucHJvcCgnd2lkZ2V0JylcblxuICAuaW5pdChmdW5jdGlvbih3aWRnZXQpIHtcbiAgICB0aGlzLndpZGdldCh3aWRnZXQpO1xuICB9KVxuXG4gIC5lbnRlcihmdW5jdGlvbihlbCkge1xuICAgIHZhciBzdmcgPSBlbC5hcHBlbmQoJ3N2ZycpXG4gICAgICAuYXBwZW5kKCdnJyk7XG5cbiAgICBzdmcuYXBwZW5kKCdnJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd4IGF4aXMnKTtcblxuICAgIHN2Zy5hcHBlbmQoJ2cnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3kgYXhpcycpO1xuXG4gICAgc3ZnLmFwcGVuZCgnZycpXG4gICAgICAuYXR0cignY2xhc3MnLCAnbGluZXMnKTtcbiAgfSlcblxuICAuZHJhdyhmdW5jdGlvbihlbCkge1xuICAgIHZhciBkaW1zID0gdXRpbHMuYm94KClcbiAgICAgIC5tYXJnaW4odGhpcy5tYXJnaW4oKSlcbiAgICAgIC53aWR0aCh1dGlscy5pbm5lcldpZHRoKGVsKSlcbiAgICAgIC5oZWlnaHQodGhpcy5oZWlnaHQoKSlcbiAgICAgIC5jYWxjKCk7XG5cbiAgICB2YXIgYWxsVmFsdWVzID0gZWxcbiAgICAgIC5kYXR1bSgpXG4gICAgICAucmVkdWNlKGZ1bmN0aW9uKHJlc3VsdHMsIG1ldHJpYykge1xuICAgICAgICByZXN1bHRzLnB1c2guYXBwbHkocmVzdWx0cywgbWV0cmljLnZhbHVlcyk7XG4gICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgICAgfSwgW10pO1xuXG4gICAgdmFyIGZ4ID0gZDMudGltZS5zY2FsZSgpXG4gICAgICAuZG9tYWluKGQzLmV4dGVudChhbGxWYWx1ZXMsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueDsgfSkpXG4gICAgICAucmFuZ2UoWzAsIGRpbXMuaW5uZXJXaWR0aF0pO1xuXG4gICAgdmFyIGZ5ID0gZDMuc2NhbGUubGluZWFyKClcbiAgICAgIC5kb21haW4oZDMuZXh0ZW50KGFsbFZhbHVlcywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC55OyB9KSlcbiAgICAgIC5yYW5nZShbZGltcy5pbm5lckhlaWdodCwgMF0pO1xuXG4gICAgdmFyIGxpbmUgPSBkMy5zdmcubGluZSgpXG4gICAgICAueChmdW5jdGlvbihkKSB7IHJldHVybiBmeChkLngpOyB9KVxuICAgICAgLnkoZnVuY3Rpb24oZCkgeyByZXR1cm4gZnkoZC55KTsgfSk7XG5cbiAgICB2YXIgc3ZnID0gZWwuc2VsZWN0KCdzdmcnKVxuICAgICAgLmF0dHIoJ3dpZHRoJywgZGltcy53aWR0aClcbiAgICAgIC5hdHRyKCdoZWlnaHQnLCBkaW1zLmhlaWdodClcbiAgICAgIC5zZWxlY3QoJ2cnKVxuICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgdXRpbHMudHJhbnNsYXRlKGRpbXMubWFyZ2luLmxlZnQsIGRpbXMubWFyZ2luLnRvcCkpO1xuXG4gICAgdmFyIG1ldHJpYyA9IHN2Zy5zZWxlY3QoJy5saW5lcycpLnNlbGVjdEFsbCgnLm1ldHJpYycpXG4gICAgICAuZGF0YShmdW5jdGlvbihkKSB7IHJldHVybiBkOyB9LFxuICAgICAgICAgICAgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5rZXk7IH0pO1xuXG4gICAgbWV0cmljLmVudGVyKCkuYXBwZW5kKCdnJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdtZXRyaWMnKVxuICAgICAgLmF0dHIoJ2RhdGEta2V5JywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5rZXk7IH0pXG4gICAgICAuYXBwZW5kKCdwYXRoJylcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2xpbmUnKTtcblxuICAgIG1ldHJpYy5zZWxlY3QoJy5saW5lJylcbiAgICAgIC5hdHRyKCdzdHJva2UnLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLmNvbG9yOyB9KVxuICAgICAgLmF0dHIoJ2QnLCBmdW5jdGlvbihkKSB7IHJldHVybiBsaW5lKGQudmFsdWVzKTsgfSk7XG5cbiAgICB2YXIgZG90ID0gbWV0cmljLnNlbGVjdEFsbCgnLmRvdCcpXG4gICAgICAuZGF0YShmdW5jdGlvbihkKSB7XG4gICAgICAgIGlmICghZC52YWx1ZXMubGVuZ3RoKSB7IHJldHVybiBbXTsgfVxuICAgICAgICB2YXIgbGFzdCA9IGQudmFsdWVzW2QudmFsdWVzLmxlbmd0aCAtIDFdO1xuXG4gICAgICAgIHJldHVybiBbe1xuICAgICAgICAgIHg6IGxhc3QueCxcbiAgICAgICAgICB5OiBsYXN0LnksXG4gICAgICAgICAgY29sb3I6IGQuY29sb3JcbiAgICAgICAgfV07XG4gICAgICB9KTtcblxuICAgIGRvdC5lbnRlcigpLmFwcGVuZCgnY2lyY2xlJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdkb3QnKVxuICAgICAgLmF0dHIoJ3InLCA0KTtcblxuICAgIGRvdFxuICAgICAgLmF0dHIoJ2ZpbGwnLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLmNvbG9yOyB9KVxuICAgICAgLmF0dHIoJ2N4JywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZngoZC54KTsgfSlcbiAgICAgIC5hdHRyKCdjeScsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGZ5KGQueSk7IH0pO1xuXG4gICAgZG90LmV4aXQoKVxuICAgICAgLnJlbW92ZSgpO1xuXG4gICAgbWV0cmljLmV4aXQoKVxuICAgICAgLnJlbW92ZSgpO1xuXG4gICAgdmFyIGF4aXMgPSBkMy5zdmcuYXhpcygpXG4gICAgICAuc2NhbGUoZngpXG4gICAgICAudGlja1BhZGRpbmcoOClcbiAgICAgIC50aWNrcyh0aGlzLndpZGdldCgpLnhUaWNrcygpKVxuICAgICAgLnRpY2tGb3JtYXQodGhpcy53aWRnZXQoKS54VGlja0Zvcm1hdCgpKVxuICAgICAgLnRpY2tTaXplKC1kaW1zLmlubmVySGVpZ2h0KTtcblxuICAgIHN2Zy5zZWxlY3QoJy54LmF4aXMnKVxuICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIHV0aWxzLnRyYW5zbGF0ZSgwLCBkaW1zLmlubmVySGVpZ2h0KSlcbiAgICAgIC5jYWxsKGF4aXMpO1xuXG4gICAgYXhpcyA9IGQzLnN2Zy5heGlzKClcbiAgICAgIC5vcmllbnQoJ2xlZnQnKVxuICAgICAgLnNjYWxlKGZ5KVxuICAgICAgLnRpY2tQYWRkaW5nKDgpXG4gICAgICAudGlja3ModGhpcy53aWRnZXQoKS55VGlja3MoKSlcbiAgICAgIC50aWNrRm9ybWF0KHRoaXMud2lkZ2V0KCkueVRpY2tGb3JtYXQoKSlcbiAgICAgIC50aWNrU2l6ZSgtZGltcy5pbm5lcldpZHRoKTtcbiAgICBcbiAgICBzdmcuc2VsZWN0KCcueS5heGlzJylcbiAgICAgIC5jYWxsKGF4aXMpO1xuICB9KTtcblxuXG52YXIgbGVnZW5kID0gcmVxdWlyZSgnLi4vdmlldycpLmV4dGVuZCgpXG4gIC5wcm9wKCd3aWRnZXQnKVxuXG4gIC5pbml0KGZ1bmN0aW9uKHdpZGdldCkge1xuICAgIHRoaXMud2lkZ2V0KHdpZGdldCk7XG4gIH0pXG5cbiAgLmVudGVyKGZ1bmN0aW9uKGVsKSB7XG4gICAgZWwuYXBwZW5kKCd0YWJsZScpXG4gICAgICAuYXR0cignY2xhc3MnLCAndGFibGUnKTtcbiAgfSlcblxuICAuZHJhdyhmdW5jdGlvbihlbCkge1xuICAgIHZhciBub25lID0gdGhpcy53aWRnZXQoKS5ub25lKCk7XG4gICAgdmFyIHlGb3JtYXQgPSB0aGlzLndpZGdldCgpLnlGb3JtYXQoKTtcblxuICAgIHZhciBtZXRyaWMgPSBlbC5zZWxlY3QoJy50YWJsZScpLnNlbGVjdEFsbCgnLm1ldHJpYycpXG4gICAgICAuZGF0YShmdW5jdGlvbihkKSB7IHJldHVybiBkOyB9LFxuICAgICAgICAgICAgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5rZXk7IH0pO1xuXG4gICAgdmFyIGVudGVyTWV0cmljID0gbWV0cmljLmVudGVyKCkuYXBwZW5kKCd0cicpXG4gICAgICAuYXR0cignZGF0YS1rZXknLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLmtleTsgfSlcbiAgICAgIC5hdHRyKCdjbGFzcycsICdtZXRyaWMnKTtcblxuICAgIGVudGVyTWV0cmljLmFwcGVuZCgndGQnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3N3YXRjaCcpO1xuXG4gICAgZW50ZXJNZXRyaWMuYXBwZW5kKCd0ZCcpXG4gICAgICAuYXR0cignY2xhc3MnLCAndGl0bGUnKTtcblxuICAgIGVudGVyTWV0cmljLmFwcGVuZCgndGQnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3ZhbHVlJyk7XG5cbiAgICBtZXRyaWMuc2VsZWN0KCcuc3dhdGNoJylcbiAgICAgIC5zdHlsZSgnYmFja2dyb3VuZCcsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuY29sb3I7IH0pO1xuXG4gICAgbWV0cmljLnNlbGVjdCgnLnRpdGxlJylcbiAgICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGl0bGU7IH0pO1xuXG4gICAgbWV0cmljLnNlbGVjdCgnLnZhbHVlJylcbiAgICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgZCA9IGQudmFsdWVzW2QudmFsdWVzLmxlbmd0aCAtIDFdO1xuXG4gICAgICAgIHJldHVybiBkXG4gICAgICAgICAgPyB5Rm9ybWF0KGQueSlcbiAgICAgICAgICA6IHlGb3JtYXQobm9uZSk7XG4gICAgICB9KTtcblxuICAgIG1ldHJpYy5leGl0KClcbiAgICAgIC5yZW1vdmUoKTtcbiAgfSk7XG4iLCJ2YXIgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi93aWRnZXQnKS5leHRlbmQoKVxuICAucHJvcCgnd2lkdGgnKVxuICAuZGVmYXVsdCg0MDApXG5cbiAgLnByb3AoJ2NvbHNwYW4nKVxuICAuZGVmYXVsdCg0KVxuXG4gIC5wcm9wKCdjb2xvcnMnKVxuXG4gIC5wcm9wKCd0aXRsZScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50aXRsZTsgfSlcblxuICAucHJvcCgnbWV0cmljcycpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5tZXRyaWNzOyB9KVxuXG4gIC5wcm9wKCdrZXknKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIGk7IH0pXG5cbiAgLnByb3AoJ21ldHJpY1RpdGxlJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLnRpdGxlOyB9KVxuXG4gIC5wcm9wKCd2YWx1ZScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC52YWx1ZTsgfSlcblxuICAucHJvcCgnbWFyZ2luJylcbiAgLmRlZmF1bHQoe1xuICAgIHRvcDogMjAsXG4gICAgbGVmdDogMjAsXG4gICAgcmlnaHQ6IDIwLFxuICAgIGJvdHRvbTogMjBcbiAgfSlcblxuICAucHJvcCgnaW5uZXJSYWRpdXMnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKHIpIHsgcmV0dXJuIDAuMzUgKiByOyB9KVxuXG4gIC5wcm9wKCd2YWx1ZUZvcm1hdCcpXG4gIC5kZWZhdWx0KGQzLmZvcm1hdCgnLDJzJykpXG5cbiAgLnByb3AoJ3BlcmNlbnRGb3JtYXQnKVxuICAuZGVmYXVsdChkMy5mb3JtYXQoJy4wJScpKVxuXG4gIC5pbml0KGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuY29sb3JzKGQzLnNjYWxlLmNhdGVnb3J5MTAoKSk7XG4gIH0pXG5cbiAgLm1ldGgoJ25vcm1hbGl6ZScsIGZ1bmN0aW9uKGVsKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBub2RlID0gZWwubm9kZSgpO1xuXG4gICAgZWwuZGF0dW0oZnVuY3Rpb24oZCwgaSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdGl0bGU6IHNlbGYudGl0bGUoKS5jYWxsKG5vZGUsIGQsIGkpLFxuICAgICAgICBtZXRyaWNzOiBzZWxmLm1ldHJpY3MoKVxuICAgICAgICAgIC5jYWxsKG5vZGUsIGQsIGkpXG4gICAgICAgICAgLm1hcChtZXRyaWMpXG4gICAgICB9O1xuICAgIH0pO1xuXG4gICAgZnVuY3Rpb24gbWV0cmljKGQsIGkpIHtcbiAgICAgIHZhciBrZXkgPSBzZWxmLmtleSgpXG4gICAgICAgIC5jYWxsKG5vZGUsIGQsIGkpXG4gICAgICAgIC50b1N0cmluZygpO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgY29sb3I6IHNlbGYuY29sb3JzKCkoa2V5KSxcbiAgICAgICAgdGl0bGU6IHNlbGYubWV0cmljVGl0bGUoKS5jYWxsKG5vZGUsIGQsIGkpLFxuICAgICAgICB2YWx1ZTogc2VsZi52YWx1ZSgpLmNhbGwobm9kZSwgZCwgaSlcbiAgICAgIH07XG4gICAgfVxuXG4gICAgdmFyIHN1bSA9IGQzLnN1bShlbC5kYXR1bSgpLm1ldHJpY3MsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudmFsdWU7IH0pO1xuICAgIGVsLmRhdHVtKCkubWV0cmljcy5mb3JFYWNoKGZ1bmN0aW9uKGQpIHsgZC5wZXJjZW50ID0gZC52YWx1ZSAvIHN1bTsgfSk7XG4gIH0pXG5cbiAgLmVudGVyKGZ1bmN0aW9uKGVsKSB7XG4gICAgZWwuYXR0cignY2xhc3MnLCAncGllIHdpZGdldCcpO1xuXG4gICAgZWwuYXBwZW5kKCdkaXYnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3RpdGxlJyk7XG5cbiAgICBlbC5hcHBlbmQoJ2RpdicpXG4gICAgICAuYXR0cignY2xhc3MnLCAnY2hhcnQnKTtcblxuICAgIGVsLmFwcGVuZCgnZGl2JylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdsZWdlbmQnKTtcbiAgfSlcblxuICAuZHJhdyhmdW5jdGlvbihlbCkge1xuICAgIHRoaXMubm9ybWFsaXplKGVsKTtcblxuICAgIGVsLnN0eWxlKCd3aWR0aCcsIHV0aWxzLnB4KHRoaXMud2lkdGgoKSkpO1xuXG4gICAgZWwuc2VsZWN0KCcud2lkZ2V0IC50aXRsZScpXG4gICAgICAudGV4dChmdW5jdGlvbihkKSB7IHJldHVybiBkLnRpdGxlOyB9KTtcblxuICAgIGVsLnNlbGVjdCgnLmxlZ2VuZCcpXG4gICAgICAuY2FsbChsZWdlbmQodGhpcykpO1xuXG4gICAgZWwuc2VsZWN0KCcuY2hhcnQnKVxuICAgICAgLmNhbGwoY2hhcnQodGhpcykpO1xuICB9KTtcblxuXG52YXIgY2hhcnQgPSByZXF1aXJlKCcuLi92aWV3JykuZXh0ZW5kKClcbiAgLnByb3AoJ3dpZGdldCcpXG5cbiAgLmluaXQoZnVuY3Rpb24od2lkZ2V0KSB7XG4gICAgdGhpcy53aWRnZXQod2lkZ2V0KTtcbiAgfSlcblxuICAuZW50ZXIoZnVuY3Rpb24oZWwpIHtcbiAgICBlbC5hcHBlbmQoJ3N2ZycpXG4gICAgICAuYXBwZW5kKCdnJyk7XG4gIH0pXG5cbiAgLmRyYXcoZnVuY3Rpb24oZWwpIHtcbiAgICB2YXIgd2lkdGggPSB1dGlscy5pbm5lcldpZHRoKGVsKTtcblxuICAgIHZhciBkaW1zID0gdXRpbHMuYm94KClcbiAgICAgIC5tYXJnaW4odGhpcy53aWRnZXQoKS5tYXJnaW4oKSlcbiAgICAgIC53aWR0aCh3aWR0aClcbiAgICAgIC5oZWlnaHQod2lkdGgpXG4gICAgICAuY2FsYygpO1xuXG4gICAgdmFyIHJhZGl1cyA9IE1hdGgubWluKGRpbXMuaW5uZXJXaWR0aCwgZGltcy5pbm5lckhlaWdodCkgLyAyO1xuXG4gICAgdmFyIHN2ZyA9IGVsLnNlbGVjdCgnc3ZnJylcbiAgICAgIC5hdHRyKCd3aWR0aCcsIGRpbXMud2lkdGgpXG4gICAgICAuYXR0cignaGVpZ2h0JywgZGltcy5oZWlnaHQpXG4gICAgICAuc2VsZWN0KCdnJylcbiAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIHV0aWxzLnRyYW5zbGF0ZShcbiAgICAgICAgICAoZGltcy53aWR0aCAvIDIpIC0gcmFkaXVzLFxuICAgICAgICAgIChkaW1zLmhlaWdodCAvIDIpIC0gcmFkaXVzKSk7XG5cbiAgICB2YXIgYXJjID0gZDMuc3ZnLmFyYygpXG4gICAgICAuaW5uZXJSYWRpdXModGhpcy53aWRnZXQoKS5pbm5lclJhZGl1cygpKHJhZGl1cykpXG4gICAgICAub3V0ZXJSYWRpdXMocmFkaXVzKTtcblxuICAgIHZhciBsYXlvdXQgPSBkMy5sYXlvdXQucGllKClcbiAgICAgIC52YWx1ZShmdW5jdGlvbihkKSB7IHJldHVybiBkLnZhbHVlOyB9KTtcblxuICAgIHZhciBzbGljZSA9IHN2Zy5zZWxlY3RBbGwoJy5zbGljZScpXG4gICAgICAuZGF0YShmdW5jdGlvbihkKSB7IHJldHVybiBsYXlvdXQoZC5tZXRyaWNzKTsgfSxcbiAgICAgICAgICAgIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuZGF0YS5rZXk7IH0pO1xuXG4gICAgc2xpY2UuZW50ZXIoKS5hcHBlbmQoJ2cnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3NsaWNlJylcbiAgICAgIC5hcHBlbmQoJ3BhdGgnKTtcblxuICAgIHNsaWNlXG4gICAgICAuYXR0cigndHJhbnNmb3JtJywgdXRpbHMudHJhbnNsYXRlKHJhZGl1cywgcmFkaXVzKSk7XG5cbiAgICBzbGljZS5zZWxlY3QoJ3BhdGgnKVxuICAgICAgLmF0dHIoJ2QnLCBhcmMpXG4gICAgICAuc3R5bGUoJ2ZpbGwnLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLmRhdGEuY29sb3I7IH0pO1xuXG4gICAgc2xpY2UuZXhpdCgpXG4gICAgICAucmVtb3ZlKCk7XG4gIH0pO1xuXG5cbnZhciBsZWdlbmQgPSByZXF1aXJlKCcuLi92aWV3JykuZXh0ZW5kKClcbiAgLnByb3AoJ3dpZGdldCcpXG5cbiAgLmluaXQoZnVuY3Rpb24od2lkZ2V0KSB7XG4gICAgdGhpcy53aWRnZXQod2lkZ2V0KTtcbiAgfSlcblxuICAuZW50ZXIoZnVuY3Rpb24oZWwpIHtcbiAgICBlbC5hcHBlbmQoJ3RhYmxlJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd0YWJsZScpO1xuICB9KVxuXG4gIC5kcmF3KGZ1bmN0aW9uKGVsKSB7XG4gICAgdmFyIHZhbHVlRm9ybWF0ID0gdGhpcy53aWRnZXQoKS52YWx1ZUZvcm1hdCgpO1xuICAgIHZhciBwZXJjZW50Rm9ybWF0ID0gdGhpcy53aWRnZXQoKS5wZXJjZW50Rm9ybWF0KCk7XG5cbiAgICB2YXIgbWV0cmljID0gZWwuc2VsZWN0KCcudGFibGUnKS5zZWxlY3RBbGwoJy5tZXRyaWMnKVxuICAgICAgLmRhdGEoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5tZXRyaWNzOyB9LFxuICAgICAgICAgICAgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5rZXk7IH0pO1xuXG4gICAgdmFyIGVudGVyTWV0cmljID0gbWV0cmljLmVudGVyKCkuYXBwZW5kKCd0cicpXG4gICAgICAuYXR0cignY2xhc3MnLCAnbWV0cmljJyk7XG5cbiAgICBlbnRlck1ldHJpYy5hcHBlbmQoJ3RkJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdzd2F0Y2gnKTtcblxuICAgIGVudGVyTWV0cmljLmFwcGVuZCgndGQnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3RpdGxlJyk7XG5cbiAgICBlbnRlck1ldHJpYy5hcHBlbmQoJ3RkJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdwZXJjZW50Jyk7XG5cbiAgICBlbnRlck1ldHJpYy5hcHBlbmQoJ3RkJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd2YWx1ZScpO1xuXG4gICAgbWV0cmljLnNlbGVjdCgnLnN3YXRjaCcpXG4gICAgICAuc3R5bGUoJ2JhY2tncm91bmQnLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLmNvbG9yOyB9KTtcblxuICAgIG1ldHJpYy5zZWxlY3QoJy50aXRsZScpXG4gICAgICAudGV4dChmdW5jdGlvbihkKSB7IHJldHVybiBkLnRpdGxlOyB9KTtcblxuICAgIG1ldHJpYy5zZWxlY3QoJy5wZXJjZW50JylcbiAgICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHBlcmNlbnRGb3JtYXQoZC5wZXJjZW50KTsgfSk7XG5cbiAgICBtZXRyaWMuc2VsZWN0KCcudmFsdWUnKVxuICAgICAgLnRleHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gdmFsdWVGb3JtYXQoZC52YWx1ZSk7IH0pO1xuXG4gICAgbWV0cmljLmV4aXQoKVxuICAgICAgLnJlbW92ZSgpO1xuICB9KTtcbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi4vdmlldycpLmV4dGVuZCgpXG4gIC5wcm9wKCdjb2xzcGFuJylcbiAgLmRlZmF1bHQoMClcblxuICAucHJvcCgncm93c3BhbicpXG4gIC5kZWZhdWx0KDApXG5cbiAgLnByb3AoJ3dpZHRoJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdCgwKVxuXG4gIC5wcm9wKCdoZWlnaHQnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KDApO1xuIl19
(3)
});
