program
  -> timer:* state:+
  {%
    (data, location, reject) => ({timers: data[0], states: data[1]})
  %}
timer
  -> "timer" __ [A-Z] _ {%
    (data) => data[2]
  %}
state
  -> stateLabel statement:* transition:+ {%
    (data) => ({state: data[0], statements: data[1], transitions: data[2]})
  %}
stateLabel
  -> integer ":" {% (data) => data[0] %}
statement
  -> _ signal _ "=" _ expression _ {%
    (data) => ({
      left: data[5],
      right: 0,
      operator: '+',
      out: data[1]
    })
  %}
  | _ "reset" __ [A-Z] _ {%
    (data) => ({
      left: 0,
      right: 0,
      operator: '+',
      out: data[3]
    })
  %}
transition
  -> _ expression:? _ "=>" _ integer _ {%
    (data) => ({
      condition: data[1],
      goto: data[5]
    })
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
