/**
 * Creates a list of global wire signal names used as state machine
 * variables and a lookup function for converting internal (intermediate calculation)
 * values to the appropriate signal while avoiding collisions.
 * @param {*} states 
 */
const createSymbolLookup = (states) => {
    // The symbol set is the names of variables 
    // const symbolSet = {};
    const signals = new Set();

    for (const state of states)
        for (const statement of state.statements)
            for (const group of statement.operations)
                for (const step of group)
                    if (typeof step.out === 'string' && step.out.match(/^signal/))
                        signals.add(step.out);

    const availableSymbols = new Array(26).fill(0)
        .map((u, i) => 'signal_' + String.fromCharCode(i + 65))
        .filter(signal => !signals.has(signal));

    // Try to use signal_S for the state variable if available; otherwise use the last available element
    const stateSignal = availableSymbols.splice(availableSymbols.indexOf('signal_S'), 1)[0];

    return {
        stateSignal,
        signalList: [...signals, stateSignal],
        getSymbol: (varName) => {
            if(typeof varName === 'number') {
                return varName;
            } else if(varName.match(/^INT_.$/)) {
                const index = varName.charCodeAt(4) - 65;
                return availableSymbols[index];
            } else if(varName.match(/^GUARD$/)) {
                return availableSymbols.slice(-1)[0];
            } else if(varName.match(/^ZERO$/)) {
                return availableSymbols.slice(-2)[0];
            } else if(varName.match(/^STATE$/)) {
                return stateSignal;
            } else if(varName.match(/^signal_.*/)) {
                return varName;
            } else {
                return varName;
            }
        }
    };
};

/**
 * Converts an intermediate expanded form state machine
 * object into a blueprint
 */
export default ({timers, states}) => {
    const { stateSignal, signalList, getSymbol } = createSymbolLookup(states);
    const timerList = timers.map(letter => `signal_${letter}`);

    return {
        clock: {
            type: 'constant',
            hasSignalsIn: true,
            hasSignalsOut: true,
            signal: stateSignal
        },

        signals: signalList.filter(signal => !timerList.includes(signal)).map(signal => {
            return {
                type: 'arithmetic',
                hasSignalsIn: true,
                hasSignalsOut: true,
                condition:{
                    left: signal,
                    right: 0,
                    operator: '+',
                    out: signal
                }
            };
        }),

        timers: timerList.map(timer => {
            return {
                type: 'arithmetic',
                hasSignalsIn: true,
                hasSignalsOut: true,
                condition: {
                    left: timer,
                    right: 1,
                    operator: '+',
                    out: timer
                }
            };
        }),

        states: states.map(({statements}) => {
            return statements.map(({start, operations}) => {
                // TODO: Show line number when an unknown signal causes an exception
                return operations.map((group, groupIndex) => group.map((operation) => {
                    const state = start + groupIndex;
                    if(operation.guard) {
                        return {
                            type: 'decider',
                            hasSignalsIn: true,
                            hasSignalsOut: false,
                            condition: {
                                left: getSymbol('STATE'),
                                // Substate value is operation start state plus offset position
                                right: start + groupIndex,
                                operator: '=',
                                countFromInput: false,
                                out: getSymbol('GUARD')
                            }
                        };
                    } else if(operation.branch) {
                        return {
                            type: 'arithmetic',
                            hasSignalsIn: false,
                            hasSignalsOut: true,
                            condition: {
                                left: getSymbol(operation.branch),
                                // Additional 1 is required to offset clock
                                right: operation.goto - state - 1,
                                operator: '*',
                                out: getSymbol('STATE')
                            }
                        };
                    } else {
                        const {left, right, operator, countFromInput, out} = operation;
                        const type = ['=', '<', '>', '<=', '>=', '!='].includes(operator) ?
                            'decider' : 'arithmetic';
                        const leftSymbol = getSymbol(left);
                        const rightSymbol = getSymbol(right);
                        const outSymbol = getSymbol(out);
                        const opSymbol = operator == '<=' ? '\u2264' : (operator == '>='? '\u2265' : (operator == '!=' ? '\u2260' : operator));
                        return {
                            type,
                            hasSignalsIn: left.toString().match(/^signal_/) || right.toString().match(/^signal_/),
                            hasSignalsOut: out.toString().match(/^signal_/),
                            condition: {
                                left: leftSymbol,
                                right: rightSymbol,
                                operator: opSymbol,
                                countFromInput,
                                out: outSymbol
                            }
                        };
                    }
                }));
            });
        })
    };
};
