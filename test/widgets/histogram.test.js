describe("sapphire.widgets.histogram", function() {
  var el;
  var datum;
  var eps = 0.000001;

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
        .domain([0, d3.max(this.values(), function(d) { return d.y; })])
        .range([this.height(), 0]);

      return scale(input);
    });

	it("should show its bars", function() {
    var fx = helpers.fx();
    var fy = helpers.fy();

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

    var width = parseInt(el.select('.chart').style('width')) - (4 + 4);
    var height = parseInt(el.select('.chart').style('height')) - (4 + 4);

    fx.width(width)
      .values(datum.values);

    fy.height(height)
      .values(datum.values);

    var barWidth = (width / 3) - (8 / 2);
		var bar = el.select('.bar:nth-child(1)');
    var transform = sapphire.utils.translate(fx(0) - (barWidth / 2), fy(234));
    expect(bar.attr('transform')).to.equal(transform);
    expect(el.selectAll('.bar').size()).to.equal(3);
    expect(bar.select('rect').attr('width')).to.be.closeTo(barWidth, eps);
    expect(bar.select('rect').attr('height')).to.be.closeTo(height - fy(234), eps);

		bar = el.select('.bar:nth-child(2)');
    transform = sapphire.utils.translate(fx(5) - (barWidth / 2), fy(456)) ;
    expect(bar.attr('transform')).to.equal(transform);
    expect(bar.select('rect').attr('width')).to.be.closeTo(barWidth, eps);
    expect(bar.select('rect').attr('height')).to.be.closeTo(height - fy(456), eps);

		bar = el.select('.bar:nth-child(3)');
    transform = sapphire.utils.translate(fx(10) - (barWidth / 2), fy(789));
    expect(bar.attr('transform')).to.equal(transform);
    expect(bar.select('rect').attr('width')).to.be.closeTo(barWidth, eps);
    expect(bar.select('rect').attr('height')).to.be.closeTo(height - fy(789), eps);

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

    fx.values(datum.values);
    fy.values(datum.values);

		bar = el.select('.bar:nth-child(1)');
    transform = sapphire.utils.translate(fx(15) - (barWidth / 2), fy(1234));
    expect(el.selectAll('.bar').size()).to.equal(3);
    expect(bar.attr('transform')).to.equal(transform);
    expect(bar.select('rect').attr('width')).to.be.closeTo(barWidth, eps);
    expect(bar.select('rect').attr('height')).to.be.closeTo(height - fy(1234), eps);

		bar = el.select('.bar:nth-child(2)');
    transform = sapphire.utils.translate(fx(20) - (barWidth / 2), fy(1456));
    expect(bar.attr('transform')).to.equal(transform);
    expect(bar.select('rect').attr('width')).to.be.closeTo(barWidth, eps);
    expect(bar.select('rect').attr('height')).to.be.closeTo(height - fy(1456), eps);

		bar = el.select('.bar:nth-child(3)');
    transform = sapphire.utils.translate(fx(25) - (barWidth / 2), fy(1789));
    expect(bar.attr('transform')).to.equal(transform);
    expect(bar.select('rect').attr('width')).to.be.closeTo(barWidth, eps);
    expect(bar.select('rect').attr('height')).to.be.closeTo(height - fy(1789), eps);
	});
});
