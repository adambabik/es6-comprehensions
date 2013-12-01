var esprima = require('esprima'), // harmony version, check out package.json
    recast  = require('recast'),
    builder = recast.builder,
    types   = recast.types,
    util    = require('util');

var parser = module.exports;

var recastOptions = {
  tabWidth : 2,
  esprima  : esprima
};

/**
 * Returns AST.
 * @param  {string} source
 * @return {object}
 */
function buildAST(source) {
  return recast.parse(source, recastOptions);
}

/**
 * Returns AST as a pretty JSON.
 * @param  {object} ast
 * @return {string}
 */
function prettyLog(ast) {
  return JSON.stringify(ast, null, recastOptions.tabWidth);
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
          builder.identifier('arr_' + idx),
          builder.identifier('i_' + idx),
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
        builder.identifier('i_' + idx),
        builder.literal(0)
      ),
      builder.variableDeclarator(
        builder.identifier(block.left.name),
        null
      ),
      builder.variableDeclarator(
        builder.identifier('arr_' + idx),
        block.right
      )
    ]),
    // test
    builder.binaryExpression(
      '<',
      builder.identifier('i_' + idx),
      builder.memberExpression(
        builder.identifier('arr_' + idx),
        builder.identifier('length'),
        false
      )
    ),
    // update
    builder.updateExpression(
      '++',
      builder.identifier('i_' + idx),
      false
    ),
    // body
    body
  );
}

/**
 * Parses source code and replaces array comprehensions
 * with a IIFE that returns an array.
 * @param  {string} fileData Input source code
 * @param  {object} options  Output formatting options
 * @return {string}
 */
parser.parse = function parse(fileData, options) {
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
    // http://wiki.ecmascript.org/doku.php?id=harmony:array_comprehensions
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
          // generator
          false,
          // expression
          false
        ),
        // arguments
        []
      )
    );

    this.replace(replacement);
  }); // end traverse

  return recast.print(ast, util._extend(recastOptions, options));
};
