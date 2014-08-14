describe("sapphire.utils", function() {
  describe(".access", function() {
    it("should access the property if possible", function() {
      expect(sapphire.utils.access({foo: 3}, 'foo')).to.equal(3);
    });

    it("should use the default if the key does not exist", function() {
      expect(sapphire.utils.access({}, 'foo')).to.be.null;
      expect(sapphire.utils.access({}, 'foo', 3)).to.equal(3);
    });

    it("should use the default if the value is undefined", function() {
      expect(sapphire.utils.access({foo: undefined}, 'foo')).to.be.null;
      expect(sapphire.utils.access({foo: undefined}, 'foo', 3)).to.equal(3);
    });

    it("should use the default if the datum is not an object", function() {
      expect(sapphire.utils.access(2, 'foo')).to.be.null;
      expect(sapphire.utils.access(2, 'foo', 3)).to.equal(3);
    });
  });

  describe(".ensure", function() {
    it("should use the value if possible", function() {
      expect(sapphire.utils.ensure(2, 3)).to.equal(2);
    });

    it("should use the default if the value is null", function() {
      expect(sapphire.utils.ensure(null, 3)).to.equal(3);
    });

    it("should use the default if the value is undefined", function() {
      expect(sapphire.utils.ensure(undefined, 3)).to.equal(3);
    });
  });

  describe(".translate", function() {
    it("should return a translation string", function() {
      expect(sapphire.utils.translate(3.23, 23.23))
        .to.equal('translate(3.23, 23.23)');
    });
  });

  describe(".ensureEl", function() {
    it("should wrap the element in a d3 selection if it isn't already", function() {
      var el = sapphire.utils.ensureEl('body');
      expect(el.node()).to.equal(d3.select('body').node());
    });

    it("should return the selection if a selection was given", function() {
      var el = d3.select('body');
      expect(sapphire.utils.ensureEl(el)).to.equal(el);
    });
  });

  describe(".date", function() {
    it("should return a new date", function() {
      var d = new Date(2014, 2, 2);
      expect(+sapphire.utils.date(+d)).to.equal(+d);
      expect(sapphire.utils.date(+d)).to.be.an.instanceof(Date);
    });
  });

  describe(".box", function() {
    it("should contain its width", function() {
      var box = sapphire.utils.box()
        .width(200);

      expect(box()).to.have.property('width', 200);
    });

    it("should contain its margin", function() {
      var margin = {
        top: 1,
        left: 2,
        right: 3,
        bottom: 4
      };

      var box = sapphire.utils.box()
        .margin(margin);

      expect(box()).to.have.property('margin', margin);
    });

    it("should contain its height", function() {
      var box = sapphire.utils.box()
        .height(200);

      expect(box()).to.have.property('height', 200);
    });

    it("should calculate its inner width", function() {
      var box = sapphire.utils.box()
        .width(200)
        .margin({
          top: 0,
          left: 2,
          right: 3,
          bottom: 0
        });

      expect(box().innerWidth).to.equal(195);
    });

    it("should calculate its inner height", function() {
      var box = sapphire.utils.box()
        .height(200)
        .margin({
          top: 2,
          left: 0,
          right: 0,
          bottom: 3
        });

      expect(box().innerHeight).to.equal(195);
    });
  });

  describe(".px", function() {
    it("should wrap number accessors to return pixel values", function() {
      expect(sapphire.utils.px(123)()).to.equal('123px');
      expect(sapphire.utils.px(function() { return 123; })()).to.equal('123px');
    });

    it("should maintain the arguments passed to the accessor", function(done) {
      var ctx = {};

      sapphire.utils.px(function(d, i) {
        expect(this).to.equal(ctx);
        expect(d).to.equal(1);
        expect(i).to.equal(2);
        done();
      }).call(ctx, 1, 2);
    });
  });
});
