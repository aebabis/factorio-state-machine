@{%
const moo = require("moo");

const lexer = moo.compile({
  ws: {match: /[ \t\s\r\n]+/, lineBreaks: true},
  log_or: "||",
  log_and: "&&",
  log_not: "!",
  bit_or: "|",
  bit_and: "&",
  bit_xor: "^",
  bit_not: "~",
  bit_or_eq: "|=",
  bit_and_eq: "&=",
  bit_xor_eq: "^=",
  lshift: "<<",
  rshift: ">>",
  neq: "!=",
  eq: "==",
  jmp: "=>",
  leq: "<=",
  geq: ">=",
  exp: "**",
  lt: "<",
  gt: ">",
  add: "+",
  sub: "-",
  mul: "*",
  div: "/",
  mod: "%",
  assign: "=",
  labeltag: ":",
  parenthesis: ["(", ")"],
  integer: /-?(?:0|[1-9][0-9]*)/,
  id: {match: /[a-zA-Z_]+[a-zA-Z0-9_]*/,
       type: moo.keywords({timer: 'timer', reset: 'reset'}),
       value: x => x.startsWith("signal_") ? x.slice(7) : x,
      }
});

const unarystrip = ([operator, , left]) => ({left: left, operator: operator});
const idv = (data) => Array.isArray(data) ? idv(id(data)) : data.value;

%}

@lexer lexer

program
  -> timer:* state:+ _ {% ([timers, states]) => ({timers, states}) %}

timer
  -> _ "timer" __ [A-Z] {% (data) => data[3].value %}

state
  -> stateLabel statement:* transition:*
  {%
    ([state, statements, transitions]) => {
       // If last transition is a conditional jump or no jumps
       if(transitions.length === 0 || transitions.slice(-1)[0].condition != null) {
         // Add an unconditional jump to the top of the current state
         transitions = transitions.concat({
           goto: state
         });
       }
       return {
         state,
         statements,
         transitions
       };
     }
  %}

stateLabel
  -> _ %integer %labeltag {% (data) => +data[1].value %}

statement
  -> assignmentExpression {% id %}
  |  resetStatement {% id %}

transition
  -> _ basicExpression:? _ "=>" _ %integer {% ([, condition, , , , goto]) => Object.assign({goto: +goto}, condition !== null ? {condition} : null) %}

terminalExpression
  -> %id {% ([d]) => d.value %}
  |  %integer {% ([d]) => +d %}

primaryExpression
  -> "(" _ basicExpression _ ")" {% ([, , exp, , ]) => exp %}
  |  terminalExpression {% id %}

@{%
    const unaryOperation = ([op, , expr]) => static_reduce(unary_opmap[op](expr));
    const unary_opmap = {
        '!': (left)  => ({left: {left, operator: '+', right: 1}, operator: '=', right: 1}),
        '-': (right) => ({left: 0, operator: '-', right}),
        '~': (expr) => ({left: expr, operator: "XOR", right: expr})
    };

    const to_logic = (left) => ({left, operator: '>', right: 0});

    const binary_opmap = {
        "||": (left, right) => ({left: to_logic(left), right: to_logic(right), operator: 'OR' }),
        "&&": (left, right) => ({left: to_logic(left), right: to_logic(right), operator: 'AND'})
    }

    const binaryOperation = (expr) => (expr.op in binary_opmap) ? binary_opmap[expr.op](expr.l, expr.r) : expr;

    const binarystrip = ([left, , operator, , right]) => static_reduce(binaryOperation({left, operator, right}));

    const static_binary_opmap = {
        '^'  : (l, r) => (l **  r),
        '*'  : (l, r) => (l  *  r),
        '/'  : (l, r) => (l  /  r),
        '%'  : (l, r) => (l  %  r),
        '+'  : (l, r) => (l  +  r),
        '-'  : (l, r) => (l  -  r),
        '<<' : (l, r) => (l <<  r),
        '>>' : (l, r) => (l >>  r),
        '<'  : (l, r) => (l  <  r),
        '>'  : (l, r) => (l  >  r),
        '<=' : (l, r) => (l <=  r),
        '>=' : (l, r) => (l >=  r),
        '!=' : (l, r) => (l !=  r),
        '='  : (l, r) => (l === r),
        'AND': (l, r) => (l  &  r),
        'XOR': (l, r) => (l  ^  r),
        'OR' : (l, r) => (l  |  r)
    }
%}

unaryOperator -> ("!" | "-" | "~") {% idv %}
unaryExpression
  -> primaryExpression {% id %}
  |  unaryOperator _ unaryExpression {% unaryOperation %}

exponentiationOperator -> "**" {% () => "^" %}
exponentiationExpression
  -> unaryExpression {% id %}
  |  exponentiationExpression _ exponentiationOperator _ unaryExpression {% binarystrip %}

multiplicativeOperator -> ("*" | "/" | "%") {% idv %}
multiplicativeExpression
  -> exponentiationExpression {% id %}
  |  multiplicativeExpression _ multiplicativeOperator _ exponentiationExpression {% binarystrip %}

additiveOperator -> ("+" | "-") {% idv %}
additiveExpression
  -> multiplicativeExpression {% id %}
  |  additiveExpression _ additiveOperator _ multiplicativeExpression {% binarystrip %}

shiftOperator -> ("<<" | ">>") {% idv %}
shiftExpression
  -> additiveExpression  {% id %}
  |  shiftExpression _ shiftOperator _ additiveExpression {% binarystrip %}

relationalOperator -> ("<" | ">" | "<=" | ">=") {% idv %}
relationalExpression
  -> shiftExpression {% id %}
  |  relationalExpression _ relationalOperator _ shiftExpression {% binarystrip %}

equalityOperator -> "!=" {% idv %} | "==" {% () => "=" %}
equalityExpression
  -> relationalExpression {% id %}
  |  equalityExpression _ equalityOperator _ relationalExpression {% binarystrip %}

bitAndOperator -> "&" {% () => "AND" %}
bitAndExpression
  -> equalityExpression {% id %}
  |  bitAndExpression _ bitAndOperator _ equalityExpression {% binarystrip %}

bitXorOperator -> "^" {% () => "XOR" %}
bitXorExpression
  -> bitAndExpression {% id %}
  |  bitXorExpression _ bitXorOperator _ bitAndExpression {% binarystrip %}

bitOrOperator -> "|" {% () => "OR" %}
bitOrExpression
  -> bitXorExpression {% id %}
  |  bitOrExpression _ bitOrOperator _ bitXorExpression {% binarystrip %}

logicalAndOperator -> "&&" {% idv %}
logicalAndExpression
  -> bitOrExpression {% id %}
  |  logicalAndExpression _ logicalAndOperator _ bitOrExpression {% binarystrip %}

logicalOrOperator -> "||" {% idv %}
logicalOrExpression
  -> logicalAndExpression {% id %}
  |  logicalOrExpression _ logicalOrOperator _ logicalAndExpression {% binarystrip %}

basicExpression -> logicalOrExpression {% id %}

assignmentExpression
  -> lhsExpression _ opAssignmentOperator:? "=" _ basicExpression {% op_assign %}
  | basicExpression {% id %}

opAssignmentOperator
  -> ("*" | "/" | "%" | "+" | "-" | "<<" | ">>" | "&" | "^" | "|") {% idv %}

lhsExpression
  -> _ %id _ {% ([ , id, ]) => id.value %}

resetStatement
  -> _ "reset" __ [A-Z] {% ([ , , ,id]) => assign(id.value, 0) %}

@{%
    const static_reduce = (expression) => {
      if (typeof expression !== "object") {
        return expression;
      }
      if(typeof expression.left === "object"){
        expression.left = static_reduce(expression.left);
      }
      if(typeof expression.right === "object"){
        expression.right = static_reduce(expression.right );
      }
      if(typeof expression.left === typeof expression.right && typeof expression.left === "number"){
        expression = +static_binary_opmap[expression.operator](expression.left, expression.right);
      }
      return expression;
    }

    const op_assign = ([l, ,op, , ,r]) => {
      return (op == null) ? assign(l, r) : assign(l, {left:l, operator:op, right:r});
    }

    const assign = (signal, expression) => {
      if(typeof expression.right !== 'undefined') {
        return Object.assign({out: signal}, expression);
      } else {
        return {
          left: expression,
          right: 0,
          operator: '+',
          out: signal
        };
      }
    }
%}

_
  -> %ws:? {% () => null %}
__
  -> %ws {% () => null %}
