# es6-comprehensions

Compiles JavaScript array comprehensions (proposed in ES6) to ES5-compatible syntax. For instance:

```js
var squared = [ square(x) for (x of [1,2,3,4,5]) ]
```

compiles to:

```js
var squared = (function() {
  var result = [];

  for (var i_0 = 0, arr_0 = [1,2,3,4,5], len_0 = arr_0.length, x; i_0 < len_0; i_0++) {
    x = arr_0[i_0];
    result.push(square(x));
  }

  return result;
})();
```

For more information check out the following sources [http://wiki.ecmascript.org/doku.php?id=harmony:array_comprehensions](ECMAScript proposal and translation to the expression) and [http://tc39wiki.calculist.org/es6/array-comprehensions/](TC39wiki).

## Installation

```
$ npm install es6-comprehensions
```

## Support

Array comprehensions progressed to the Draft ECMAScript 6 Specification. It doesn't mean that there will be no changes or that array comprehensions will be included in the final ES6 Specification.

ES6 defines also [iterators](http://tc39wiki.calculist.org/es6/iterators/) that can be used together with [for-of loops](http://tc39wiki.calculist.org/es6/for-of/) that can be used in array comprehensions. This translator does **not** support iterators in `for-of` loops. It translates `for-of` loops to plain `for` loops. Thus, supports only plain JS arrays.

## TODO

* Provide support for other structures, not only plain JS arrays.
* Improve quality of the generated code.

## Development

1. Clone the repository.
2. Run `npm install`.
3. Do your changes.

Pull requests are highly appreciated.

## License

BSD
