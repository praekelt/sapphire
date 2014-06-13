describe("sapphire.dashboard", function() {
  var el;

  var dummy = sapphire.widgets.widget.extend()
    .confprop('text')
    .set(d3.functor)
    .text(function(d) { return d.text; })

    .draw(function() {
      this.el().text(this.text());
    });

  beforeEach(function() {
    d3.select('body')
      .append('div')
      .attr('class', 'tmp sapphire');

    el = d3.select('.tmp').append('div');
  });

  afterEach(function() {
    d3.select('.tmp').remove();
  });

  it("should draw its widgets", function() {
    var dashboard = sapphire.dashboard(el);
    dashboard.types().set('dummy', dummy);

    dashboard({
      widgets: [{
        key: 'a',
        type: 'dummy',
        text: 'foo'
      }, {
        key: 'b',
        type: 'dummy',
        text: 'bar'
      }]
    });

    expect(el.selectAll('.widget').size()).to.equal(2);
    expect(el.select('.widget[data-key=a]').text()).to.equal('foo');
    expect(el.select('.widget[data-key=b]').text()).to.equal('bar');

    dashboard({
      widgets: [{
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
      }]
    });

    expect(el.selectAll('.widget').size()).to.equal(3);
    expect(el.select('.widget[data-key=a]').text()).to.equal('foo');
    expect(el.select('.widget[data-key=b]').text()).to.equal('bar');
    expect(el.select('.widget[data-key=c]').text()).to.equal('baz');
  });

  it("should use each widget type's rowspan as a fallback rowspan", function() {
    var dummy = sapphire.widgets.widget.extend()
      .static('rowspan', 4);

    var dashboard = sapphire.dashboard(el)
      .numcols(4)
      .padding(10);

    dashboard.types().set('dummy', dummy);

    dashboard({
      widgets: [{
        key: 'a',
        type: 'dummy',
        text: 'foo',
        col: 3,
        row: 6,
        colspan: 2,
      }]
    });

    expect(el.select('.widget[data-key=a]').style('height')).to.equal('380px');
  });

  it("should use each widget type's colspan as a fallback colspan", function() {
    var dummy = sapphire.widgets.widget.extend()
      .static('colspan', 4);

    var dashboard = sapphire.dashboard(el)
      .numcols(4)
      .padding(10);

    dashboard.types().set('dummy', dummy);

    dashboard({
      widgets: [{
        key: 'a',
        type: 'dummy',
        text: 'foo',
        col: 3,
        row: 6,
        rowspan: 2,
      }]
    });

    expect(el.select('.widget[data-key=a]').style('width')).to.equal('380px');
  });

  it("should position its widgets in a grid", function() {
    var dashboard = sapphire.dashboard(el)
      .numcols(4)
      .padding(10);

    dashboard.types().set('dummy', dummy);

    dashboard({
      widgets: [{
        key: 'a',
        type: 'dummy',
        text: 'foo',
        col: 3,
        row: 6,
        colspan: 2,
        rowspan: 3
      }, {
        key: 'b',
        type: 'dummy',
        text: 'bar',
        col: 2,
        row: 9,
        colspan: 3,
        rowspan: 2
      }]
    });

    expect(el.select('.widget[data-key=a]').style('left')).to.equal('310px');
    expect(el.select('.widget[data-key=a]').style('top')).to.equal('610px');
    expect(el.select('.widget[data-key=a]').style('width')).to.equal('180px');
    expect(el.select('.widget[data-key=a]').style('height')).to.equal('280px');

    expect(el.select('.widget[data-key=b]').style('left')).to.equal('210px');
    expect(el.select('.widget[data-key=b]').style('top')).to.equal('910px');
    expect(el.select('.widget[data-key=b]').style('width')).to.equal('280px');
    expect(el.select('.widget[data-key=b]').style('height')).to.equal('180px');

    dashboard({
      widgets: [{
        key: 'a',
        type: 'dummy',
        text: 'foo',
        col: 2,
        row: 9,
        colspan: 2,
        rowspan: 3
      }, {
        key: 'b',
        type: 'dummy',
        text: 'bar',
        col: 1,
        row: 2,
        colspan: 4,
        rowspan: 2
      }, {
        key: 'c',
        type: 'dummy',
        text: 'baz',
        col: 3,
        row: 12,
        colspan: 2,
        rowspan: 4
      }]
    });

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
    var dashboard = sapphire.dashboard(el);
    dashboard.types().set('dummy', dummy);

    function draw() {
      dashboard({widgets: [{type: 'unrecognised'}]});
    }

    expect(draw).to.throw(/Unrecognised dashboard widget type 'unrecognised'/);
  });
});
