describe("sapphire.widgets.lines", function() {
  var el;
  var datum;
  var container;

  beforeEach(function() {
    container = d3.select('body')
      .append('div')
      .attr('class', 'tmp');

    el = container.append('div');

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
    container.remove();
  });

  helpers = {};

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

  it("should not overwrite existing class attributes", function() {
    var lines = sapphire.widgets.lines();

    el.datum(datum)
      .attr('class', 'foo');

    lines(el);

    expect(el.classed('foo')).to.be.true;
  });

  it("should show its title", function() {
    var lines = sapphire.widgets.lines();

    datum.title = 'Total Bar and Baz';

    el.datum(datum)
      .call(lines);

    var title = el.selectAll('.sph-title');
    expect(title.size()).to.equal(1);
    expect(title.text()).to.equal(datum.title);

    datum.title = 'Total Qux and Corge';

    el.datum(datum)
      .call(lines);

    title = el.selectAll('.sph-title');
    expect(title.size()).to.equal(1);
    expect(title.text()).to.equal(datum.title);
  });

  it("should draw lines for its metrics", function() {
    container
      .classed('w640 with-chart-h240', true);

    var lines = sapphire.widgets.lines()
      .key(function(d) { return d.key; });

    lines
      .chartMargin({
        top: 4,
        left: 4,
        bottom: 4,
        right: 4 
      });

    var dims = sapphire.utils.box()
      .width(640)
      .height(240)
      .margin({
        top: 4,
        left: 4,
        bottom: 4,
        right: 4 
      })
      .calc();

    var colors = lines.colors();
      
    var fx = d3.scale.linear()
      .range([0, dims.innerWidth]);

    var fy = d3.scale.linear()
      .range([dims.innerHeight, 0]);

    var path = helpers.path()
      .fx(fx)
      .fy(fy);

    datum.metrics[1].key = 'foo';
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

    datum.metrics[1].key = 'bar';
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

    fx.domain([123, 567]);
    fy.domain([234, 889]);

    expect(el.selectAll('.sph-chart-lines-line').size()).to.equal(2);

    var line = el
      .selectAll('.sph-chart-lines-metric[data-key=foo]')
      .selectAll('.sph-chart-lines-line');

    expect(line.size()).to.equal(1);
    expect(line.attr('d')).to.equal(path(datum.metrics[0].values));
    expect(line.style('stroke')).to.equal(colors('foo'));

    line = el
      .selectAll('.sph-chart-lines-metric[data-key=bar]')
      .selectAll('.sph-chart-lines-line');

    expect(line.size()).to.equal(1);
    expect(line.attr('d')).to.equal(path(datum.metrics[1].values));
    expect(line.style('stroke')).to.equal(colors('bar'));

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

    fx.domain([1123, 1567]);
    fy.domain([1234, 3789]);

    expect(el.selectAll('.sph-chart-lines-line').size()).to.equal(2);

    line = el
      .selectAll('.sph-chart-lines-metric[data-key=foo]')
      .selectAll('.sph-chart-lines-line');

    expect(line.size()).to.equal(1);
    expect(line.attr('d')).to.equal(path(datum.metrics[0].values));
    expect(line.style('stroke')).to.equal(colors('foo'));

    line = el
      .selectAll('.sph-chart-lines-metric[data-key=baz]')
      .selectAll('.sph-chart-lines-line');

    expect(line.size()).to.equal(1);
    expect(line.attr('d')).to.equal(path(datum.metrics[1].values));
    expect(line.style('stroke')).to.equal(colors('baz'));
  });

  it("should draw dots for its metrics' last values", function() {
    container
      .classed('w640 with-chart-h240', true);

    var lines = sapphire.widgets.lines()
      .key(function(d) { return d.key; });

    lines
      .chartMargin({
        top: 4,
        left: 4,
        bottom: 4,
        right: 4 
      });

    var dims = sapphire.utils.box()
      .width(640)
      .height(240)
      .margin({
        top: 4,
        left: 4,
        bottom: 4,
        right: 4 
      })
      .calc();

    var fx = d3.scale.linear()
      .range([0, dims.innerWidth]);

    var fy = d3.scale.linear()
      .range([dims.innerHeight, 0]);

    var colors = lines.colors();

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

    fx.domain([123, 567]);
    fy.domain([234, 889]);

    expect(el.selectAll('.sph-chart-lines-dot').size()).to.equal(2);

    var dot = el
      .selectAll('.sph-chart-lines-metric[data-key=foo]')
      .selectAll('.sph-chart-lines-dot');

    expect(dot.size()).to.equal(1);
    expect(dot.style('fill')).to.equal(colors('foo'));
    expect(+dot.attr('cx')).to.equal(fx(567));
    expect(+dot.attr('cy')).to.equal(fy(789));

    dot = el
      .selectAll('.sph-chart-lines-metric[data-key=bar]')
      .selectAll('.sph-chart-lines-dot');

    expect(dot.size()).to.equal(1);
    expect(dot.style('fill')).to.equal(colors('bar'));
    expect(+dot.attr('cx')).to.equal(fx(567));
    expect(+dot.attr('cy')).to.equal(fy(889));

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

    fx.domain([1123, 1567]);
    fy.domain([1234, 3789]);

    expect(el.selectAll('.sph-chart-lines-dot').size()).to.equal(2);

    dot = el
      .selectAll('.sph-chart-lines-metric[data-key=foo]')
      .selectAll('.sph-chart-lines-dot');

    expect(dot.size()).to.equal(1);
    expect(dot.style('fill')).to.equal(colors('foo'));
    expect(+dot.attr('cx')).to.equal(fx(1567));
    expect(+dot.attr('cy')).to.equal(fy(1789));

    dot = el
      .selectAll('.sph-chart-lines-metric[data-key=baz]')
      .selectAll('.sph-chart-lines-dot');

    expect(dot.size()).to.equal(1);
    expect(dot.style('fill')).to.equal(colors('baz'));
    expect(+dot.attr('cx')).to.equal(fx(1567));
    expect(+dot.attr('cy')).to.equal(fy(3789));
  });

  it("should not draw dots for empty metrics", function() {
    var lines = sapphire.widgets.lines()
      .key(function(d) { return d.key; });

    datum.metrics[0].key = 'foo';
    datum.metrics[0].values = [{
      x: 123,
      y: 234
    }];

    datum.metrics[1].key = 'bar';
    datum.metrics[1].values = [];

    el.datum(datum)
      .call(lines);

    expect(el
      .selectAll('.sph-chart-lines-metric[data-key=foo]')
      .selectAll('.sph-chart-lines-dot')
      .size()).to.equal(1);

    expect(el
      .selectAll('.sph-chart-lines-metric[data-key=bar]')
      .selectAll('.sph-chart-lines-dot')
      .size()).to.equal(0);

    datum.metrics[0].values = [];

    datum.metrics[1].key = 'baz';
    datum.metrics[1].values = [{
      x: 1123,
      y: 3234
    }];

    el.datum(datum)
      .call(lines);

    expect(el
      .selectAll('.sph-chart-lines-metric[data-key=joo]')
      .selectAll('.sph-chart-lines-dot')
      .size()).to.equal(0);

    expect(el
      .selectAll('.sph-chart-lines-metric[data-key=bar]')
      .selectAll('.sph-chart-lines-dot')
      .size()).to.equal(0);

    expect(el
      .selectAll('.sph-chart-lines-metric[data-key=baz]')
      .selectAll('.sph-chart-lines-dot')
      .size()).to.equal(1);
  });

  it("should draw a chart x axis", function() {
    var lines = sapphire.widgets.lines();

    lines
      .xTicks(3)
      .xTickFormat(d3.time.format('%b'));

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

    var axis = el.selectAll('.sph-axis-lines-x');
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

    axis = el.selectAll('.sph-axis-lines-x');
    expect(axis.size()).to.equal(1);
    expect(axis.text()).to.equal(['Jun', 'Jul', 'Aug'].join(''));
  });

  it("should draw a chart y axis", function() {
    var lines = sapphire.widgets.lines();

    lines
      .yTicks(3)
      .yTickFormat(d3.format('s'));

    datum.metrics[0].values = [{
      x: +(new Date(2014, 2)),
      y: 234000
    }, {
      x: +(new Date(2014, 3)),
      y: 789000
    }, {
      x: +(new Date(2014, 4)),
      y: 456000
    }];

    datum.metrics[1].values = [{
      x: +(new Date(2014, 2)),
      y: 834000
    }, {
      x: +(new Date(2014, 3)),
      y: 656000
    }, {
      x: +(new Date(2014, 4)),
      y: 489000
    }];


    el.datum(datum)
      .call(lines);

    var axis = el.selectAll('.sph-axis-lines-y');
    expect(axis.size()).to.equal(1);
    expect(axis.text()).to.equal(['400k', '600k', '800k'].join(''));

    datum.metrics[0].values = [{
      x: +(new Date(2014, 5)),
      y: 2340000
    }, {
      x: +(new Date(2014, 6)),
      y: 4560000
    }, {
      x: +(new Date(2014, 7)),
      y: 7890000
    }];

    datum.metrics[1].values = [{
      x: +(new Date(2014, 5)),
      y: 8340000
    }, {
      x: +(new Date(2014, 6)),
      y: 6560000
    }, {
      x: +(new Date(2014, 7)),
      y: 4890000
    }];

    el.datum(datum)
      .call(lines);

    axis = el.selectAll('.sph-axis-lines-y');
    expect(axis.size()).to.equal(1);
    expect(axis.text()).to.equal(['4M', '6M', '8M'].join(''));
  });

  it("should draw its legend", function() {
    var lines = sapphire.widgets.lines();

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

    var legend = el.selectAll('.sph-table-lines');
    expect(legend.size()).to.equal(1);
    expect(legend.selectAll('.sph-table-lines-metric').size()).to.equal(2);

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

    legend = el.selectAll('.sph-table-lines');
    expect(legend.size()).to.equal(1);
    expect(legend.selectAll('.sph-table-lines-metric').size()).to.equal(2);
  });

  it("should draw its legend's metric swatches", function() {
    var lines = sapphire.widgets.lines()
      .key(function(d) { return d.key; });

    var colors = lines.colors();

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
      .select('.sph-table-lines-metric[data-key=foo] .sph-swatch')
      .style('background-color');

    expect(d3.rgb(swatch)).to.deep.equal(d3.rgb(colors('foo')));

    swatch = el
      .select('.sph-table-lines-metric[data-key=bar] .sph-swatch')
      .style('background-color');

    expect(d3.rgb(swatch)).to.deep.equal(d3.rgb(colors('bar')));

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
      .select('.sph-table-lines-metric[data-key=foo] .sph-swatch')
      .style('background-color');

    expect(d3.rgb(swatch)).to.deep.equal(d3.rgb(colors('foo')));

    swatch = el
      .select('.sph-table-lines-metric[data-key=baz] .sph-swatch')
      .style('background-color');

    expect(d3.rgb(swatch)).to.deep.equal(d3.rgb(colors('baz')));
  });

  it("should draw its legend's metric titles", function() {
    var lines = sapphire.widgets.lines()
      .key(function(d) { return d.key; });

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

    var title = el
      .select('.sph-table-lines-metric[data-key=foo]')
      .select('.sph-table-lines-title');

    expect(title.text()).to.equal('Total Foo');

    title = el
      .select('.sph-table-lines-metric[data-key=bar]')
      .select('.sph-table-lines-title');

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

    title = el
      .select('.sph-table-lines-metric[data-key=foo]')
      .select('.sph-table-lines-title');

    expect(title.text()).to.equal('Total Foo');

    title = el
      .select('.sph-table-lines-metric[data-key=baz]')
      .select('.sph-table-lines-title');

    expect(title.text()).to.equal('Total Baz');
  });

  it("should draw its legend's metrics' last values", function() {
    var lines = sapphire.widgets.lines()
      .key(function(d) { return d.key; });

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

    var value = el
      .select('.sph-table-lines-metric[data-key=foo]')
      .select('.sph-table-lines-value');

    expect(value.text()).to.equal('4,000,000');

    value = el
      .select('.sph-table-lines-metric[data-key=bar]')
      .select('.sph-table-lines-value');

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

    value = el
      .select('.sph-table-lines-metric[data-key=foo]')
      .select('.sph-table-lines-value');

    expect(value.text()).to.equal('9,000,000');

    value = el
      .select('.sph-table-lines-metric[data-key=baz]')
      .select('.sph-table-lines-value');

    expect(value.text()).to.equal('4,000,000');
  });

  it("should support a configurable minimum y value", function() {
    var lines = sapphire.widgets.lines()
      .yTicks(3)
      .yTickFormat(d3.format('s'))
      .yMin(2000000);

    datum.metrics = [datum.metrics[0]];
    datum.metrics[0].values = [{
      x: +(new Date(2014, 4)),
      y: 4890000,
    }, {
      x: +(new Date(2014, 4)),
      y: 6890000,
    }];

    el.datum(datum)
      .call(lines);

    var axis = el.selectAll('.sph-axis-lines-y');
    expect(axis.text()).to.equal(['2M', '4M', '6M'].join(''));
  });

  it("should support a configurable minimum y function", function() {
    var lines = sapphire.widgets.lines()
      .yTicks(3)
      .yTickFormat(d3.format('s'))
      .yMin(function(values) {
        return d3.min([4000000].concat(values));
      });

    datum.metrics = [datum.metrics[0]];
    datum.metrics[0].values = [{
      x: +(new Date(2014, 4)),
      y: 8890000,
    }, {
      x: +(new Date(2014, 4)),
      y: 10890000,
    }];

    el.datum(datum)
      .call(lines);

    var axis = el.selectAll('.sph-axis-lines-y');
    expect(axis.text()).to.equal(['4M', '6M', '8M', '10M'].join(''));

    datum.metrics[0].values = [{
      x: +(new Date(2014, 4)),
      y: 1890000,
    }, {
      x: +(new Date(2014, 4)),
      y: 8890000,
    }];

    el.datum(datum)
      .call(lines);

    axis = el.selectAll('.sph-axis-lines-y');
    expect(axis.text()).to.equal(['2M', '4M', '6M', '8M'].join(''));
  });

  it("should support a configurable maximum y value", function() {
    var lines = sapphire.widgets.lines()
      .yTicks(3)
      .yTickFormat(d3.format('s'))
      .yMax(6000000);

    datum.metrics = [datum.metrics[0]];
    datum.metrics[0].values = [{
      x: +(new Date(2014, 4)),
      y: 2890000,
    }, {
      x: +(new Date(2014, 4)),
      y: 3890000,
    }];

    el.datum(datum)
      .call(lines);

    var axis = el.selectAll('.sph-axis-lines-y');
    expect(axis.text()).to.equal(['3M', '4M', '5M', '6M'].join(''));
  });

  it("should support a configurable maximum y function", function() {
    var lines = sapphire.widgets.lines()
      .yTicks(3)
      .yTickFormat(d3.format('s'))
      .yMax(function(values) {
        return d3.max([6000000].concat(values));
      });

    datum.metrics = [datum.metrics[0]];
    datum.metrics[0].values = [{
      x: +(new Date(2014, 4)),
      y: 2890000,
    }, {
      x: +(new Date(2014, 4)),
      y: 3890000,
    }];

    el.datum(datum)
      .call(lines);

    var axis = el.selectAll('.sph-axis-lines-y');
    expect(axis.text()).to.equal(['3M', '4M', '5M', '6M'].join(''));

    datum.metrics[0].values = [{
      x: +(new Date(2014, 4)),
      y: 2890000,
    }, {
      x: +(new Date(2014, 4)),
      y: 10890000,
    }];

    el.datum(datum)
      .call(lines);

    axis = el.selectAll('.sph-axis-lines-y');
    expect(axis.text()).to.equal(['4M', '6M', '8M', '10M'].join(''));
  });

  it("should allow the widget components to be specified explicitly", function() {
    var lines = sapphire.widgets.lines()
      .explicitComponents(true);

    el.datum(datum).call(lines);
    expect(el.selectAll('[data-widget-component="title"]').size()).to.equal(0);
    expect(el.selectAll('[data-widget-component="chart"]').size()).to.equal(0);
    expect(el.selectAll('[data-widget-component="legend"]').size()).to.equal(0);

    el.append('div')
      .attr('data-widget-component', 'title');

    el.append('div')
      .attr('data-widget-component', 'chart');

    el.append('div')
      .attr('data-widget-component', 'legend');

    el.datum(datum).call(lines);
    expect(el.selectAll('[data-widget-component="title"]').size()).to.equal(1);
    expect(el.selectAll('[data-widget-component="chart"]').size()).to.equal(1);
    expect(el.selectAll('[data-widget-component="legend"]').size()).to.equal(1);
  });
});
