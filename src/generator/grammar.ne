program
  -> timer:* state:+ _
  {%
    ([timers, states]) => ({timers, states})
  %}
timer
  -> _ "timer" __ [A-Z] {%
    (data) => data[3]
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
  -> _ integer ":" {% (data) => data[1] %}
statement
  -> _ signal _ "=" _ expression {%
    ([, signal, , , , expression]) => {
      if(typeof expression.right !== 'undefined') {
        return Object.assign({}, expression, {
          out: signal
        });
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
  | _ "reset" __ [A-Z] {%
    (data) => ({
      left: 0,
      right: 0,
      operator: '+',
      out: data[3]
    })
  %}
transition
  -> _ expression:? _ "=>" _ integer {%
    ([, condition, , , , goto]) => {
      if(condition != null) {
        return {
          condition,
          goto
        };
      } else {
        return {
          goto
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
unaryExpression -> unaryOperand _ expression {% ([operator, , left]) => ({left, operator}) %}
  | groupedExpression {% ([match]) => match %}
groupedExpression -> "(" _ expression _ ")" {% (data) => data[2] %}
  | terminalExpression {% ([match]) => match %}
terminalExpression
  -> signal {% (data) => data[0] %}
  | integer {% (data) => data[0] %}
signal
  -> [a-zA-Z_]:+ {% (data) => data[0].join('') %}
unaryOperand
  -> "!" {% ([sym]) => sym %}
orOperand
  -> "||" {% () => "OR" %}
andOperand
  -> "&&" {% () => "AND" %}
xorOperand
  -> "^" {% () => "XOR" %}
equalityOperand
  -> "!=" {% ([sym]) => sym %}
  | "==" {% () => "=" %}
compareOperand
  -> "<" {% ([sym]) => sym %}
  | ">" {% ([sym]) => sym %}
  | "<=" {% ([sym]) => sym %}
  | ">=" {% ([sym]) => sym %}
shiftOperand
  -> "<<" {% ([sym]) => sym %}
  | ">>" {% ([sym]) => sym %}
addOperand
  -> "+" {% ([sym]) => sym %}
  | "-" {% ([sym]) => sym %}
multOperand
  -> "*" {% ([sym]) => sym %}
  | "/" {% ([sym]) => sym %}
  | "%" {% ([sym]) => sym %}
expOperand
  -> "**" {% () => "^" %}
integer
  -> [0-9]:+ {% (data) => +data[0].join('') %}
_
  -> [\s\r\n]:* {% () => null %}
__
  -> [\s\r\n]:+ {% () => null %}
