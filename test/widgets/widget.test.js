describe("sapphire.widgets.widget", function() {
  var el;

  beforeEach(function() {
    el = d3.select('body')
      .append('div')
      .attr('class', 'tmp');
  });

  afterEach(function() {
    el.remove();
  });

  it("should set the element's width if it is standalone", function() {
    var widget = sapphire.widgets.widget()
      .standalone(false)
      .width(800);

    widget(el);
    expect(el.style('width')).to.not.equal('800px');

    widget
      .standalone(true);

    widget(el);
    expect(el.style('width')).to.equal('800px');
  });

  it("should set the element's height if it is standalone", function() {
    var widget = sapphire.widgets.widget()
      .standalone(false)
      .height(800)
      .draw(el);

    widget(el);
    expect(el.style('height')).to.not.equal('800px');

    widget
      .standalone(true);

    widget(el);
    expect(el.style('height')).to.equal('800px');
  });
});
