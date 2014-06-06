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

  it("should set the element's dimensions", function() {
    sapphire.widgets.widget(el)
      .width(800)
      .height(900)
      .draw();

    expect(el.style('width')).to.equal('800px');
    expect(el.style('height')).to.equal('900px');
  });
});
