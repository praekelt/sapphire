var utils = require('../utils');


module.exports = require('./widget').extend()
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

    var body = el.append('div')
      .attr('class', 'body');

    body.append('div')
      .attr('class', 'last');

    body.append('div')
      .attr('class', 'sparkline');

    body.append('div')
      .attr('class', 'summary');
  })

  .draw(function(el) {
    var self = this;
    var node = el.node();

    el.select('.title')
      .text(function(d, i) {
        return self.title().call(node, d, i);
      });

    var body = el.select('.body')
      .datum(function(d, i) {
        return self.values()
          .call(node, d, i)
          .map(function(d, i) {
            return {
              x: self.x().call(node, d, i),
              y: self.y().call(node, d, i)
            };
          });
      });

    body.select('.last')
      .datum(function(d, i) {
        d = d[d.length - 1];

        return !d
          ? self.none()
          : d.y;
      })
      .text(this.fvalue());

    body.select('.sparkline')
      .call(this.sparkline());

    body.select('.summary')
      .call(this.summary());
  });


var summary = require('../view').extend()
  .prop('lastvalue')

  .init(function(lastvalue) {
    this.lastvalue(lastvalue);
  })

  .enter(function(el) {
    el.append('span')
      .attr('class', 'neutral diff');

    el.append('span')
      .attr('class', 'time');
  })

  .draw(function(el) {
    var lastvalue = this.lastvalue();
    if (el.datum().length < 1) { return; }

    el.select('.diff')
      .datum(function(d) {
        d = d.slice(-2);
        return d[1].y - d[0].y;
      })
      .attr('class', function(d) {
        if (d === 0) { return 'neutral diff'; }

        return d > 0
          ? 'good diff'
          : 'bad diff';
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


var sparkline = require('../view').extend()
  .prop('lastvalue')

  .prop('height').default(25)

  .prop('margin').default({
    top: 2,
    left: 2,
    bottom: 2,
    right: 2 
  })

  .init(function(lastvalue) {
    this.lastvalue(lastvalue);
  })

  .enter(function(el) {
    el.append('svg')
      .append('g')
      .append('path');
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

    el.select('svg')
      .attr('width', width)
      .attr('height', this.height())
      .select('g')
        .attr('transform', utils.translate(margin.left, margin.top))
        .select('path')
          .attr('d', line);
  });
