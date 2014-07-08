describe("sapphire.dashboard", function() {
  var el;
  var datum;

  var dummy = sapphire.widgets.widget.extend()
    .prop('text')
    .set(d3.functor)
    .default(function(d) { return d.text; })

    .draw(function(el) {
      el.text(this.text());
    });

  beforeEach(function() {
    d3.select('body')
      .append('div')
      .attr('class', 'tmp sapphire');

    el = d3.select('.tmp').append('div');

    datum = {
      widgets: [{
        key: 'a',
        type: 'dummy',
        text: 'foo'
      }, {
        key: 'b',
        type: 'dummy',
        text: 'bar'
      }]
    };
  });

  afterEach(function() {
    d3.select('.tmp').remove();
  });

  it("should draw its widgets", function() {
    var dashboard = sapphire.dashboard();
    dashboard.types().set('dummy', dummy());

    datum.widgets = [{
      key: 'a',
      type: 'dummy',
      text: 'foo'
    }, {
      key: 'b',
      type: 'dummy',
      text: 'bar'
    }, {
      key: 'c',
      type: 'dummy',
      text: 'baz'
    }];

    el.datum(datum)
      .call(dashboard);

    expect(el.selectAll('.widget').size()).to.equal(3);
    expect(el.select('.widget[data-key=a]').text()).to.equal('foo');
    expect(el.select('.widget[data-key=b]').text()).to.equal('bar');
    expect(el.select('.widget[data-key=c]').text()).to.equal('baz');

    datum.widgets = [{
      key: 'a',
      type: 'dummy',
      text: 'ham'
    }, {
      key: 'd',
      type: 'dummy',
      text: 'quux'
    }];

    el.datum(datum)
      .call(dashboard);

    expect(el.selectAll('.widget').size()).to.equal(2);
    expect(el.select('.widget[data-key=a]').text()).to.equal('ham');
    expect(el.select('.widget[data-key=d]').text()).to.equal('quux');
  });

  it("should use each widget type's colspan as a fallback colspan", function() {
    var dummy = sapphire.widgets.widget.extend()
      .prop('colspan')
      .default(4);

    var dashboard = sapphire.dashboard()
      .numcols(4)
      .padding(10);

    dashboard.types().set('dummy', dummy());

    datum.widgets = [{
      key: 'a',
      type: 'dummy',
      text: 'foo',
      col: 3,
      row: 6,
    }];

    el.datum(datum)
      .call(dashboard);

    expect(el.select('.widget[data-key=a]').style('width')).to.equal('380px');
  });

  it("should position its widgets in a grid", function() {
    var dummy = sapphire.widgets.widget.extend()
      .prop('colspan')
      .default(4)

      .draw(function(el) {
        el.style('height', function(d) { return d.height + 'px'; });
      });

    var dashboard = sapphire.dashboard()
      .numcols(4)
      .padding(10)
      .scale(100);

    dashboard.types().set('dummy', dummy());

    datum.widgets = [{
      key: 'a',
      type: 'dummy',
      text: 'foo',
      col: 3,
      row: 6,
      colspan: 2,
      height: 300
    }, {
      key: 'b',
      type: 'dummy',
      text: 'bar',
      col: 2,
      row: 9,
      colspan: 3,
      height: 198
    }];

    el.datum(datum)
      .call(dashboard);

    expect(el.select('.widget[data-key=a]').style('left')).to.equal('310px');
    expect(el.select('.widget[data-key=a]').style('top')).to.equal('610px');
    expect(el.select('.widget[data-key=a]').style('width')).to.equal('180px');
    expect(el.select('.widget[data-key=a]').style('height')).to.equal('280px');

    expect(el.select('.widget[data-key=b]').style('left')).to.equal('210px');
    expect(el.select('.widget[data-key=b]').style('top')).to.equal('910px');
    expect(el.select('.widget[data-key=b]').style('width')).to.equal('280px');
    expect(el.select('.widget[data-key=b]').style('height')).to.equal('180px');

    datum.widgets = [{
      key: 'a',
      type: 'dummy',
      text: 'foo',
      col: 2,
      row: 9,
      colspan: 2,
      height: 250
    }, {
      key: 'b',
      type: 'dummy',
      text: 'bar',
      col: 1,
      row: 2,
      colspan: 4,
      height: 200
    }, {
      key: 'c',
      type: 'dummy',
      text: 'baz',
      col: 3,
      row: 12,
      colspan: 2,
      height: 400
    }];

    el.datum(datum)
      .call(dashboard);

    expect(el.select('.widget[data-key=a]').style('left')).to.equal('210px');
    expect(el.select('.widget[data-key=a]').style('top')).to.equal('910px');
    expect(el.select('.widget[data-key=a]').style('width')).to.equal('180px');
    expect(el.select('.widget[data-key=a]').style('height')).to.equal('280px');

    expect(el.select('.widget[data-key=b]').style('left')).to.equal('110px');
    expect(el.select('.widget[data-key=b]').style('top')).to.equal('210px');
    expect(el.select('.widget[data-key=b]').style('width')).to.equal('380px');
    expect(el.select('.widget[data-key=b]').style('height')).to.equal('180px');

    expect(el.select('.widget[data-key=c]').style('left')).to.equal('310px');
    expect(el.select('.widget[data-key=c]').style('top')).to.equal('1210px');
    expect(el.select('.widget[data-key=c]').style('width')).to.equal('180px');
    expect(el.select('.widget[data-key=c]').style('height')).to.equal('380px');
  });

  it("should throw an error for unrecognised widget types", function() {
    var dashboard = sapphire.dashboard();
    dashboard.types().set('dummy', dummy());
    datum.widgets = [{type: 'unrecognised'}];

    function draw() {
      el.datum(datum)
        .call(dashboard);
    }

    expect(draw).to.throw(/Unrecognised dashboard widget type 'unrecognised'/);
  });
});
