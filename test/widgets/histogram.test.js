describe("sapphire.widgets.histogram", function() {
  var el;
  var datum;

  beforeEach(function() {
    el = d3.select('body')
      .append('div')
      .attr('class', 'tmp');

    datum = {
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
    };
  });

  afterEach(function() {
    el.remove();
  });

  it("should show its title", function() {
    var histogram = sapphire.widgets.histogram();
    expect(el.html()).to.be.empty;

    datum.title = 'Total Bar';

    el.datum(datum)
      .call(histogram);

    expect(el.select('.title').text()).to.equal('Total Bar');

    datum.title = 'Total Baz';

    el.datum(datum)
      .call(histogram);

    expect(el.select('.title').text()).to.equal('Total Baz');
  });

	it("should show its bars", function() {
    var fx = d3.scale.linear();
    var fy = d3.scale.linear();

    var histogram = sapphire.widgets.histogram()
      .width(400)
			.height(150)
			.barPadding(8)
			.margin({
				top: 4,
				left: 4,
				bottom: 4,
				right: 4 
			});

    expect(el.html()).to.be.empty;

    datum.values = [{
      x: 0,
      y: 234
    }, {
      x: 5,
      y: 456
    }, {
      x: 10,
      y: 789
    }];

    el.datum(datum)
      .call(histogram);

    expect(el.selectAll('.bar').size()).to.equal(3);

    var dims = sapphire.utils.box()
      .width(parseInt(el.select('.chart').style('width')))
      .height(parseInt(el.select('.chart').style('height')))
      .margin(histogram.margin())
      .calc();

    var dx = (10 - 0) / 3;

    fx.domain([0, 10 + dx])
      .range([0, dims.innerWidth]);

    fy.domain([0, 789])
      .range([dims.innerHeight, 0]);

		var bar = el.select('.bar:nth-child(1)');
    expect(bar.attr('transform')).to.equal(transform(0, 234));
    expect(bar.select('rect').attr('width')).to.be.closeTo(width(), 0.01);
    expect(bar.select('rect').attr('height')).to.be.closeTo(height(234), 0.01);

		bar = el.select('.bar:nth-child(2)');
    expect(bar.attr('transform')).to.equal(transform(5, 456));
    expect(bar.select('rect').attr('width')).to.be.closeTo(width(), 0.01);
    expect(bar.select('rect').attr('height')).to.be.closeTo(height(456), 0.01);

		bar = el.select('.bar:nth-child(3)');
    expect(bar.attr('transform')).to.equal(transform(10, 789));
    expect(bar.select('rect').attr('width')).to.be.closeTo(width(), 0.01);
    expect(bar.select('rect').attr('height')).to.be.closeTo(height(789), 0.01);

    datum.values = [{
      x: 15,
      y: 1234
    }, {
      x: 20,
      y: 1456
    }, {
      x: 25,
      y: 1789
    }];

    el.datum(datum)
      .call(histogram);

    expect(el.selectAll('.bar').size()).to.equal(3);

    dx = (25 - 15) / 3;
    fx.domain([15, 25 + dx]);
    fy.domain([0, 1789]);

		bar = el.select('.bar:nth-child(1)');
    expect(bar.attr('transform')).to.equal(transform(15, 1234));
    expect(bar.select('rect').attr('width')).to.be.closeTo(width(), 0.01);
    expect(bar.select('rect').attr('height')).to.be.closeTo(height(1234), 0.01);

		bar = el.select('.bar:nth-child(2)');
    expect(bar.attr('transform')).to.equal(transform(20, 1456));
    expect(bar.select('rect').attr('width')).to.be.closeTo(width(), 0.01);
    expect(bar.select('rect').attr('height')).to.be.closeTo(height(1456), 0.01);

		bar = el.select('.bar:nth-child(3)');
    expect(bar.attr('transform')).to.equal(transform(25, 1789));
    expect(bar.select('rect').attr('width')).to.be.closeTo(width(), 0.01);
    expect(bar.select('rect').attr('height')).to.be.closeTo(height(1789), 0.01);

    function width() {
      return (fx(dx) - fx(0)) - (histogram.barPadding() / 2);
    }

    function height(y) {
      return dims.innerHeight - fy(y);
    }

    function transform(x, y) {
      return sapphire.utils.translate(fx(x), fy(y));
    }
	});

	it("should colour its bars", function() {
    var histogram = sapphire.widgets.histogram()
      .width(400)
			.height(150)
			.barPadding(8)
			.margin({
				top: 4,
				left: 4,
				bottom: 4,
				right: 4 
			});

    expect(el.html()).to.be.empty;

    datum.title = 'Total Bar';

    datum.values = [{
      x: 0,
      y: 234
    }, {
      x: 5,
      y: 456
    }, {
      x: 10,
      y: 789
    }];

    el.datum(datum)
      .call(histogram);

    var color = histogram.colors()('Total Bar');
    expect(el.selectAll('.bar').size()).to.equal(3);
		expect(el.select('.bar:nth-child(1) rect').style('fill')).to.equal(color);
		expect(el.select('.bar:nth-child(2) rect').style('fill')).to.equal(color);
		expect(el.select('.bar:nth-child(3) rect').style('fill')).to.equal(color);

    datum.title = 'Total Baz';

    datum.values = [{
      x: 15,
      y: 1234
    }, {
      x: 20,
      y: 1456
    }, {
      x: 25,
      y: 1789
    }];

    el.datum(datum)
      .call(histogram);

    color = histogram.colors()('Total Baz');
    expect(el.selectAll('.bar').size()).to.equal(3);
		expect(el.select('.bar:nth-child(1) rect').style('fill')).to.equal(color);
		expect(el.select('.bar:nth-child(2) rect').style('fill')).to.equal(color);
		expect(el.select('.bar:nth-child(3) rect').style('fill')).to.equal(color);
  });

  it("should allow its bars to have variable widths", function() {
    var fx = d3.scale.linear();

    var histogram = sapphire.widgets.histogram()
      .width(400)
			.barPadding(8)
			.margin({
				top: 4,
				left: 4,
				bottom: 4,
				right: 4 
			})
      .dx(function(d) { return d.dx; });

    expect(el.html()).to.be.empty;

    datum.values = [{
      x: 0,
      y: 234,
      dx: 2
    }, {
      x: 5,
      y: 456,
      dx: 4
    }, {
      x: 10,
      y: 789,
      dx: 6
    }];

    el.datum(datum)
      .call(histogram);

    expect(el.selectAll('.bar').size()).to.equal(3);

    var dims = sapphire.utils.box()
      .width(parseInt(el.select('.chart').style('width')))
      .height(parseInt(el.select('.chart').style('height')))
      .margin(histogram.margin())
      .calc();

    fx.domain([0, 10 + 6])
      .range([0, dims.innerWidth]);

		var bar = el.select('.bar:nth-child(1)');
    expect(bar.select('rect').attr('width')).to.be.closeTo(width(0, 2), 0.01);

		bar = el.select('.bar:nth-child(2)');
    expect(bar.select('rect').attr('width')).to.be.closeTo(width(5, 4), 0.01);

		bar = el.select('.bar:nth-child(3)');
    expect(bar.select('rect').attr('width')).to.be.closeTo(width(10, 6), 0.01);

    datum.values = [{
      x: 15,
      y: 1234,
      dx: 8
    }, {
      x: 20,
      y: 1456,
      dx: 10 
    }, {
      x: 25,
      y: 1789,
      dx: 12
    }];

    el.datum(datum)
      .call(histogram);

    expect(el.selectAll('.bar').size()).to.equal(3);

    fx.domain([15, 25 + 12]);

		bar = el.select('.bar:nth-child(1)');
    expect(bar.select('rect').attr('width')).to.be.closeTo(width(15, 8), 0.01);

		bar = el.select('.bar:nth-child(2)');
    expect(bar.select('rect').attr('width')).to.be.closeTo(width(20, 10), 0.01);

		bar = el.select('.bar:nth-child(3)');
    expect(bar.select('rect').attr('width')).to.be.closeTo(width(25, 12), 0.01);

    function width(x, dx) {
      return (fx(x + dx) - fx(x)) - (histogram.barPadding() / 2);
    }
  });

  it("should show its time axis", function() {
    var histogram = sapphire.widgets.histogram()
      .ticks(3)
      .tickFormat(d3.time.format('%b'));

    expect(el.html()).to.be.empty;

    datum.values = [{
      x: +(new Date(2014, 2)),
      y: 234
    }, {
      x: +(new Date(2014, 3)),
      y: 456
    }, {
      x: +(new Date(2014, 4)),
      y: 789,
    }];

    el.datum(datum)
      .call(histogram);

    var axis = el.selectAll('.chart .axis');
    expect(axis.size()).to.equal(1);
    expect(axis.text()).to.equal(['Mar', 'Apr', 'May'].join(''));

    datum.values = [{
      x: +(new Date(2014, 5)),
      y: 234
    }, {
      x: +(new Date(2014, 6)),
      y: 456
    }, {
      x: +(new Date(2014, 7)),
      y: 789
    }];

    el.datum(datum)
      .call(histogram);

    axis = el.selectAll('.chart .axis');
    expect(axis.size()).to.equal(1);
    expect(axis.text()).to.equal(['Jun', 'Jul', 'Aug'].join(''));
  });
});
