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
  
  describe(".draw", function() {
    it("should call its parent's draw", function() {
      var thing = sapphire.view
        .extend()
        .draw(function(el) {
          el.append('div')
            .attr('class', 'thing')
            .text('foo');
        });

      var subthing = thing.extend()
        .extend()
        .draw(function(el) {
          el.append('div')
            .attr('class', 'subthing')
            .text('bar');
        });

      subthing().draw(el);
      expect(el.select('.thing').text()).to.equal('foo');
      expect(el.select('.subthing').text()).to.equal('bar');
    });
  });

  describe(".enter", function() {
    it("should not get called when the selection is empty", function() {
      var el = d3.select('i-do-not-exist');
      var enters = 0;

      var thing = sapphire.view.extend()
        .enter(function() {
          enters++;
        });

      thing().draw(el);
      expect(enters).to.equal(0);

      thing().draw(el);
      expect(enters).to.equal(0);

      thing().draw(el);
      expect(enters).to.equal(0);
    });

    it("should get called when the selection has no child nodes", function() {
      var enters = 0;

      var thing = sapphire.view.extend()
        .enter(function() {
          enters++;
        })
        .draw(function(el) {
          el.append('div')
            .attr('class', 'thing')
            .text('foo');
        });

      thing().draw(el);
      expect(enters).to.equal(1);

      thing().draw(el);
      expect(enters).to.equal(1);

      thing().draw(el);
      expect(enters).to.equal(1);
    });

    it("should call its parent's enter", function() {
      var thing = sapphire.view
        .extend()
        .enter(function(el) {
          el.append('div')
            .attr('class', 'thing')
            .text('foo');
        });

      var subthing = thing.extend()
        .extend()
        .enter(function(el) {
          el.append('div')
            .attr('class', 'subthing')
            .text('bar');
        });

      subthing().draw(el);
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

      thing().draw(el);
    });
  });
});
