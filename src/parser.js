"use strict";

var esprima = require('esprima'), // harmony version, check out package.json
    recast  = require('recast'),
    builder = recast.builder,
    types   = recast.types,
    util    = require('util');

var parser = module.exports;

var recastOptions = {
  esprima : esprima
};

/* @type function */
function createPrivId(name) {
  return '$$' + name;
}

/**
 * Returns AST.
 * @param  {string} source
 * @return {object}
 */
function buildAST(source) {
  return recast.parse(source, recastOptions);
}

/**
 * Replaces a comprehension block (for...of loop)
 * with a regular for loop.
 * @param  {object} block      Comprehension block
 * @param  {number} idx        Block index
 * @param  {object} insertNode Body of for loop
 * @return {object}
 */
function replaceComprehensionBlock(block, idx, insertNode) {
  var body = builder.blockStatement([
    builder.expressionStatement(
      builder.assignmentExpression(
        '=',
        builder.identifier(block.left.name),
        builder.memberExpression(
          builder.identifier(createPrivId('arr' + idx)),
          builder.identifier(createPrivId('i' + idx)),
          true
        )
      )
    )
  ]);

  if (insertNode) {
    body.body.push(insertNode);
  }

  return builder.forStatement(
    // init
    builder.variableDeclaration('var', [
      builder.variableDeclarator(
        builder.identifier(createPrivId('i' + idx)),
        builder.literal(0)
      ),
      builder.variableDeclarator(
        builder.identifier(createPrivId('arr' + idx)),
        block.right
      ),
      builder.variableDeclarator(
        builder.identifier(createPrivId('len' + idx)),
        builder.memberExpression(
          builder.identifier(createPrivId('arr' + idx)),
          builder.identifier('length'),
          false
        )
      ),
      builder.variableDeclarator(
        builder.identifier(block.left.name),
        null
      ),
    ]),
    // test
    builder.binaryExpression(
      '<',
      builder.identifier(createPrivId('i' + idx)),
      builder.identifier(createPrivId('len' + idx))
    ),
    // update
    builder.updateExpression(
      '++',
      builder.identifier(createPrivId('i' + idx)),
      false
    ),
    // body
    body
  );
}

/**
 * Parses source code and returns transformed AST.
 * @param  {string} fileData Input source code
 * @return {object}          AST
 */
parser.parse = function parse(fileData) {
  var ast = buildAST(fileData);
  var tmpArray = builder.identifier('result');

  types.traverse(ast, function (child) {
    if (!types.namedTypes.ComprehensionExpression.check(child)) {
      return;
    }

    var push =
      builder.expressionStatement(
        builder.callExpression(
          // callee
          builder.memberExpression(
            tmpArray,
            builder.identifier('push'),
            false
          ),
          // arguments
          [child.body]
        )
      );

    var body = child.filter
      ? builder.ifStatement(
          // test
          child.filter,
          // consequent
          builder.blockStatement([push])
        )
      : push;

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
    var blocks = child.blocks.slice().reverse();
    blocks.forEach(function (block, idx) {
      lastFor = replaceComprehensionBlock(
        block,
        blocks.length - 1 - idx,
        lastFor || body
      );
    });

    // The whole array comprehension is replaced with IIFE
    // that returns array.
    var replacement = builder.expressionStatement(
      builder.callExpression(
        // function expression
        builder.functionExpression(
          // id
          null,
          // params
          [],
          // body
          builder.blockStatement([
            builder.variableDeclaration(
              'var', [
                builder.variableDeclarator(
                  tmpArray,
                  builder.arrayExpression([])
                ),
              ]
            ),
            lastFor,
            builder.returnStatement(
              tmpArray
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
  }); // end traverse

  return ast;
};

var guessTabWidth = require('./utils').guessTabWidth;

/**
 * Parses source code and replaces array comprehensions
 * with a IIFE that returns an array.
 * @param  {string} fileData   Input source code
 * @param  {object} [options]  Output formatting options
 * @return {string}
 */
parser.transform = function transform(fileData, options) {
  options || (options = {});
  options.tabWidth = guessTabWidth(fileData);

  var code = recast.print(
    parser.parse(fileData),
    util._extend(recastOptions, options)
  );

  // Sometimes it's possible to double semicolons.
  // Fix it.
  return code.replace(/;;/g, ';');
};
