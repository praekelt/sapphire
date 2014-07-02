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

  describe(".hash", function() {
    it("should return 0 for empty strings", function() {
      expect(sapphire.utils.hash('')).to.equal(0);
    });

    it("should return an integer", function() {
      expect(sapphire.utils.hash('foo')).to.be.a.number;
    });
  });
});
