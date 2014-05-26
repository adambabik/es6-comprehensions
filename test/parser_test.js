'use strict';

var expect = require('expect.js');

var compile = require('..').compile;

describe('parser', function () {
  describe('transform', function () {
    /*jshint -W061 */
    it('array comprehension with identity transformation returns the same array', function () {
      var code = '[ for (x of [1,2,3]) x ]';
      expect(eval(compile(code))).to.eql([1,2,3]);
    });

    it('array comprehension with identity transformation and filter returns part of the array', function () {
      var code = '[ for (x of [1,2,3]) if (x > 2) x ]';
      expect(eval(compile(code))).to.eql([3]);
    });

    it('array comprehension with identity transformation and a couple of blocks', function () {
      var code = '[ for (x of [1,2,3]) for (y of [1,2]) x ]';
      expect(eval(compile(code))).to.eql([1,1,2,2,3,3]);
      code = '[ for (x of [1,2,3]) for (y of [1,2]) y ]';
      expect(eval(compile(code))).to.eql([1,2,1,2,1,2]);
    });

    it('array comprehension with identity transformation, filter and a couple of blocks', function () {
      var code = '[ for (x of [1,2,3]) for (y of [1,2]) if (y > 1 && x > 1) y ]';
      expect(eval(compile(code))).to.eql([2,2]);
    });

    it('array comprehension with custom transformation', function () {
      var code = 'function add(a, b) { return a + b }; [ for (x of [1,1,1]) for (y of [2]) add(x, y) ]';
      expect(eval(compile(code))).to.eql([3,3,3]);
    });

    it('array comprehension with custom transformation (inlined)', function () {
      var code = '[ for (x of [1,2]) for (y of [1,2]) x * y ];';
      expect(eval(compile(code))).to.eql([1,2,2,4]);
    });

    it('array comprehension with this expression', function () {
      this.arr1 = [1, 2];
      this.arr2 = [1, 2];
      this.add = function(a, b) {
        return a + b;
      };
      var code = '[ for (x of this.arr1) for (y of this.arr2) this.add(x, y) ];';
      expect(eval(compile(code))).to.eql([2,3,3,4]);
    });
  });
});
