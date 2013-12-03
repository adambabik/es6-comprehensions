var mocha  = require('mocha');
var expect = require('expect.js');

var transform = require('..').transform;
var parse     = require('..').parse;

describe('parser', function () {
  describe('transform', function () {
    it('array comprehension with identity transformation returns the same array', function () {
      var code = '[ for (x of [1,2,3]) x ]';
      expect(eval(transform(code))).to.eql([1,2,3]);
    });

    it('array comprehension with identity transformation and filter returns part of the array', function () {
      var code = '[ for (x of [1,2,3]) if (x > 2) x ]';
      expect(eval(transform(code))).to.eql([3]);
    });

    it('array comprehension with identity transformation and a couple of blocks', function () {
      var code = '[ for (x of [1,2,3]) for (y of [1,2]) x ]';
      expect(eval(transform(code))).to.eql([1,1,2,2,3,3]);
      code = '[ for (x of [1,2,3]) for (y of [1,2]) y ]';
      expect(eval(transform(code))).to.eql([1,2,1,2,1,2]);
    });

    it('array comprehension with identity transformation, filter and a couple of blocks', function () {
      var code = '[ for (x of [1,2,3]) for (y of [1,2]) if (y > 1 && x > 1) y ]';
      expect(eval(transform(code))).to.eql([2,2]);
    });

    it('array comprehension with custom transformation', function () {
      var code = 'function add(a, b) { return a + b }; [ for (x of [1,1,1]) for (y of [2]) add(x, y) ]';
      expect(eval(transform(code))).to.eql([3,3,3]);
    });

    it('array comprehension with custom transformation (inlined)', function () {
      var code = '[ for (x of [1,2]) for (y of [1,2]) x * y ];';
      expect(eval(transform(code))).to.eql([1,2,2,4]);
    });
  });
});
