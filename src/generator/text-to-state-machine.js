const STATE_LABEL = 'STATE_LABEL';
const STATEMENTS = 'STATEMENTS';
const TRANSITIONS = 'TRANSITIONS';

import jsep from 'jsep';

// TODO: Timers. Warnings if timers are also written to

const removeComments = (lines) => {
    return lines
        // https://stackoverflow.com/a/15123777/2993478
        .replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
};

const convertJsepExpressionTree = (tree) => {
    const { type } = tree;
    if(type === 'Identifier') {
        return tree.name;
    } else if(type === 'Literal') {
        return tree.value;
    } else if(type === 'UnaryExpression') {
        if(tree.operator !== '!') {
            throw new Error(`Unsupported operator ${tree.operator}`);
        }
        return {
            left: convertJsepExpressionTree(tree.argument),
            right: 0,
            operator: '!='
        };
    } else if(type === 'BinaryExpression') {
        // TODO: Test each operand
        let operator;
        switch(tree.operator) {
        case '+': case '-': case '*': case '/': case '%': case '>>': case '<<':
        case '<': case '>': case '<=': case '>=': case '!=':
            operator = tree.operator;
            break;
        case '==': 
            operator = '=';
            break;
        case '**':
            operator = '^';
            break;
        case '&&':
            operator = 'AND';
            break;
        case '||':
            operator = 'OR';
            break;
        case '^':
            operator = 'XOR';
            break;
        default:
            if(tree.operator !== '!') {
                throw new Error(`Unsupported operator ${tree.operator}`);
            }
        }
        return {
            left: convertJsepExpressionTree(tree.left),
            right: convertJsepExpressionTree(tree.right),
            operator
        };
    }
};

export default (code) => {
    const lines = removeComments(code)
        // .replace(/\w+$/gm, '')
        .split('\n');

    let parserState = STATE_LABEL;
    const stateMachine = [];
    let currentMachineState;

    lines.forEach((line, index) => {
        if(line.charCodeAt(line.length - 1) === 13) {
            line = line.slice(0, -1);
        }
        const lineNumber = index + 1;
        if(line === '') {
            return;
        }

        switch(parserState) {
        case STATEMENTS: {
            const tokens = line.match(/^\s+(\w+)\s*=[^=](.*)$/);
            if(tokens) {
                const [, out, expression] = tokens;
                try {
                    const expressionTree = convertJsepExpressionTree(jsep(expression));
                    if(typeof expressionTree === 'number') {
                        // Set immediate
                        currentMachineState.statements.push({
                            left: expressionTree,
                            right: 0,
                            operator: '+',
                            out
                        });
                    } else {
                        currentMachineState.statements.push(Object.assign({
                            out
                        }, expressionTree));
                    }
                } catch(e) {
                    throw new Error(`Error on line ${lineNumber}: ${e.message}`);
                }
                return;
            }
            // If no statement, fall through to transitions
        }
        case TRANSITIONS: { // eslint-disable-line no-fallthrough
            const tokens = line.split('=>');
            const {transitions} = currentMachineState;
            if(tokens.length > 1) {
                const prevTransition = transitions.slice(-1)[0];
                if(prevTransition && typeof prevTransition.condition === 'undefined') {
                    throw new Error(`Unreachable transition on line ${lineNumber}`);
                }
                const [expression, goto] = tokens;
                if(expression.match(/^\s+$/)) {
                    transitions.push({
                        goto: +goto
                    });
                } else {
                    try {
                        const condition = convertJsepExpressionTree(jsep(expression));
                        transitions.push({
                            condition,
                            goto: +goto
                        });
                    } catch(e) {
                        throw new Error(`Error on line ${lineNumber}: ${e.message}`);
                    }
                }
                return;
            }
        }
        case STATE_LABEL: { // eslint-disable-line no-fallthrough
            const tokens = line.match(/^(\d*0):/);
            if(tokens) {
                const state = +tokens[1];
                if(stateMachine.find(item => state === item.state)) {
                    throw new Error(`Duplicate state label on line ${lineNumber}: "${state}"`);
                }
                currentMachineState = {
                    state,
                    statements: [],
                    transitions: [],
                    lineNumber
                };
                stateMachine.push(currentMachineState);
                parserState = STATEMENTS;
                return;
            } else {
                throw new Error(`Expected state label on line ${lineNumber}. Found "${line}"`);
            }
        }
        }
    });
    // Terminate transition chains that use implicit self-loopings
    stateMachine.forEach(({state, lineNumber, transitions}) => {
        // Handle end of transitions
        if(transitions.length === 0) {
            throw new Error(`State with no transitions at line ${lineNumber}"`);
        }
        const lastTransition = transitions.slice(-1)[0];
        if(typeof lastTransition.condition !== 'undefined') {
            transitions.push({
                goto: state
            });
        }
    });
    return stateMachine;
};
