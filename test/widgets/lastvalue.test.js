describe("sapphire.widgets.lastvalue", function() {
  var el;
  var datum;

  beforeEach(function() {
    el = d3.select('body')
      .append('div')
      .attr('class', 'tmp');

    datum = {
      title: 'Total Bar and Baz',
      values: [{
        x: 123,
        y: 234
      }, {
        x: 345,
        y: 456
      }, {
        x: 567,
        y: 789
      }]
    };
  });

  afterEach(function() {
    el.remove();
  });

  var helpers = {};

  helpers.fx = strain()
    .prop('values')

    .prop('width')
    .default(200 - (4 + 4))

    .invoke(function(input) {
      var scale = d3.scale.linear()
        .domain(d3.extent(this.values(), function(d) { return d.x; }))
        .range([0, this.width()]);

      return scale(input);
    });

  helpers.fy = strain()
    .prop('values')

    .prop('height')
    .default(25 - (4 + 4))

    .invoke(function(input) {
      var scale = d3.scale.linear()
        .domain(d3.extent(this.values(), function(d) { return d.y; }))
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

  it("should show the last value", function() {
    var lastvalue = sapphire.widgets.lastvalue();
    expect(el.html()).to.be.empty;

    datum.values = [{
      x: 123,
      y: 345
    }, {
      x: 678,
      y: 910
    }];

    el.datum(datum)
      .call(lastvalue);

    expect(el.selectAll('.last.value').size()).to.equal(1);
    expect(el.select('.last.value').text()).to.equal('910');

    datum.values = [{
      x: 1123,
      y: 1345
    }, {
      x: 1678,
      y: 1910
    }];

    el.datum(datum)
      .call(lastvalue);

    expect(el.selectAll('.last.value').size()).to.equal(1);
    expect(el.select('.last.value').text()).to.equal('1,910');
  });

  it("should use the appropriate diff class", function() {
    var lastvalue = sapphire.widgets.lastvalue();
    expect(el.html()).to.be.empty;

    datum.values = [{
      x: 123,
      y: 345
    }, {
      x: 678,
      y: 910
    }];

    el.datum(datum)
      .call(lastvalue);

    expect(el.select('.values').attr('class'))
        .to.equal('good values');

    datum.values = [{
      x: 1123,
      y: 1945
    }, {
      x: 1678,
      y: 1310
    }];

    el.datum(datum)
      .call(lastvalue);

    expect(el.select('.values').attr('class'))
        .to.equal('bad values');

    datum.values = [{
      x: 1123,
      y: 1310
    }, {
      x: 1678,
      y: 1310
    }];

    el.datum(datum)
      .call(lastvalue);

    expect(el.select('.values').attr('class'))
        .to.equal('neutral values');
  });

  it("should show a diff summary if there are two or more values", function() {
    var lastvalue = sapphire.widgets.lastvalue();
    expect(el.html()).to.be.empty;

    datum.values = [{
      x: +(new Date(2014, 2, 2, 8, 30)),
      y: 345
    }, {
      x: +(new Date(2014, 2, 3, 6, 30)),
      y: 910
    }];

    el.datum(datum)
      .call(lastvalue);

    expect(el.selectAll('.summary').size())
        .to.equal(1);

    expect(el.select('.summary').text())
        .to.equal('+565 from 2 Mar 8:30 to 3 Mar 6:30');

    datum.values = [{
      x: +(new Date(2014, 2, 4, 2, 30)),
      y: 3345
    }, {
      x: +(new Date(2014, 2, 5, 12, 30)),
      y: 1310
    }];

    el.datum(datum)
      .call(lastvalue);

    expect(el.selectAll('.summary').size())
        .to.equal(1);

    expect(el.select('.summary').text())
        .to.equal('-2,035 from 4 Mar 2:30 to 5 Mar 12:30');
  });

  it("should not show a diff summary if there are less than two values", function() {
    var lastvalue = sapphire.widgets.lastvalue();
    expect(el.html()).to.be.empty;

    datum.values = [];

    el.datum(datum)
      .call(lastvalue);

    expect(el.selectAll('.summary').size()).to.equal(1);
    expect(el.select('.summary').text()).to.equal('');

    datum.values = [];

    el.datum(datum)
      .call(lastvalue);

    expect(el.selectAll('.summary').size()).to.equal(1);
    expect(el.select('.summary').text()).to.equal('');
  });

  it("should show its title", function() {
    var lastvalue = sapphire.widgets.lastvalue();
    expect(el.html()).to.be.empty;

    datum.title = 'Total Bar and Baz';

    el.datum(datum)
      .call(lastvalue);

    expect(el.selectAll('.title').size()).to.equal(1);
    expect(el.select('.title').text()).to.equal(datum.title);

    datum.title = 'Total Qux and Corge';

    el.datum(datum)
      .call(lastvalue);

    expect(el.selectAll('.title').size()).to.equal(1);
    expect(el.select('.title').text()).to.equal(datum.title);
  });

  it("should show the 'none' value if values are not available", function() {
    var lastvalue = sapphire.widgets.lastvalue()
      .none(23);

    datum.values = [];

    el.datum(datum)
      .call(lastvalue);

    lastvalue(el);
    expect(el.select('.last').text()).to.equal('23');
  });

  it("should display a sparkline", function() {
    var fx = helpers.fx();
    var fy = helpers.fy();

    var path = helpers.path()
      .fx(fx)
      .fy(fy);

    var lastvalue = sapphire.widgets.lastvalue();

    lastvalue
      .width(200)
      .sparkline()
        .height(25)
        .margin({
          top: 4,
          left: 4,
          bottom: 4,
          right: 4 
        });

    expect(el.html()).to.be.empty;

    datum.values = [{
      x: 123,
      y: 234
    }, {
      x: 345,
      y: 456
    }, {
      x: 567,
      y: 789
    }];

    el.datum(datum)
      .call(lastvalue);

    fx.values(datum.values);
    fy.values(datum.values);

    expect(el.selectAll('.sparkline .rest.path').size())
      .to.equal(1);

    expect(el.select('.sparkline .rest.path').attr('d'))
      .to.equal(path(datum.values));

    datum.values = [{
      x: 1123,
      y: 1234
    }, {
      x: 1345,
      y: 1456
    }, {
      x: 1567,
      y: 1789
    }];

    el.datum(datum)
      .call(lastvalue);

    fx.values(datum.values);
    fy.values(datum.values);

    expect(el.selectAll('.sparkline .rest.path').size())
      .to.equal(1);

    expect(el.select('.sparkline .rest.path').attr('d'))
      .to.equal(path(datum.values));
  });

  it("should display a diff line", function() {
    var fx = helpers.fx();
    var fy = helpers.fy();

    var path = helpers.path()
      .fx(fx)
      .fy(fy);

    var lastvalue = sapphire.widgets.lastvalue();

    lastvalue
      .width(200)
      .sparkline()
        .height(25)
        .margin({
          top: 4,
          left: 4,
          bottom: 4,
          right: 4 
        });

    expect(el.html()).to.be.empty;

    datum.values = [{
      x: 123,
      y: 234
    }, {
      x: 345,
      y: 456
    }, {
      x: 567,
      y: 789
    }];

    el.datum(datum)
      .call(lastvalue);

    fx.values(datum.values);
    fy.values(datum.values);

    expect(el.selectAll('.sparkline .diff.path').size())
      .to.equal(1);

    expect(el.select('.sparkline .diff.path').attr('d'))
      .to.equal(path(datum.values.slice(-2)));

    datum.values = [{
      x: 1123,
      y: 1234
    }, {
      x: 1345,
      y: 1456
    }, {
      x: 1567,
      y: 1789
    }];

    el.datum(datum)
      .call(lastvalue);

    fx.values(datum.values);
    fy.values(datum.values);

    expect(el.selectAll('.sparkline .diff.path').size())
      .to.equal(1);

    expect(el.select('.sparkline .diff.path').attr('d'))
      .to.equal(path(datum.values.slice(-2)));
  });

  it("should display a dot for the last value", function() {
    var fx = helpers.fx();
    var fy = helpers.fy();
    var lastvalue = sapphire.widgets.lastvalue();

    lastvalue
      .width(200)
      .sparkline()
        .height(25)
        .margin({
          top: 4,
          left: 4,
          bottom: 4,
          right: 4 
        });

    expect(el.html()).to.be.empty;

    datum.values = [{
      x: 123,
      y: 234
    }, {
      x: 345,
      y: 456
    }, {
      x: 567,
      y: 789
    }];

    fx.values(datum.values);
    fy.values(datum.values);

    el.datum(datum)
      .call(lastvalue);

    expect(el.selectAll('.sparkline .dot').size())
      .to.equal(1);

    expect(+el.select('.sparkline .dot').attr('cx')).to.equal(fx(567));
    expect(+el.select('.sparkline .dot').attr('cy')).to.equal(fy(789));

    datum.values = [{
      x: 1123,
      y: 1234
    }, {
      x: 1345,
      y: 1456
    }, {
      x: 1567,
      y: 1789
    }];

    fx.values(datum.values);
    fy.values(datum.values);

    el.datum(datum)
      .call(lastvalue);

    expect(el.selectAll('.sparkline .dot').size())
      .to.equal(1);

    expect(+el.select('.sparkline .dot').attr('cx')).to.equal(fx(1567));
    expect(+el.select('.sparkline .dot').attr('cy')).to.equal(fy(1789));
  });
});
