describe("sapphire.widgets.pie", function() {
  var el;
  var datum;
  
  var helpers = {};

  helpers.arc = strain()
    .prop('margin')
    .prop('width')
    .prop('innerRadius')
    .prop('data')

    .meth(function radius() {
      var dims = sapphire.utils.box()
        .margin(this.margin())
        .width(this.width())
        .height(this.width())
        .calc();

      return Math.min(dims.innerWidth, dims.innerHeight) / 2;
    })

    .invoke(function(key) {
      var arc = d3.svg.arc()
        .innerRadius(this.innerRadius())
        .outerRadius(this.radius());

      var layout = d3.layout.pie()
        .value(function(d) { return d.value; });

      var d = layout(this.data())
        .filter(function(d){ return d.data.key === key; })[0];

      return arc(d);
    });

  beforeEach(function() {
    el = d3.select('body')
      .append('div')
      .attr('class', 'tmp');

    datum = {
      title: 'Total Foo and Bar',
      metrics: [{
        key: 'foo',
        title: 'Total Foo',
        value: 4000000
      }, {
        key: 'bar',
        title: 'Total Bar',
        value: 2000000
      }, {
        key: 'baz',
        title: 'Total Baz',
        value: 3000000
      }]
    };
  });

  afterEach(function() {
    el.remove();
  });
  
  it("should set its width", function() {
    var pie = sapphire.widgets.pie()
      .width(800);

    pie(el.datum(datum));
    expect(el.style('width')).to.equal('800px');
  });

  it("should show its title", function() {
    var pie = sapphire.widgets.pie();
    expect(el.html()).to.be.empty;

    datum.title = 'Total Bar and Baz';

    el.datum(datum)
      .call(pie);

    var title = el.selectAll('.widget > .title');
    expect(title.size()).to.equal(1);
    expect(title.text()).to.equal(datum.title);

    datum.title = 'Total Qux and Corge';

    el.datum(datum)
      .call(pie);

    title = el.selectAll('.widget > .title');
    expect(title.size()).to.equal(1);
    expect(title.text()).to.equal(datum.title);
  });

  it("should center its chart", function() {
    var pie = sapphire.widgets.pie()
      .width(300)
      .margin({
        top: 40,
        left: 20,
        right: 20,
        bottom: 20
      });

    var arc = helpers.arc()
      .width(300)
      .margin({
        top: 40,
        left: 20,
        right: 20,
        bottom: 20
      });

    el.datum(datum)
      .call(pie);

    var center = (300 / 2) - arc.radius();
    var translate = sapphire.utils.translate(center, center);
    expect(el.select('svg g').attr('transform')).to.equal(translate);

    pie
      .width(100)
      .margin({
        top: 10,
        left: 10,
        right: 10,
        bottom: 10
      });

    arc
      .width(100)
      .margin({
        top: 10,
        left: 10,
        right: 10,
        bottom: 10
      });

    el.datum(datum)
      .call(pie);

    center = (100 / 2) - arc.radius();
    translate = sapphire.utils.translate(center, center);
    expect(el.select('svg g').attr('transform')).to.equal(translate);
  });

  it("should show its slices", function() {
    var pie = sapphire.widgets.pie()
      .key(function(d) { return d.key; });

    expect(el.html()).to.be.empty;

    datum.metrics[0].key = 'foo';
    datum.metrics[1].key = 'bar';
    datum.metrics[2].key = 'baz';

    el.datum(datum)
      .call(pie);

    var slice = el.selectAll('.slice');
    expect(slice.size()).to.equal(3);

    datum.metrics[0].key = 'foo';
    datum.metrics[1].key = 'ham';
    datum.metrics[2].key = 'baz';

    el.datum(datum)
      .call(pie);

    slice = el.selectAll('.slice');
    expect(slice.size()).to.equal(3);
  });

  it("should size its slices according to their values", function() {
    var pie = sapphire.widgets.pie()
      .width(300)
      .margin({
        top: 20,
        left: 20,
        right: 20,
        bottom: 20
      })
      .innerRadius(15)
      .key(function(d) { return d.key; });

    var arc = helpers.arc()
      .margin({
        top: 20,
        left: 20,
        right: 20,
        bottom: 20
      })
      .width(300)
      .innerRadius(15);

    expect(el.html()).to.be.empty;

    datum.metrics[0].key = 'foo';
    datum.metrics[1].key = 'bar';
    datum.metrics[2].key = 'baz';

    datum.metrics[0].value = 4000000;
    datum.metrics[1].value = 2000000;
    datum.metrics[2].value = 3000000;

    el.datum(datum)
      .call(pie);

    arc.data(datum.metrics);
    expect(d('foo')).to.equal(arc('foo'));
    expect(d('bar')).to.equal(arc('bar'));
    expect(d('baz')).to.equal(arc('baz'));

    datum.metrics[0].key = 'foo';
    datum.metrics[1].key = 'ham';
    datum.metrics[2].key = 'baz';

    datum.metrics[0].value = 5000000;
    datum.metrics[1].value = 6000000;
    datum.metrics[2].value = 7000000;

    el.datum(datum)
      .call(pie);

    arc.data(datum.metrics);
    expect(d('foo')).to.equal(arc('foo'));
    expect(d('ham')).to.equal(arc('ham'));
    expect(d('baz')).to.equal(arc('baz'));

    function d(key) {
      return el.selectAll('.slice path')
        .filter(function(d) { return d.data.key === key; })
        .attr('d');
    }
  });

  it("should colour its slices according to their keys", function() {
    var pie = sapphire.widgets.pie()
      .key(function(d) { return d.key; });

    var colors = pie.colors();

    expect(el.html()).to.be.empty;

    datum.metrics[0].key = 'foo';
    datum.metrics[1].key = 'bar';
    datum.metrics[2].key = 'baz';

    el.datum(datum)
      .call(pie);

    expect(fill('foo')).to.equal(colors('foo'));
    expect(fill('bar')).to.equal(colors('bar'));
    expect(fill('baz')).to.equal(colors('baz'));

    datum.metrics[0].key = 'foo';
    datum.metrics[1].key = 'ham';
    datum.metrics[2].key = 'baz';

    el.datum(datum)
      .call(pie);

    expect(fill('foo')).to.equal(colors('foo'));
    expect(fill('ham')).to.equal(colors('ham'));
    expect(fill('baz')).to.equal(colors('baz'));

    function fill(key) {
      return el.selectAll('.slice path')
        .filter(function(d) { return d.data.key === key; })
        .style('fill');
    }
  });

  it("should display its metrics in a legend", function() {
    var pie = sapphire.widgets.pie()
      .key(function(d) { return d.key; });

    expect(el.html()).to.be.empty;

    datum.metrics[0].key = 'foo';
    datum.metrics[1].key = 'bar';
    datum.metrics[2].key = 'baz';

    el.datum(datum)
      .call(pie);

    expect(el.selectAll('.legend .metric').size()).to.equal(3);

    datum.metrics[0].key = 'foo';
    datum.metrics[1].key = 'ham';
    datum.metrics[2].key = 'baz';

    el.datum(datum)
      .call(pie);

    expect(el.selectAll('.legend .metric').size()).to.equal(3);
  });

  it("should colour its legend swatches according to their metric keys", function() {
    var pie = sapphire.widgets.pie()
      .key(function(d) { return d.key; });

    var colors = pie.colors();

    datum.metrics[0].key = 'foo';
    datum.metrics[1].key = 'bar';
    datum.metrics[2].key = 'baz';

    el.datum(datum)
      .call(pie);

    expect(bg('foo')).to.equal(colors('foo'));
    expect(bg('bar')).to.equal(colors('bar'));
    expect(bg('baz')).to.equal(colors('baz'));

    datum.metrics[0].key = 'foo';
    datum.metrics[1].key = 'ham';
    datum.metrics[2].key = 'baz';

    el.datum(datum)
      .call(pie);

    expect(bg('foo')).to.equal(colors('foo'));
    expect(bg('ham')).to.equal(colors('ham'));
    expect(bg('baz')).to.equal(colors('baz'));

    function bg(key) {
      var v = el.selectAll('.legend .metric .swatch')
        .filter(function(d) { return d.key === key; })
        .style('background-color');

      return d3.rgb(v).toString();
    }
  });

  it("should display its metric titles in a legend", function() {
    var pie = sapphire.widgets.pie()
      .key(function(d) { return d.key; });

    datum.metrics[0].key = 'foo';
    datum.metrics[1].key = 'bar';
    datum.metrics[2].key = 'baz';

    datum.metrics[0].title = 'Foo';
    datum.metrics[1].title = 'Bar';
    datum.metrics[2].title = 'Baz';

    el.datum(datum)
      .call(pie);

    expect(title('foo')).to.equal('Foo');
    expect(title('bar')).to.equal('Bar');
    expect(title('baz')).to.equal('Baz');

    datum.metrics[0].key = 'foo';
    datum.metrics[1].key = 'ham';
    datum.metrics[2].key = 'baz';

    datum.metrics[0].title = 'Foo';
    datum.metrics[1].title = 'Ham';
    datum.metrics[2].title = 'Baz';

    el.datum(datum)
      .call(pie);

    expect(title('foo')).to.equal('Foo');
    expect(title('ham')).to.equal('Ham');
    expect(title('baz')).to.equal('Baz');

    function title(key) {
      return el.selectAll('.legend .metric .title')
        .filter(function(d) { return d.key === key; })
        .text();
    }
  });

  it("should display its metric percentages in a legend", function() {
    var format = d3.format('.2%');

    var pie = sapphire.widgets.pie()
      .percentFormat(format)
      .key(function(d) { return d.key; });

    datum.metrics[0].key = 'foo';
    datum.metrics[1].key = 'bar';
    datum.metrics[2].key = 'baz';

    var sum = 0;
    sum += datum.metrics[0].value = 4000000;
    sum += datum.metrics[1].value = 2000000;
    sum += datum.metrics[2].value = 3000000;

    el.datum(datum)
      .call(pie);

    expect(percent('foo')).to.equal(format(4000000 / sum));
    expect(percent('bar')).to.equal(format(2000000 / sum));
    expect(percent('baz')).to.equal(format(3000000 / sum));

    datum.metrics[0].key = 'foo';
    datum.metrics[1].key = 'ham';
    datum.metrics[2].key = 'baz';

    sum = 0;
    sum += datum.metrics[0].value = 5000000;
    sum += datum.metrics[1].value = 6000000;
    sum += datum.metrics[2].value = 7000000;

    el.datum(datum)
      .call(pie);

    expect(percent('foo')).to.equal(format(5000000 / sum));
    expect(percent('ham')).to.equal(format(6000000 / sum));
    expect(percent('baz')).to.equal(format(7000000 / sum));

    function percent(key) {
      return el.selectAll('.legend .metric .percent')
        .filter(function(d) { return d.key === key; })
        .text();
    }
  });

  it("should display its metric values in a legend", function() {
    var format = d3.format(',4s');

    var pie = sapphire.widgets.pie()
      .valueFormat(format)
      .key(function(d) { return d.key; });

    datum.metrics[0].key = 'foo';
    datum.metrics[1].key = 'bar';
    datum.metrics[2].key = 'baz';

    datum.metrics[0].value = 4000000;
    datum.metrics[1].value = 2000000;
    datum.metrics[2].value = 3000000;

    el.datum(datum)
      .call(pie);

    expect(value('foo')).to.equal(format(4000000));
    expect(value('bar')).to.equal(format(2000000));
    expect(value('baz')).to.equal(format(3000000));

    datum.metrics[0].key = 'foo';
    datum.metrics[1].key = 'ham';
    datum.metrics[2].key = 'baz';

    datum.metrics[0].value = 5000000;
    datum.metrics[1].value = 6000000;
    datum.metrics[2].value = 7000000;

    el.datum(datum)
      .call(pie);

    expect(value('foo')).to.equal(format(5000000));
    expect(value('ham')).to.equal(format(6000000));
    expect(value('baz')).to.equal(format(7000000));

    function value(key) {
      return el.selectAll('.legend .metric .value')
        .filter(function(d) { return d.key === key; })
        .text();
    }
  });
});
