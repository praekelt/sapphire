describe("sapphire.widgets.lines", function() {
  var el;
  var datum;

  beforeEach(function() {
    el = d3.select('body')
      .append('div')
      .attr('class', 'tmp');

    datum = {
      title: 'Total Foo and Bar',
      sets: [{
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
    .prop('sets')

    .prop('width')
    .default(600 - (4 + 4))

    .invoke(function(input) {
      var values = this.sets()
        .reduce(function(results, set) {
          results.push.apply(results, set.values);
          return results;
        }, []);

      var scale = d3.scale.linear()
        .domain(d3.extent(values, function(d) { return d.x; }))
        .range([0, this.width()]);

      return scale(input);
    });

  helpers.fy = strain()
    .prop('sets')

    .prop('height')
    .default(150 - (4 + 4))

    .invoke(function(input) {
      var values = this.sets()
        .reduce(function(results, set) {
          results.push.apply(results, set.values);
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

    var title = el.selectAll('.title');
    expect(title.size()).to.equal(1);
    expect(title.text()).to.equal(datum.title);

    datum.title = 'Total Qux and Corge';

    el.datum(datum)
      .call(lines);

    title = el.selectAll('.title');
    expect(title.size()).to.equal(1);
    expect(title.text()).to.equal(datum.title);
  });

  it("should draw lines for its value sets", function() {
    var fx = helpers.fx();
    var fy = helpers.fy();

    var path = helpers.path()
      .fx(fx)
      .fy(fy);

    var lines = sapphire.widgets.lines();

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

    datum.sets[0].values = [{
      x: 123,
      y: 234
    }, {
      x: 345,
      y: 456
    }, {
      x: 567,
      y: 789
    }];

    datum.sets[1].values = [{
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

    fx.sets(datum.sets);
    fy.sets(datum.sets);

    var line = el.selectAll('.chart .set[data-id=foo] .line');
    expect(line.size()).to.equal(1);
    expect(line.attr('d')).to.equal(path(datum.sets[0].values));

    line = el.selectAll('.chart .set[data-id=bar] .line');
    expect(line.size()).to.equal(1);
    expect(line.attr('d')).to.equal(path(datum.sets[1].values));

    datum.sets[0].values = [{
      x: 1123,
      y: 1234
    }, {
      x: 1345,
      y: 1456
    }, {
      x: 1567,
      y: 1789
    }];

    datum.sets[1].values = [{
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

    fx.sets(datum.sets);
    fy.sets(datum.sets);

    line = el.selectAll('.chart .set[data-id=foo] .line');
    expect(line.size()).to.equal(1);
    expect(line.attr('d')).to.equal(path(datum.sets[0].values));

    line = el.selectAll('.chart .set[data-id=bar] .line');
    expect(line.size()).to.equal(1);
    expect(line.attr('d')).to.equal(path(datum.sets[1].values));
  });

  it("should draw a chart time axis", function() {
    var lines = sapphire.widgets.lines()
      .ticks(3)
      .ftick(d3.time.format('%b'));

    expect(el.html()).to.be.empty;

    datum.sets[0].values = [{
      x: +(new Date(2014, 2)),
      y: 234
    }, {
      x: +(new Date(2014, 3)),
      y: 456
    }, {
      x: +(new Date(2014, 4)),
      y: 789,
    }];

    datum.sets[1].values = [{
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

    datum.sets[0].values = [{
      x: +(new Date(2014, 5)),
      y: 234
    }, {
      x: +(new Date(2014, 6)),
      y: 456
    }, {
      x: +(new Date(2014, 7)),
      y: 789
    }];

    datum.sets[1].values = [{
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
});
