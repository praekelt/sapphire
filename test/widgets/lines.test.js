describe("sapphire.widgets.lines", function() {
  var el;
  var datum;

  beforeEach(function() {
    el = d3.select('body')
      .append('div')
      .attr('class', 'tmp');

    datum = {
      title: 'Total Foo and Bar',
      metrics: [{
        key: 'foo',
        title: 'Total Foo',
        values: [{
          x: 0,
          y: 0
        }, {
          x: 1,
          y: 3000000
        }, {
          x: 2,
          y: 2000000
        }, {
          x: 3,
          y: 4000000
        }]
      }, {
        key: 'bar',
        title: 'Total Bar',
        values: [{
          x: 0,
          y: 0
        }, {
          x: 1,
          y: 8000000
        }, {
          x: 2,
          y: 3000000
        }, {
          x: 3,
          y: 4000000
        }]
      }]
    };
  });

  afterEach(function() {
    el.remove();
  });

  var helpers = {};

  helpers.fx = strain()
    .prop('metrics')
    .prop('width')

    .invoke(function(input) {
      var values = this.metrics()
        .reduce(function(results, metric) {
          results.push.apply(results, metric.values);
          return results;
        }, []);

      var scale = d3.scale.linear()
        .domain(d3.extent(values, function(d) { return d.x; }))
        .range([0, this.width()]);

      return scale(input);
    });

  helpers.fy = strain()
    .prop('metrics')
    .prop('height')

    .invoke(function(input) {
      var values = this.metrics()
        .reduce(function(results, metric) {
          results.push.apply(results, metric.values);
          return results;
        }, []);

      var scale = d3.scale.linear()
        .domain(d3.extent(values, function(d) { return d.y; }))
        .range([this.height(), 0]);

      return scale(input);
    });

  helpers.path = strain()
    .prop('fx')
    .prop('fy')

    .invoke(function(data) {
      var fx = this.fx();
      var fy = this.fy();

      var line = d3.svg.line()
        .x(function(d, i) { return fx(d.x); })
        .y(function(d, i) { return fy(d.y); });

      return line(data);
    });

  it("should show its title", function() {
    var lines = sapphire.widgets.lines();
    expect(el.html()).to.be.empty;

    datum.title = 'Total Bar and Baz';

    el.datum(datum)
      .call(lines);

    var title = el.selectAll('.widget > .title');
    expect(title.size()).to.equal(1);
    expect(title.text()).to.equal(datum.title);

    datum.title = 'Total Qux and Corge';

    el.datum(datum)
      .call(lines);

    title = el.selectAll('.widget > .title');
    expect(title.size()).to.equal(1);
    expect(title.text()).to.equal(datum.title);
  });

  it("should draw lines for its metrics", function() {
    var lines = sapphire.widgets.lines()
      .key(function(d) { return d.key; });

    lines
      .width(600)
      .chart()
        .height(150)
        .margin({
          top: 4,
          left: 4,
          bottom: 4,
          right: 4 
        });

    var dims = sapphire.utils.box()
      .width(lines.width()())
      .height(lines.chart().height())
      .margin(lines.chart().margin())
      .calc();

    var colors = d3.scale.category10();
      
    var fx = helpers.fx()
      .width(dims.innerWidth);

    var fy = helpers.fy()
      .height(dims.innerHeight);

    var path = helpers.path()
      .fx(fx)
      .fy(fy);

    expect(el.html()).to.be.empty;

    datum.metrics[0].values = [{
      x: 123,
      y: 234
    }, {
      x: 345,
      y: 456
    }, {
      x: 567,
      y: 789
    }];

    datum.metrics[1].values = [{
      x: 123,
      y: 834
    }, {
      x: 345,
      y: 856
    }, {
      x: 567,
      y: 889
    }];

    el.datum(datum)
      .call(lines);

    fx.metrics(datum.metrics);
    fy.metrics(datum.metrics);

    expect(el.selectAll('.chart .metric .line').size()).to.equal(2);
    var line = el.selectAll('.chart .metric[data-key=foo] .line');
    expect(line.size()).to.equal(1);
    expect(line.attr('d')).to.equal(path(datum.metrics[0].values));
    expect(line.style('stroke')).to.equal(colors(0));

    line = el.selectAll('.chart .metric[data-key=bar] .line');
    expect(line.size()).to.equal(1);
    expect(line.attr('d')).to.equal(path(datum.metrics[1].values));
    expect(line.style('stroke')).to.equal(colors(1));

    datum.metrics[0].values = [{
      x: 1123,
      y: 1234
    }, {
      x: 1345,
      y: 1456
    }, {
      x: 1567,
      y: 1789
    }];

    datum.metrics[1].key = 'baz';
    datum.metrics[1].values = [{
      x: 1123,
      y: 3234
    }, {
      x: 1345,
      y: 3456
    }, {
      x: 1567,
      y: 3789
    }];

    el.datum(datum)
      .call(lines);

    fx.metrics(datum.metrics);
    fy.metrics(datum.metrics);

    expect(el.selectAll('.chart .metric .line').size()).to.equal(2);
    line = el.selectAll('.chart .metric[data-key=foo] .line');
    expect(line.size()).to.equal(1);
    expect(line.attr('d')).to.equal(path(datum.metrics[0].values));
    expect(line.style('stroke')).to.equal(colors(0));

    line = el.selectAll('.chart .metric[data-key=baz] .line');
    expect(line.size()).to.equal(1);
    expect(line.attr('d')).to.equal(path(datum.metrics[1].values));
    expect(line.style('stroke')).to.equal(colors(1));
  });

  it("should draw dots for its metrics' last values", function() {
    var lines = sapphire.widgets.lines()
      .key(function(d) { return d.key; });

    lines
      .width(600)
      .chart()
        .height(150)
        .margin({
          top: 4,
          left: 4,
          bottom: 4,
          right: 4 
        });

    var dims = sapphire.utils.box()
      .width(lines.width())
      .height(lines.chart().height())
      .margin(lines.chart().margin())
      .calc();

    var fx = helpers.fx()
      .width(dims.innerWidth);

    var fy = helpers.fy()
      .height(dims.innerHeight);

    var colors = d3.scale.category10();

    expect(el.html()).to.be.empty;

    datum.metrics[0].values = [{
      x: 123,
      y: 234
    }, {
      x: 345,
      y: 456
    }, {
      x: 567,
      y: 789
    }];

    datum.metrics[1].values = [{
      x: 123,
      y: 834
    }, {
      x: 345,
      y: 856
    }, {
      x: 567,
      y: 889
    }];

    el.datum(datum)
      .call(lines);

    fx.metrics(datum.metrics);
    fy.metrics(datum.metrics);

    expect(el.selectAll('.chart .metric .dot').size()).to.equal(2);
    var dot = el.selectAll('.chart .metric[data-key=foo] .dot');
    expect(dot.size()).to.equal(1);
    expect(dot.style('fill')).to.equal(colors(0));

    dot = el.selectAll('.chart .metric[data-key=bar] .dot');
    expect(dot.size()).to.equal(1);
    expect(dot.style('fill')).to.equal(colors(1));

    datum.metrics[0].values = [{
      x: 1123,
      y: 1234
    }, {
      x: 1345,
      y: 1456
    }, {
      x: 1567,
      y: 1789
    }];

    datum.metrics[1].key = 'baz';
    datum.metrics[1].values = [{
      x: 1123,
      y: 3234
    }, {
      x: 1345,
      y: 3456
    }, {
      x: 1567,
      y: 3789
    }];

    el.datum(datum)
      .call(lines);

    fx.metrics(datum.metrics);
    fy.metrics(datum.metrics);

    expect(el.selectAll('.chart .metric .dot').size()).to.equal(2);
    dot = el.selectAll('.chart .metric[data-key=foo] .dot');
    expect(dot.size()).to.equal(1);
    expect(dot.style('fill')).to.equal(colors(0));

    dot = el.selectAll('.chart .metric[data-key=baz] .dot');
    expect(dot.size()).to.equal(1);
    expect(dot.style('fill')).to.equal(colors(1));
  });

  it("should not draw dots for empty metrics", function() {
    var lines = sapphire.widgets.lines()
      .key(function(d) { return d.key; });

    lines
      .width(600)
      .chart()
        .height(150)
        .margin({
          top: 4,
          left: 4,
          bottom: 4,
          right: 4 
        });

    var dims = sapphire.utils.box()
      .width(lines.width()())
      .height(lines.chart().height())
      .margin(lines.chart().margin())
      .calc();

    var fx = helpers.fx()
      .width(dims.innerWidth);

    var fy = helpers.fy()
      .height(dims.innerHeight);

    var colors = d3.scale.category10();

    lines
      .width(600)
      .chart()
        .height(150)
        .margin({
          top: 4,
          left: 4,
          bottom: 4,
          right: 4 
        });

    expect(el.html()).to.be.empty;

    datum.metrics[0].values = [{
      x: 123,
      y: 234
    }, {
      x: 345,
      y: 456
    }, {
      x: 567,
      y: 789
    }];

    datum.metrics[1].values = [];

    el.datum(datum)
      .call(lines);

    fx.metrics(datum.metrics);
    fy.metrics(datum.metrics);

    expect(el.selectAll('.chart .metric .dot').size()).to.equal(1);
    var dot = el.selectAll('.chart .metric[data-key=foo] .dot');
    expect(dot.size()).to.equal(1);
    expect(dot.style('fill')).to.equal(colors(0));

    datum.metrics[0].values = [];

    datum.metrics[1].key = 'baz';
    datum.metrics[1].values = [{
      x: 1123,
      y: 3234
    }, {
      x: 1345,
      y: 3456
    }, {
      x: 1567,
      y: 3789
    }];

    el.datum(datum)
      .call(lines);

    fx.metrics(datum.metrics);
    fy.metrics(datum.metrics);

    expect(el.selectAll('.chart .metric .dot').size()).to.equal(1);
    dot = el.selectAll('.chart .metric[data-key=baz] .dot');
    expect(dot.size()).to.equal(1);
    expect(dot.style('fill')).to.equal(colors(1));
  });

  it("should draw a chart time axis", function() {
    var lines = sapphire.widgets.lines()
      .ticks(3)
      .tickFormat(d3.time.format('%b'));

    expect(el.html()).to.be.empty;

    datum.metrics[0].values = [{
      x: +(new Date(2014, 2)),
      y: 234
    }, {
      x: +(new Date(2014, 3)),
      y: 456
    }, {
      x: +(new Date(2014, 4)),
      y: 789,
    }];

    datum.metrics[1].values = [{
      x: +(new Date(2014, 2)),
      y: 1234
    }, {
      x: +(new Date(2014, 3)),
      y: 1456
    }, {
      x: +(new Date(2014, 4)),
      y: 1789
    }];

    el.datum(datum)
      .call(lines);

    var axis = el.selectAll('.chart .axis');
    expect(axis.size()).to.equal(1);
    expect(axis.text()).to.equal(['Mar', 'Apr', 'May'].join(''));

    datum.metrics[0].values = [{
      x: +(new Date(2014, 5)),
      y: 234
    }, {
      x: +(new Date(2014, 6)),
      y: 456
    }, {
      x: +(new Date(2014, 7)),
      y: 789
    }];

    datum.metrics[1].values = [{
      x: +(new Date(2014, 5)),
      y: 1234
    }, {
      x: +(new Date(2014, 6)),
      y: 1456
    }, {
      x: +(new Date(2014, 7)),
      y: 1789
    }];

    el.datum(datum)
      .call(lines);

    axis = el.selectAll('.chart .axis');
    expect(axis.size()).to.equal(1);
    expect(axis.text()).to.equal(['Jun', 'Jul', 'Aug'].join(''));
  });

  it("should draw its legend", function() {
    var lines = sapphire.widgets.lines();
    expect(el.html()).to.be.empty;

    datum.metrics[0].values = [{
      x: 0,
      y: 0
    }, {
      x: 1,
      y: 3000000
    }, {
      x: 2,
      y: 2000000
    }, {
      x: 3,
      y: 4000000
    }];

    datum.metrics[1].values = [{
      x: 0,
      y: 0
    }, {
      x: 1,
      y: 8000000
    }, {
      x: 2,
      y: 3000000
    }, {
      x: 3,
      y: 5000000
    }];

    el.datum(datum)
      .call(lines);

    var legend = el.selectAll('.legend');
    expect(legend.size()).to.equal(1);
    expect(legend.selectAll('.metric').size()).to.equal(2);

    datum.metrics[0].values = [{
      x: 4,
      y: 600000 
    }, {
      x: 5,
      y: 3000000
    }, {
      x: 6,
      y: 8000000
    }, {
      x: 7,
      y: 9000000
    }];

    datum.metrics[1].key = 'baz';
    datum.metrics[1].values = [{
      x: 4,
      y: 300000 
    }, {
      x: 5,
      y: 8000000
    }, {
      x: 6,
      y: 3000000
    }, {
      x: 7,
      y: 4000000
    }];

    el.datum(datum)
      .call(lines);

    legend = el.selectAll('.legend');
    expect(legend.size()).to.equal(1);
    expect(legend.selectAll('.metric').size()).to.equal(2);
  });

  it("should draw its legend's metric swatches", function() {
    var colors = d3.scale.category10();
    var lines = sapphire.widgets.lines()
      .key(function(d) { return d.key; });

    expect(el.html()).to.be.empty;

    datum.metrics[0].values = [{
      x: 0,
      y: 0
    }, {
      x: 1,
      y: 3000000
    }, {
      x: 2,
      y: 2000000
    }, {
      x: 3,
      y: 4000000
    }];

    datum.metrics[1].values = [{
      x: 0,
      y: 0
    }, {
      x: 1,
      y: 8000000
    }, {
      x: 2,
      y: 3000000
    }, {
      x: 3,
      y: 5000000
    }];

    el.datum(datum)
      .call(lines);

    var swatch = el
      .select('.legend .metric[data-key=foo] .swatch')
      .style('background-color');

    expect(d3.rgb(swatch)).to.deep.equal(d3.rgb(colors(0)));

    swatch = el
      .select('.legend .metric[data-key=bar] .swatch')
      .style('background-color');

    expect(d3.rgb(swatch)).to.deep.equal(d3.rgb(colors(1)));

    datum.metrics[0].values = [{
      x: 4,
      y: 600000 
    }, {
      x: 5,
      y: 3000000
    }, {
      x: 6,
      y: 8000000
    }, {
      x: 7,
      y: 9000000
    }];

    datum.metrics[1].key = 'baz';
    datum.metrics[1].values = [{
      x: 4,
      y: 300000 
    }, {
      x: 5,
      y: 8000000
    }, {
      x: 6,
      y: 3000000
    }, {
      x: 7,
      y: 4000000
    }];

    el.datum(datum)
      .call(lines);

    swatch = el
      .select('.legend .metric[data-key=foo] .swatch')
      .style('background-color');

    expect(d3.rgb(swatch)).to.deep.equal(d3.rgb(colors(0)));

    swatch = el
      .select('.legend .metric[data-key=baz] .swatch')
      .style('background-color');

    expect(d3.rgb(swatch)).to.deep.equal(d3.rgb(colors(1)));
  });

  it("should draw its legend's metric titles", function() {
    var lines = sapphire.widgets.lines()
      .key(function(d) { return d.key; });

    expect(el.html()).to.be.empty;

    datum.metrics[0].values = [{
      x: 0,
      y: 0
    }, {
      x: 1,
      y: 3000000
    }, {
      x: 2,
      y: 2000000
    }, {
      x: 3,
      y: 4000000
    }];

    datum.metrics[1].values = [{
      x: 0,
      y: 0
    }, {
      x: 1,
      y: 8000000
    }, {
      x: 2,
      y: 3000000
    }, {
      x: 3,
      y: 5000000
    }];

    el.datum(datum)
      .call(lines);

    var title = el.select('.legend .metric[data-key=foo] .title');
    expect(title.text()).to.equal('Total Foo');

    title = el.select('.legend .metric[data-key=bar] .title');
    expect(title.text()).to.equal('Total Bar');

    datum.metrics[0].values = [{
      x: 4,
      y: 600000 
    }, {
      x: 5,
      y: 3000000
    }, {
      x: 6,
      y: 8000000
    }, {
      x: 7,
      y: 9000000
    }];

    datum.metrics[1].key = 'baz';
    datum.metrics[1].title = 'Total Baz';
    datum.metrics[1].values = [{
      x: 4,
      y: 300000 
    }, {
      x: 5,
      y: 8000000
    }, {
      x: 6,
      y: 3000000
    }, {
      x: 7,
      y: 4000000
    }];

    el.datum(datum)
      .call(lines);

    title = el.select('.legend .metric[data-key=foo] .title');
    expect(title.text()).to.equal('Total Foo');

    title = el.select('.legend .metric[data-key=baz] .title');
    expect(title.text()).to.equal('Total Baz');
  });

  it("should draw its legend's metrics' last values", function() {
    var lines = sapphire.widgets.lines()
      .key(function(d) { return d.key; });

    expect(el.html()).to.be.empty;

    datum.metrics[0].values = [{
      x: 0,
      y: 0
    }, {
      x: 1,
      y: 3000000
    }, {
      x: 2,
      y: 2000000
    }, {
      x: 3,
      y: 4000000
    }];

    datum.metrics[1].values = [{
      x: 0,
      y: 0
    }, {
      x: 1,
      y: 8000000
    }, {
      x: 2,
      y: 3000000
    }, {
      x: 3,
      y: 5000000
    }];

    el.datum(datum)
      .call(lines);

    var value = el.select('.legend .metric[data-key=foo] .value');
    expect(value.text()).to.equal('4,000,000');

    value = el.select('.legend .metric[data-key=bar] .value');
    expect(value.text()).to.equal('5,000,000');

    datum.metrics[0].values = [{
      x: 4,
      y: 600000 
    }, {
      x: 5,
      y: 3000000
    }, {
      x: 6,
      y: 8000000
    }, {
      x: 7,
      y: 9000000
    }];

    datum.metrics[1].key = 'baz';
    datum.metrics[1].values = [{
      x: 4,
      y: 300000 
    }, {
      x: 5,
      y: 8000000
    }, {
      x: 6,
      y: 3000000
    }, {
      x: 7,
      y: 4000000
    }];

    el.datum(datum)
      .call(lines);

    value = el.select('.legend .metric[data-key=foo] .value');
    expect(value.text()).to.equal('9,000,000');

    value = el.select('.legend .metric[data-key=baz] .value');
    expect(value.text()).to.equal('4,000,000');
  });
});
