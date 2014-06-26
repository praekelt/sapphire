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

  var path = strain()
    .prop('width')
    .prop('height')
    .invoke(function(data) {
      var fx = d3.scale.linear()
        .domain(d3.extent(data, function(d) { return d.x; }))
        .range([0, this.width()]);

      var fy = d3.scale.linear()
        .domain(d3.extent(data, function(d) { return d.y; }))
        .range([this.height(), 0]);

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

    expect(el.selectAll('.last').size()).to.equal(1);
    expect(el.select('.last').text()).to.equal('910');

    datum.values = [{
      x: 1123,
      y: 1345
    }, {
      x: 1678,
      y: 1910
    }];

    el.datum(datum)
      .call(lastvalue);

    expect(el.selectAll('.last').size()).to.equal(1);
    expect(el.select('.last').text()).to.equal('1,910');
  });

  it("should show a diff value if there are two or more values", function() {
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

    expect(el.selectAll('.diff').size()).to.equal(1);
    expect(el.select('.diff').text()).to.equal('+565');

    datum.values = [{
      x: 1123,
      y: 3345
    }, {
      x: 1678,
      y: 1310
    }];

    el.datum(datum)
      .call(lastvalue);

    expect(el.selectAll('.last').size()).to.equal(1);
    expect(el.select('.diff').text()).to.equal('-2,035');
  });

  it("should not show a diff value if there are less than two values", function() {
    var lastvalue = sapphire.widgets.lastvalue();
    expect(el.html()).to.be.empty;

    datum.values = [];

    el.datum(datum)
      .call(lastvalue);

    expect(el.selectAll('.diff').size()).to.equal(1);
    expect(el.select('.diff').text()).to.equal('');

    datum.values = [];

    el.datum(datum)
      .call(lastvalue);

    expect(el.selectAll('.diff').size()).to.equal(1);
    expect(el.select('.diff').text()).to.equal('');
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
    var lastvalue = sapphire.widgets.lastvalue();

    lastvalue
      .width(200)
      .sparkline()
        .height(30)
        .margin({
          top: 2,
          left: 2,
          bottom: 2,
          right: 2 
        });

    var p = path()
      .width(200 - (2 + 2))
      .height(30 - (2 + 2));

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

    expect(el.selectAll('.sparkline path').size()).to.equal(1);
    expect(el.select('.sparkline path').attr('d')).to.equal(p(datum.values));

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

    expect(el.selectAll('.sparkline path').size()).to.equal(1);
    expect(el.select('.sparkline path').attr('d')).to.equal(p(datum.values));
  });
});
