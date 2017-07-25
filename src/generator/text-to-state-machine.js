import peg from 'pegjs';

const parser = peg.generate(`
program
  = timers:timers states:states { return {timers: timers, states: states}; }

timers
  = timer*

timer
  = "timer" _ signal:[A-Z] { return signal; }

states
  = state*

state
  = _ stateLabel:stateLabel statements:statements transitions:transitions { return {state: stateLabel, statements:statements, transitions:transitions}; }

stateLabel
  = stateLabel:[0-9]+ ":" { return +stateLabel.join(''); }

statements
  = statement*

statement
  = _ signal "=" expression

transitions
  = transition+

transition
  = _ expression? _ "=>" _ stateLabel:[0-9]+

expression
  = signal:signal { return signal; }
  / literal:[0-9]+ { return +literal.join(''); }
  / "(" _ expression:expression _ ")" { return expression; }
  / unaryOperand _ left:expression
    {
        return {
            left: left,
            right: 0,
            operator: '!='
        };
    }
  / left:expression _ operator:binaryOperand _ right:expression
    {
        return {
            left: left,
            right: right,
            operator: operator
        };
    }

signal
  = signal:[a-zA-Z_]+ { return signal.join(''); }

unaryOperand
  = "!" { return "!"; }

binaryOperand
  = "+" { return "+"; }
  / "-" { return "-"; }
  / "*" { return "-"; }
  / "/" { return "/"; }
  / "%" { return "%"; }
  / "<<" { return "<<"; }
  / ">>" { return ">>"; }
  / "<" { return "<"; }
  / ">" { return ">"; }
  / "<=" { return "<="; }
  / ">=" { return ">="; }
  / "!=" { return "!="; }
  / "==" { return "="; }
  / "**" { return "^"; }
  / "&&" { return "AND"; }
  / "||" { return "OR"; }
  / "^" { return "XOR"; }

_
  = [ \\t\\r\\n]*
`);

const removeComments = (lines) => {
    return lines
        // https://stackoverflow.com/a/15123777/2993478
        .replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
};

export default (code) => {
    const lines = removeComments(code);
    const parseTree = parser.parse(lines);

    return parseTree;
    // TODO: Handle unreachable transitions again
    // TODO: Handle duplicate states again
    // TODO: Check non-existant states again
};
