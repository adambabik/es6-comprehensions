'use strict';

var esprima = require('esprima') // harmony version, check out package.json
  , recast  = require('recast')
  , astUtil = require('ast-util')
  , types   = recast.types
  , b       = types.builders
  , nt      = types.namedTypes
  , NodePath = types.NodePath
  , util    = require('util');

/**
 * Replaces a comprehension block `for...of` loop
 * with a regular `for` loop.
 *
 * @param  {Object} scope      IIFE scope
 * @param  {Object} block      Comprehension block
 * @param  {Number} idx        Block index
 * @param  {Object} forBody    Body of `for` loop
 * @return {Object}            ForStatement
 */

function replaceComprehensionBlock(scope, block, idx, forBody) {
  var arrIdentifier = astUtil.uniqueIdentifier(scope, 'arr');
  astUtil.injectVariable(scope, arrIdentifier);

  var iIdentifier = astUtil.uniqueIdentifier(scope, 'i');
  astUtil.injectVariable(scope, iIdentifier);

  var lenIdentifier = astUtil.uniqueIdentifier(scope, 'len');
  astUtil.injectVariable(scope, lenIdentifier);

  var blockBody = b.blockStatement([
    b.expressionStatement(
      b.assignmentExpression(
        '=',
        b.identifier(block.left.name),
        b.memberExpression(
          arrIdentifier,
          iIdentifier,
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
        iIdentifier,
        b.literal(0)
      ),
      b.variableDeclarator(
        arrIdentifier,
        block.right
      ),
      b.variableDeclarator(
        lenIdentifier,
        b.memberExpression(
          arrIdentifier,
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
      iIdentifier,
      lenIdentifier
    );

  var updateExpression =
    b.updateExpression(
      '++',
      iIdentifier,
      false
    );

  return b.forStatement(
    varDeclaration,
    testExpression,
    updateExpression,
    blockBody
  );
}

/**
 * Create `arr.push(arg)` expression.
 *
 * @param  {Object} body       Argument of `push` method
 * @param  {Object} identifier Identifier on which call `push`
 * @return {Object}            Expression Statement
 */

function createPushExpression(body, identifier) {
  return b.expressionStatement(
    b.callExpression(
      b.memberExpression(
        identifier,
        b.identifier('push'),
        false
      ),
      [body]
    )
  );
}

function visitNode(node) {
  if (!nt.ComprehensionExpression.check(node)) {
    return;
  }

  var self = this;

  var iife = b.functionExpression(
    null,  // id
    [],    // params
    b.blockStatement([]),  // body
    false, // is a generator
    false  // is an expression
  );
  var iifeScope = new NodePath(iife, this).scope;

  var resultIdentifier = astUtil.uniqueIdentifier(self.scope, 'result');
  var pushResultExpr = createPushExpression(node.body, resultIdentifier);

  var body =
    node.filter
      ? b.ifStatement(
          node.filter,  // test
          b.blockStatement([pushResultExpr])  // consequent
        )
      : pushResultExpr;

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
      iifeScope,
      block,
      blocks.length - 1 - idx,
      lastFor || body
    );
  });

  // Update function body.
  iife.body = b.blockStatement([
    b.variableDeclaration(
      'var', [
        b.variableDeclarator(
          resultIdentifier,
          b.arrayExpression([])
        ),
      ]
    ),
    lastFor,
    b.returnStatement(
      resultIdentifier
    )
  ]);

  // The whole array comprehension is replaced with IIFE
  // that returns array.
  this.replace(b.callExpression(
    b.callExpression(
      b.memberExpression(
        iife,  // function expression
        b.identifier('bind'),
        false
      ),
      [b.thisExpression()]
    ),
    []     // arguments
  ));
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
  return recast.print(transform(ast), recastOptions).code;
}

/**
 * Export public API.
 */

module.exports.compile = compile;
module.exports.transform = transform;
