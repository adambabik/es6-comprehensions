# es6-comprehensions

Compiles JavaScript array comprehensions (proposed in ES6) to ES5-compatible syntax. For instance:

```js
var squared = [ for (x of [1,2,3,4,5]) if (x > 2) x * x ];
```

compiles to:

```js
var squared = (function() {
  var result = [];

  for (var $_i0 = 0, $_arr0 = [1,2,3,4,5], $_len0 = $_arr0.length, x; $_i0 < $_len0; $_i0++) {
    x = $_arr0[$_i0];

    if (x > 2) {
      result.push(x * x);
    }
  }

  return result;
})();
```

I'm glad to inform you that **es6-comprehensions** is now a part of [es-next](https://github.com/square/esnext) project.

For more information check out [the current draft for ECMAScript 6](http://people.mozilla.org/~jorendorff/es6-draft.html#sec-array-comprehension).

Please notice that the syntax has changed and many resources is still using the old one.

## Installation

```
$ npm install es6-comprehensions [--save]
```

## Support

Array comprehensions progressed to the Draft ECMAScript 6 Specification. It doesn't mean that there will be no changes or that array comprehensions will be included in the final ES6 Specification.

ES6 defines also [iterators](http://tc39wiki.calculist.org/es6/iterators/) that can be used together with [for-of loops](http://tc39wiki.calculist.org/es6/for-of/) that can be used in array comprehensions. This translator does **not** support iterators in `for-of` loops. It translates `for-of` loops to plain `for` loops. Thus, it supports only plain JS arrays.

## Todo

* Consider replacing plain `for` loop with `forEach` method. It will result in more compact code,
* ~~Consider migration to escodegen.~~ Removed in order to follow up [esnext's](https://github.com/square/esnext) dependencies.

## Development

1. Clone the repository.
2. Run `npm install`.
3. Do your changes.

Pull requests are highly appreciated.

## Changelog

### v0.2.3

* Binding current scope to the generated function expression. This allows one to use `this` in an array comprehension. An example can be found in [a test file](https://github.com/dreame4/es6-comprehensions/blob/master/test/parser_test.js#L48). (Thanks [@vslinko](https://github.com/vslinko) for PR.)

### v0.2.2

* Using [ast-util](https://github.com/square/ast-util) to generate safe temporary variables.

### v0.2.1

* Replaced ComprehensionExpression with CallExpression instead of ExpressionStatement.

### v0.2.0

* Changed API to conform to [esnext's](https://github.com/square/esnext) requirements.

## License

BSD
