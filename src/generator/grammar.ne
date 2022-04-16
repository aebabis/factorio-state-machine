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
  label: ":",
  parenthesis: ["(", ")"],
  integer: /-?(?:0|[1-9][0-9]*)/,
  id: {match: /[a-zA-Z_]+/, type: moo.keywords({timer: 'timer', reset: 'reset'})},
});

const unarystrip = ([operator, , left]) => ({left: left, operator: operator});
const binarystrip = ([left, , operator, , right]) => ({left:left, operator: operator, right:right});
const idv = (data) => Array.isArray(data) ? idv(id(data)) : data.value;

%}

@lexer lexer

program
  -> timer:* state:+ _
  {%
    ([timers, states]) => ({timers, states})
  %}

timer
  -> _ "timer" __ [A-Z]
  {%
    (data) => data[3].value
  %}

state
  -> stateLabel statement:* transition:+
  {%
    ([state, statements, transitions]) => {
       // If last transition is a conditional jump
       if(transitions.slice(-1)[0].condition != null) {
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
  -> _ %integer %label {% (data) => +data[1].value %}

statement
  -> assignmentExpression {% id %}
  |  resetStatement {% id %}

transition
  -> _ basicExpression:? _ "=>" _ %integer {%
    ([, condition, , , , goto]) => {
      if(condition != null) {
        return {
          condition: condition,
          goto: +goto.value
        };
      } else {
        return {
          goto: +goto.value
        };
      }
    }
  %}

terminalExpression
  -> %id {% ([d]) => d.value %}
  |  %integer {% ([d]) => +d.value %}

primaryExpression
  -> "(" _ basicExpression _ ")" {% ([, , exp, , ]) => exp %}
  |  terminalExpression {% id %}

@{%
    const unaryOperation = ([op, , expr]) => unary_opmap[op](expr, typeof expr === 'number');
    const unary_opmap = {
        '!': (left)  => ({left: {left, operator: '+', right: 1}, operator: '=', right: 1}),
        '-': (right) => ({left: 0, operator: '-', right})
    }

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

unaryOperator -> ("!" | "-") {% idv %}
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

andOperator -> "&" {% () => "AND" %}
andExpression
  -> equalityExpression {% id %}
  |  andExpression _ andOperator _ equalityExpression {% binarystrip %}

xorOperator -> "^" {% () => "XOR" %}
xorExpression
  -> andExpression {% id %}
  |  xorExpression _ xorOperator _ andExpression {% binarystrip %}

orOperator -> "|" {% () => "OR" %}
orExpression
  -> xorExpression {% id %}
  |  orExpression _ orOperator _ xorExpression {% binarystrip %}


@{%
    const staticBinaryOperation = ([left, , op, , right]) => static_binary_opmap[op](+left.value, +right.value);

    const static_reduce = (expression) => {
      console.log("static_reduce: ", expression);
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
      console.log("preassign", "signal: ", signal, "exp: ", expression);
      expression = static_reduce(expression);
      //console.log("assign", "signal: ", signal, "exp: ", expression);


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


basicExpression -> orExpression {% id %}

assignmentExpression
  -> lhsExpression _ opAssignmentOperator:? "=" _ assignmentExpression {% op_assign %}
  | basicExpression {% id %}

opAssignmentOperator
  -> ("*" | "/" | "%" | "+" | "-" | "<<" | ">>" | "&" | "^" | "|") {% idv %}

lhsExpression
  -> _ %id _ {% ([ , id, ]) => id.value %}

resetStatement
  -> _ "reset" __ [A-Z] {% ([ , , ,id]) => assign(id.value, 0) %}
_
  -> %ws:? {% () => null %}
__
  -> %ws {% () => null %}
