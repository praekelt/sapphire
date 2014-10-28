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

  describe("invocation", function() {
    it("should delegate to the draw method", function(done) {
      sapphire.view
        .extend()
        .draw(function(actualEl) {
            expect(actualEl.node()).to.equal(el.node());
            done();
        })
        .new()
        .invoke(el);
    });
  });

  describe(".draw", function() {
    it("should be allowed to accept additional arguments", function() {
      var thing = sapphire.view
        .extend()
        .draw(function(el, text) {
          el.append('div')
            .attr('class', 'thing')
            .text([text, 'foo'].join(' '));
        });

      thing().draw(el, 'sir');
      expect(el.select('.thing').text()).to.equal('sir foo');
    });

    it("should restore any originally bound datum", function() {
      var a = {};
      var b = {};

      var thing = sapphire.view.extend()
        .draw(function(el) { el.datum(b); });

      el.datum(a);
      thing().draw(el);
      expect(el.datum()).to.equal(a);
    });
  });
});
