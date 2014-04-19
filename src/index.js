"use strict";

var esprima = require('esprima') // harmony version, check out package.json
  , recast  = require('recast')
  , types   = recast.types
  , b       = types.builders
  , nt      = types.namedTypes
  , util    = require('util');

/**
 * Create pseudo private variable.
 *
 * @param  {[type]} name [description]
 * @return {[type]}      [description]
 */

function createPrivateId(name) {
  return '$_' + name;
}

/**
 * Replaces a comprehension block `for...of` loop
 * with a regular `for` loop.
 *
 * @param  {Object} block      Comprehension block
 * @param  {Number} idx        Block index
 * @param  {Object} forBody    Body of `for` loop
 * @return {Object}            ForStatement
 */

function replaceComprehensionBlock(block, idx, forBody) {
  var blockBody = b.blockStatement([
    b.expressionStatement(
      b.assignmentExpression(
        '=',
        b.identifier(block.left.name),
        b.memberExpression(
          b.identifier(createPrivateId('arr' + idx)),
          b.identifier(createPrivateId('i' + idx)),
          true
        )
      )
    )
  ]);

  if (forBody) {
    blockBody.body.push(forBody);
  }

  var varDeclaration =
    b.variableDeclaration('var', [
      b.variableDeclarator(
        b.identifier(createPrivateId('i' + idx)),
        b.literal(0)
      ),
      b.variableDeclarator(
        b.identifier(createPrivateId('arr' + idx)),
        block.right
      ),
      b.variableDeclarator(
        b.identifier(createPrivateId('len' + idx)),
        b.memberExpression(
          b.identifier(createPrivateId('arr' + idx)),
          b.identifier('length'),
          false
        )
      ),
      b.variableDeclarator(
        b.identifier(block.left.name),
        null
      ),
    ]);

  var testExpression =
    b.binaryExpression(
      '<',
      b.identifier(createPrivateId('i' + idx)),
      b.identifier(createPrivateId('len' + idx))
    );

  var updateExpression =
    b.updateExpression(
      '++',
      b.identifier(createPrivateId('i' + idx)),
      false
    );

  return b.forStatement(
    // initialization
    varDeclaration,
    // test
    testExpression,
    // update
    updateExpression,
    // body
    blockBody
  );
}

/**
 * Create `arr.push(arg)` expression.
 *
 * @param  {Object} node       Argument of `push` method
 * @param  {Object} identifier Identifier on which call `push`
 * @return {Object}            Expression Statement
 */

function createPushExpression(node, identifier) {
  var resultMemberExpression = b.memberExpression(
    identifier,
    b.identifier('push'),
    false
  );

  return b.expressionStatement(
    b.callExpression(
      resultMemberExpression,
      [node.body]
    )
  );
}

function visitNode(node) {
  if (!nt.ComprehensionExpression.check(node)) {
    return;
  }

  var resultId = b.identifier('result');
  var pushExpr = createPushExpression(node, resultId);

  var body = node.filter
    ? b.ifStatement(
        // test
        node.filter,
        // consequent
        b.blockStatement([pushExpr])
      )
    : pushExpr;

  // Explanation based on:
  // http://people.mozilla.org/~jorendorff/es6-draft.html#sec-array-comprehension
  //
  // Array comprehension consists of body, blocks and filter.
  // Body is an actual transformation performed on items.
  // Blocks are for...of loops which takes items from arrays/iterator.
  // Filter is the last part of the whole expression and selectes
  // only items that match the conditions.
  //
  // All blocks (for...of loops) are transformed into nested for loops.
  // The filter is checked in the innermost function.
  var lastFor = null;
  var blocks = node.blocks.slice().reverse();
  blocks.forEach(function (block, idx) {
    lastFor = replaceComprehensionBlock(
      block,
      blocks.length - 1 - idx,
      lastFor || body
    );
  });

  // The whole array comprehension is replaced with IIFE
  // that returns array.
  var replacement = b.expressionStatement(
    b.callExpression(
      // function expression
      b.functionExpression(
        // id
        null,
        // params
        [],
        // body
        b.blockStatement([
          b.variableDeclaration(
            'var', [
              b.variableDeclarator(
                resultId,
                b.arrayExpression([])
              ),
            ]
          ),
          lastFor,
          b.returnStatement(
            resultId
          )
        ]),
        // is a generator
        false,
        // is an expression
        false
      ),
      // arguments
      []
    )
  );

  this.replace(replacement);
}

/**
 * Transform an ES6 Esprima AST to the ES5 equivalent
 * by replacing ComprehensionExpression.
 *
 * @param  {Object} ast Esprima AST to transform
 * @return {Object}     Transformed AST
 */

function transform(ast) {
  return types.traverse(ast, visitNode);
}

/**
 * Transform JavaScript ES6 code to ES5 compliant one
 * by replacing Array Comprehensions with `for` loops.
 *
 * @param  {String} source        Source code
 * @param  {Object} [mapOpts={}]  Source map options
 * @return {String}
 */

function compile(source, mapOpts) {
  mapOpts || (mapOpts = {});

  var recastOptions = {
    esprima: esprima, // using harmony branch
    sourceFileName: mapOpts.sourceFileName,
    sourceMapName: mapOpts.sourceMapName,
    tabWidth: require('./utils').guessTabWidth(source)
  };

  var ast = recast.parse(source, recastOptions);
  return recast.print(transform(ast), recastOptions).code.replace(/;;/g, ';');
}

/**
 * Export public API.
 */

module.exports.compile = compile;
module.exports.transform = transform;
