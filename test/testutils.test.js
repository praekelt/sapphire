describe("sapphire.testutils", function() {
  describe("pick", function() {
    it("should pick out the given properties", function() {
      var data = [{
        foo: 1,
        bar: 2,
        baz: 3
      }, {
        foo: 3,
        bar: 4,
        baz: 5
      }];

      expect(sapphire.testutils.pick(data, ['foo', 'bar'])).to.deep.equal([{
        foo: 1,
        bar: 2,
      }, {
        foo: 3,
        bar: 4,
      }]);
    });

    it("should ignore non-existent properties for each datum", function() {
      var data = [{
        foo: 1,
        bar: 2,
        baz: 3
      }, {
        foo: 3,
        baz: 5
      }];

      expect(sapphire.testutils.pick(data, ['foo', 'bar'])).to.deep.equal([{
        foo: 1,
        bar: 2,
      }, {
        foo: 3
      }]);
    });
  });
});
