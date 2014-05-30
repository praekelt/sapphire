describe("sapphire.view", function() {
  var el;

  beforeEach(function() {
    el = d3.select('body')
      .append('div')
      .attr('class', 'tmp');
  });

  afterEach(function() {
    el.remove();
  });

  describe("initialisation", function() {
    it("should set the view's selection", function() {
      var view = sapphire.view(el);
      expect(view.el()).to.equal(el);
    });

    it("should draw itself if its element has data bound", function() {
      var draws = 0;

      var viewtype = sapphire.view
        .extend()
        .draw(function() { draws++; });

      viewtype(el);
      expect(draws).to.be.equal(0);

      el.datum({foo: 'bar'});
      viewtype(el);
      expect(draws).to.be.equal(1);
    });
  });

  describe("invocation", function() {
    it("should bind the datum to the selection if given", function() {
      var datum = {foo: 'bar'};
      var view = sapphire.view(el).invoke(datum);
      expect(view.el().datum()).to.equal(datum);
    });

    it("should delegate to the draw method", function(done) {
      sapphire.view
        .extend()
        .draw(function() { done(); })
        .new()
        .invoke();
    });
  });

  describe(".confprop", function() {
    it("should define a static method for setting the default", function() {
      var view = sapphire.view
        .extend()
        .confprop('foo')
        .foo(3)
        .new();

      expect(view.foo()).to.equal(3);
    });
  });

  describe(".el", function() {
    it("should get wrapped as a d3 selection", function() {
      var view = sapphire.view().el(el);
      expect(view.el().node()).to.equal(el.node());
    });
  });
});
