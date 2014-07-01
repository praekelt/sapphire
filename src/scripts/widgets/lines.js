var utils = require('../utils');


module.exports = require('./widget').extend()
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
  .default(d3.scale.category20())

  .prop('none')
  .default(0)

  .prop('chart')

  .init(function() {
    this.chart(chart(this));
  })

  .enter(function(el) {
    el.attr('class', 'lines widget');

    el.append('div')
      .attr('class', 'title');

    var values = el.append('div')
      .attr('class', 'values');

    values.append('div')
      .attr('class', 'chart');
  })

  .draw(function(el) {
    var self = this;
    var node = el.node();
    var colors = this.colors();

    el.select('.title')
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


var chart = require('../view').extend()
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
      .attr('d', function(d) {
        return line(d.values);
      })
      .attr('stroke', function(d) {
        return d.color;
      });

    set.exit()
      .remove();

    svg
      .select('.axis')
      .attr('transform', utils.translate(0, innerHeight))
      .call(axis);
  });