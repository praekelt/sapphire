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
    el = d3.select('body')
      .append('div')
      .attr('class', 'tmp');
  });

  afterEach(function() {
    el.remove();
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

  it("should throw an error for unrecognised widget types", function() {
    var dashboard = sapphire.dashboard(el);
    dashboard.types().set('dummy', dummy);

    function draw() {
      dashboard({widgets: [{type: 'unrecognised'}]});
    }

    expect(draw).to.throw(/Unrecognised dashboard widget type 'unrecognised'/);
  });
});
