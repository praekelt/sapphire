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

    el.select('.title')
      .text(this.title());

    el.select('.last')
      .datum(function(d, i) {
        var values = self.values().call(this, d, i);
        d = values[values.length - 1];

        return d
          ? self.y().call(this, d, i)
          : self.none();
      })
      .text(this.fvalue());

    el.select('.sparkline')
      .datum(this.values())
      .call(this.sparkline());

    el.select('.summary')
      .datum(this.values())
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
      .datum(function(d, i) {
        d = d
          .slice(-2)
          .map(lastvalue.y());

        return d[1] - d[0];
      })
      .attr('class', function(d) {
        if (d === 0) { return 'neutral diff'; }

        return d > 0
          ? 'good diff'
          : 'bad diff';
      })
      .text(lastvalue.fdiff());

    el.select('.time')
      .datum(function(d, i) {
        return [xAt.call(this, d, -2), xAt.call(this, d, -1)]
          .map(utils.date)
          .map(lastvalue.ftime());

      })
      .text(function(d) {
        return [' from', d[0], 'to', d[1]].join(' ');
      });

    function xAt(data, i) {
      if (i < 0) { i = data.length + i; }
      return lastvalue.x().call(this, data[i], i);
    }
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
    var lastvalue = this.lastvalue();
    var width = parseInt(el.style('width'));

    var fx = d3.scale.linear()
      .domain(d3.extent(el.datum(), lastvalue.x()))
      .range([0, width - (margin.left + margin.right)]);

    var fy = d3.scale.linear()
      .domain(d3.extent(el.datum(), lastvalue.y()))
      .range([this.height() - (margin.top + margin.bottom), 0]);

    var line = d3.svg.line()
      .x(function(d, i) {
        return fx(lastvalue.x().call(this, d, i));
      })
      .y(function(d, i) {
        return fy(lastvalue.y().call(this, d, i));
      });

    el.select('svg')
      .attr('width', width)
      .attr('height', this.height())
      .select('g')
        .attr('transform', utils.translate(margin.left, margin.top))
        .select('path')
          .attr('d', line);
  });
