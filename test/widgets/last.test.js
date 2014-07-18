describe("sapphire.widgets.last", function() {
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

    .invoke(function(input) {
      var scale = d3.scale.linear()
        .domain(d3.extent(this.values(), function(d) { return d.x; }))
        .range([0, this.width()]);

      return scale(input);
    });

  helpers.fy = strain()
    .prop('values')
    .prop('height')

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
    var last = sapphire.widgets.last();
    expect(el.html()).to.be.empty;

    datum.values = [{
      x: 123,
      y: 345
    }, {
      x: 678,
      y: 910
    }];

    el.datum(datum)
      .call(last);

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
      .call(last);

    expect(el.selectAll('.last.value').size()).to.equal(1);
    expect(el.select('.last.value').text()).to.equal('1,910');
  });

  it("should use the appropriate diff class", function() {
    var last = sapphire.widgets.last();
    expect(el.html()).to.be.empty;

    datum.values = [{
      x: 123,
      y: 345
    }, {
      x: 678,
      y: 910
    }];

    el.datum(datum)
      .call(last);

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
      .call(last);

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
      .call(last);

    expect(el.select('.values').attr('class'))
        .to.equal('neutral values');
  });

  it("should use a neutral diff class for less than two values", function() {
    var last = sapphire.widgets.last();
    expect(el.html()).to.be.empty;

    datum.values = [{
      x: 123,
      y: 345
    }];

    el.datum(datum)
      .call(last);

    expect(el.select('.values').attr('class'))
        .to.equal('neutral values');

    datum.values = [];

    el.datum(datum)
      .call(last);

    expect(el.select('.values').attr('class'))
        .to.equal('neutral values');
  });

  it("should show a diff summary if there are two or more values", function() {
    var last = sapphire.widgets.last();
    expect(el.html()).to.be.empty;

    datum.values = [{
      x: +(new Date(2014, 2, 2, 8, 30)),
      y: 345
    }, {
      x: +(new Date(2014, 2, 3, 6, 30)),
      y: 910
    }];

    el.datum(datum)
      .call(last);

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
      .call(last);

    expect(el.selectAll('.summary').size())
        .to.equal(1);

    expect(el.select('.summary').text())
        .to.equal('-2,035 from 4 Mar 2:30 to 5 Mar 12:30');
  });

  it("should not show a diff summary if there are less than two values", function() {
    var last = sapphire.widgets.last();
    expect(el.html()).to.be.empty;

    datum.values = [{
      x: 123,
      y: 345
    }];

    el.datum(datum)
      .call(last);

    expect(el.selectAll('.summary').size()).to.equal(1);
    expect(el.select('.summary').text()).to.equal('');

    datum.values = [];

    el.datum(datum)
      .call(last);

    expect(el.selectAll('.summary').size()).to.equal(1);
    expect(el.select('.summary').text()).to.equal('');
  });

  it("should show its title", function() {
    var last = sapphire.widgets.last();
    expect(el.html()).to.be.empty;

    datum.title = 'Total Bar and Baz';

    el.datum(datum)
      .call(last);

    expect(el.selectAll('.title').size()).to.equal(1);
    expect(el.select('.title').text()).to.equal(datum.title);

    datum.title = 'Total Qux and Corge';

    el.datum(datum)
      .call(last);

    expect(el.selectAll('.title').size()).to.equal(1);
    expect(el.select('.title').text()).to.equal(datum.title);
  });

  it("should show the 'none' value if values are not available", function() {
    var last = sapphire.widgets.last()
      .none(23);

    datum.values = [];

    el.datum(datum)
      .call(last);

    last(el);
    expect(el.select('.last').text()).to.equal('23');
  });

  it("should display a sparkline", function() {
    var last = sapphire.widgets.last();

    last
      .sparklineLimit(2);

    last
      .width(200)
      .sparkline()
        .height(25)
        .margin({
          top: 4,
          left: 4,
          bottom: 4,
          right: 4 
        });

    var dims = sapphire.utils.box()
      .width(last.width()())
      .height(last.sparkline().height())
      .margin(last.sparkline().margin())
      .calc();

    var fx = helpers.fx()
      .width(dims.innerWidth);

    var fy = helpers.fy()
      .height(dims.innerHeight);

    var path = helpers.path()
      .fx(fx)
      .fy(fy);

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
      .call(last);

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
      .call(last);

    fx.values(datum.values);
    fy.values(datum.values);

    expect(el.selectAll('.sparkline .rest.path').size())
      .to.equal(1);

    expect(el.select('.sparkline .rest.path').attr('d'))
      .to.equal(path(datum.values));
  });

  it("should not display a sparkline under the configured limit", function() {
    var last = sapphire.widgets.last()
      .sparklineLimit(2);

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
      .call(last);

    expect(parseInt(el.selectAll('.sparkline').style('height')))
      .to.be.above(0);

    datum.values = [{
      x: 1123,
      y: 1234
    }];

    el.datum(datum)
      .call(last);

    expect(parseInt(el.selectAll('.sparkline').style('height')))
      .to.equal(0);
  });

  it("should floor its sparkline's limit at 2", function() {
    var last = sapphire.widgets.last();
    expect(last.sparklineLimit(-1).sparklineLimit()).to.equal(2);
    expect(last.sparklineLimit(0).sparklineLimit()).to.equal(2);
    expect(last.sparklineLimit(1).sparklineLimit()).to.equal(2);
    expect(last.sparklineLimit(2).sparklineLimit()).to.equal(2);
    expect(last.sparklineLimit(3).sparklineLimit()).to.equal(3);
    expect(last.sparklineLimit(4).sparklineLimit()).to.equal(4);
  });

  it("should not display a summary under the configured limit", function() {
    var last = sapphire.widgets.last()
      .summaryLimit(2);

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
      .call(last);

    expect(parseInt(el.selectAll('.summary').style('height')))
      .to.be.above(0);

    datum.values = [{
      x: 1123,
      y: 1234
    }];

    el.datum(datum)
      .call(last);

    expect(parseInt(el.selectAll('.summary').style('height')))
      .to.equal(0);
  });

  it("should floor its summary's limit at 2", function() {
    var last = sapphire.widgets.last();
    expect(last.summaryLimit(-1).summaryLimit()).to.equal(2);
    expect(last.summaryLimit(0).summaryLimit()).to.equal(2);
    expect(last.summaryLimit(1).summaryLimit()).to.equal(2);
    expect(last.summaryLimit(2).summaryLimit()).to.equal(2);
    expect(last.summaryLimit(3).summaryLimit()).to.equal(3);
    expect(last.summaryLimit(4).summaryLimit()).to.equal(4);
  });

  it("should display a diff line", function() {
    var last = sapphire.widgets.last()
      .sparklineLimit(2);

    last
      .width(200)
      .sparkline()
        .height(25)
        .margin({
          top: 4,
          left: 4,
          bottom: 4,
          right: 4 
        });

    var dims = sapphire.utils.box()
      .width(last.width()())
      .height(last.sparkline().height())
      .margin(last.sparkline().margin())
      .calc();

    var fx = helpers.fx()
      .width(dims.innerWidth);

    var fy = helpers.fy()
      .height(dims.innerHeight);

    var path = helpers.path()
      .fx(fx)
      .fy(fy);

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
      .call(last);

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
      .call(last);

    fx.values(datum.values);
    fy.values(datum.values);

    expect(el.selectAll('.sparkline .diff.path').size())
      .to.equal(1);

    expect(el.select('.sparkline .diff.path').attr('d'))
      .to.equal(path(datum.values.slice(-2)));
  });

  it("should display a dot for the last value", function() {
    var last = sapphire.widgets.last()
      .sparklineLimit(2);

    last
      .width(200)
      .sparkline()
        .height(25)
        .margin({
          top: 4,
          left: 4,
          bottom: 4,
          right: 4 
        });

    var dims = sapphire.utils.box()
      .width(last.width()())
      .height(last.sparkline().height())
      .margin(last.sparkline().margin())
      .calc();

    var fx = helpers.fx()
      .width(dims.innerWidth);

    var fy = helpers.fy()
      .height(dims.innerHeight);

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
      .call(last);

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
      .call(last);

    expect(el.selectAll('.sparkline .dot').size())
      .to.equal(1);

    expect(+el.select('.sparkline .dot').attr('cx')).to.equal(fx(1567));
    expect(+el.select('.sparkline .dot').attr('cy')).to.equal(fy(1789));
  });
});
