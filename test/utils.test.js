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
});
