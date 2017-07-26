program
  -> timer:* state:+ _
  {%
    (data, location, reject) => ({timers: data[0], states: data[1]})
  %}
timer
  -> _ "timer" __ [A-Z] {%
    (data) => data[3]
  %}
state
  -> stateLabel statement:* transition:+ {%
    (data) => ({state: data[0], statements: data[1], transitions: data[2]})
  %}
stateLabel
  -> _ integer ":" {% (data) => data[1] %}
statement
  -> _ signal _ "=" _ expression {%
    ([, signal, , , , expression]) => {
      if(typeof expression.right !== 'undefined') {
        expression.out = signal;
        return expression;
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
  -> signal {% (data) => data[0] %}
  | integer {% (data) => data[0] %}
  | "(" _ expression _ ")" {% (data) => data[2] %}
  | unaryOperand _ expression
    {%
      (data) => ({
        left: data[2],
        right: 0,
        operator: '!='
      })
    %}
  | expression _ binaryOperand _ expression
    {%
      (data) => ({
        left: data[0],
        right: data[4],
        operator: data[2][0] 
      })
    %}
signal
  -> [a-zA-Z_]:+ {% (data) => data[0].join('') %}
unaryOperand
  -> "!"
binaryOperand
  -> "+"
  | "-"
  | "*"
  | "/"
  | "%"
  | "<<"
  | ">>"
  | "<"
  | ">"
  | "<="
  | ">="
  | "!="
  | "==" {% () => ["="] %}
  | "**" {% () => ["^"] %}
  | "&&" {% () => ["AND"] %}
  | "||" {% () => ["OR"] %}
  | "^" {% () => ["XOR"] %}
integer
  -> [0-9]:+ {% (data) => +data[0].join('') %}
_
  -> [\s\r\n]:* {% () => null %}

__
  -> [\s\r\n]:+ {% () => null %}
