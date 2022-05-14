@{%
const moo = require("moo");

const lexer = moo.compile({
  ws: {match: /[ \t\s\r\n]+/, lineBreaks: true},
  or: "||",
  and: "&&",
  neq: "!=",
  eq: "==",
  jmp: "=>",
  leq: "<=",
  geq: ">=",
  lshift: "<<",
  rshift: ">>",
  exp: "**",
  lt: "<",
  gt: ">",
  xor: "^",
  add: "+",
  sub: "-",
  not: "!",
  mul: "*",
  div: "/",
  mod: "%",
  assign: "=",
  label: ":",
  integer: /[0-9]+/,
  id: {match: /[a-zA-Z_]+/, type: moo.keywords({timer: 'timer', reset: 'reset'})},
});
%}

@lexer lexer

program
  -> timer:* state:+ _
  {%
    ([timers, states]) => ({timers, states})
  %}
timer
  -> _ "timer" __ [A-Z] {%
    (data) => data[3].value
  %}
state
  -> stateLabel statement:* transition:+ {%
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
  -> _ %id _ "=" _ expression {%
    ([, signal, , , , expression]) => {
      if(typeof expression.right !== 'undefined') {
        return Object.assign({}, expression, {
          out: signal.value
        });
      } else {
        return {
          left: expression,
          right: 0,
          operator: '+',
          out: signal.value
        };
      }
    }
  %}
  | _ "reset" __ [A-Z] {%
    (data) => ({
      left: 0,
      right: 0,
      operator: '+',
      out: data[3].value
    })
  %}
transition
  -> _ expression:? _ "=>" _ %integer {%
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
expression
  -> orExpression {% ([expression]) => expression %}
orExpression -> orExpression _ orOperand _ andExpression {% ([left, , operator, , right]) => ({left, operator, right}) %}
  | andExpression {% ([match]) => match %}
andExpression -> andExpression _ andOperand _ xorExpression {% ([left, , operator, , right]) => ({left, operator, right}) %}
  | xorExpression {% ([match]) => match %}
xorExpression -> xorExpression _ xorOperand _ equalityExpression {% ([left, , operator, , right]) => ({left, operator, right}) %}
  | equalityExpression {% ([match]) => match %}
equalityExpression -> equalityExpression _ equalityOperand _ compareExpression {% ([left, , operator, , right]) => ({left, operator, right}) %}
  | compareExpression {% ([match]) => match %}
compareExpression -> compareExpression _ compareOperand _ shiftExpression {% ([left, , operator, , right]) => ({left, operator, right}) %}
  | shiftExpression {% ([match]) => match %}
shiftExpression -> shiftExpression _ shiftOperand _ addExpression {% ([left, , operator, , right]) => ({left, operator, right}) %}
  | addExpression {% ([match]) => match %}
addExpression -> addExpression _ addOperand _ multExpression {% ([left, , operator, , right]) => ({left, operator, right}) %}
  | multExpression {% ([match]) => match %}
multExpression -> multExpression _ multOperand _ expExpression {% ([left, , operator, , right]) => ({left, operator, right}) %}
  | expExpression {% ([match]) => match %}
expExpression -> unaryExpression _ expOperand _ expExpression {% ([left, , operator, , right]) => ({left, operator, right}) %}
  | unaryExpression {% ([match]) => match %}
unaryExpression -> unaryOperand _ expression {% ([, , left]) => ({left: {left, operator: '+', right: 1}, operator: '=', right: 1}) %}
  | groupedExpression {% ([match]) => match %}
groupedExpression -> "(" _ expression _ ")" {% (data) => data[2] %}
  | terminalExpression {% ([match]) => match %}
terminalExpression
  -> %id{% (data) => data[0].value %}
  | %sub %integer {% (data) => -data[1].value %}
  | %integer {% (data) => +data[0].value %}
unaryOperand
  -> "!" {% ([sym]) => sym %}
orOperand
  -> "||" {% () => "OR" %}
andOperand
  -> "&&" {% () => "AND" %}
xorOperand
  -> "^" {% () => "XOR" %}
equalityOperand
  -> "!=" {% ([sym]) => sym.value %}
  | "==" {% () => "=" %}
compareOperand
  -> "<" {% ([sym]) => sym.value %}
  | ">" {% ([sym]) => sym.value %}
  | "<=" {% ([sym]) => sym.value %}
  | ">=" {% ([sym]) => sym.value %}
shiftOperand
  -> "<<" {% ([sym]) => sym.value %}
  | ">>" {% ([sym]) => sym.value %}
addOperand
  -> "+" {% ([sym]) => sym.value %}
  | "-" {% ([sym]) => sym.value %}
multOperand
  -> "*" {% ([sym]) => sym.value %}
  | "/" {% ([sym]) => sym.value %}
  | "%" {% ([sym]) => sym.value %}
expOperand
  -> "**" {% () => "^" %}
_
  -> %ws:? {% () => null %}
__
  -> %ws {% () => null %}
