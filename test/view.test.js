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
  
  describe(".draw", function() {
    it("should call its parent's draw", function() {
      var thing = sapphire.view
        .extend()
        .draw(function() {
          this.el()
            .append('div')
            .attr('class', 'thing')
            .text('foo');
        });

      var subthing = thing.extend()
        .extend()
        .draw(function() {
          this.el()
            .append('div')
            .attr('class', 'subthing')
            .text('bar');
        });

      subthing(el).draw();
      expect(el.select('.thing').text()).to.equal('foo');
      expect(el.select('.subthing').text()).to.equal('bar');
    });
  });

  describe(".enter", function() {
    it("should only get called on the first draw", function() {
      var enters = 0;

      var thing = sapphire.view.extend()
        .enter(function() {
          enters++;
        });

      var t = thing(el);
      t.draw();
      expect(enters).to.equal(1);

      t.draw();
      expect(enters).to.equal(1);

      t.draw();
      expect(enters).to.equal(1);
    });

    it("should call its parent's enter", function() {
      var thing = sapphire.view
        .extend()
        .enter(function() {
          this.el()
            .append('div')
            .attr('class', 'thing')
            .text('foo');
        });

      var subthing = thing.extend()
        .extend()
        .enter(function() {
          this.el()
            .append('div')
            .attr('class', 'subthing')
            .text('bar');
        });

      subthing(el).draw();
      expect(el.select('.thing').text()).to.equal('foo');
      expect(el.select('.subthing').text()).to.equal('bar');
    });

    it("should get called as the first step when drawing", function(done) {
      var entered = false;

      var thing = sapphire.view.extend()
        .enter(function() {
          entered = true;
        })
        .draw(function() {
          expect(entered).to.be.true;
          done();
        });

      thing(el).draw();
    });
  });
});
