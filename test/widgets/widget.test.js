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

  it("should set the element's width", function() {
    sapphire.widgets.widget()
      .width(800)
      .draw(el);

    expect(el.style('width')).to.equal('800px');
  });

  it("should set the element's height", function() {
    sapphire.widgets.widget()
      .height(800)
      .draw(el);

    expect(el.style('height')).to.equal('800px');
  });
});
