import Blueprint from 'factorio-blueprint';

const getPoleAt = (bp, coords, canCreate = true) => {
    const {x, y} = coords;
    let pole = bp.findEntity(coords);
    if(!pole && canCreate) {
        pole = bp.createEntity('medium_electric_pole', coords);
        const neighbors = [
            getPoleAt(bp, {x: x - 7, y: y}, false),
            getPoleAt(bp, {x: x + 7, y: y}, false),
            getPoleAt(bp, {x: x, y: y - 7}, false),
            getPoleAt(bp, {x: x, y: y + 7}, false)
        ].filter(Boolean);
        neighbors.forEach(neighbor => pole.connect(neighbor, 0, 0, 'red'));
    }
    return pole || null;
};

/**
 * Gets the nearest pole to the given entity.
 * All poles are at coordinates divisible by 7
 * @param {*} bp - The blueprint containing the target entity
 * @param {*} entity - The entity
 */
const getNearestPole = (bp, entity) => {
    const {x, y} = entity.position;
    return getPoleAt(bp, {
        x: Math.round(x / 7) * 7,
        y: Math.round(y / 7) * 7
    });
};

/**
 * Helper for creating combinators
 * @param {*} bp - The blueprint
 * @param {*} type - Combinator type: 'constant', 'arithmetic', or 'decider'
 * @param {*} coords - Coordinate object of the form `{x, y}`
 * @param {boolean} hasSignalsIn - Flag indicating whether combinator reads state variables
 * @param {boolean} hasSignalsOut - Flag indicating whether combinator updates state variables
 */
const createCombinator = (bp, type, coords, hasSignalsIn = false, hasSignalsOut = false) => {
    const combinator = bp.createEntity(`${type}_combinator`, coords, 2);
    const pole = getNearestPole(bp, combinator);
    if(hasSignalsIn ) {
        combinator.connect(pole, 1, 0, 'red');
    }
    if(hasSignalsOut && type !== 'constant') {
        combinator.connect(pole, 2, 0, 'red');
    }
    return combinator;
};

/**
 * Adds a combinator representing one of the (global) timer variables in the symbol table.
 * Timers increment each tick
 * @param {*} bp - The blueprint
 * @param {*} varName - The name of the variable (e.g. 'X')
 * @param {*} coords - Coordinate object of the form `{x, y}`
 */
const createTimerCombinator = (bp, varName, coords) => {
    const combinator = createCombinator(bp, 'arithmetic', coords, true, true);
    combinator.setCondition({
        left: varName,
        right: 1,
        operator: '+',
        out: varName
    });
};

/**
 * Adds a combinator representing one of the (global) state variables in the symbol table
 * @param {*} bp - The blueprint
 * @param {*} varName - The name of the variable (e.g. 'X')
 * @param {*} coords - Coordinate object of the form `{x, y}`
 */
const createSymbolCombinator = (bp, varName, coords) => {
    const combinator = createCombinator(bp, 'arithmetic', coords, true, true);
    combinator.setCondition({
        left: varName,
        right: 0,
        operator: '+',
        out: varName
    });
};

/**
 * Connects all combinators for a single "instruction" with green wire.
 * This implementation is naive and will need to be rewriten if we do
 * compound instructions (e.g. `x = 3 * (x + 7) * (y + 2)`)
 * @param {Array} steps 
 */
const createLocalConnections = (steps) => {
    const stepGroups = steps.map(item => Array.isArray(item) ? item : [item]);
    stepGroups.slice(0, -1).forEach((item, index) => {
        const next = stepGroups[index + 1];
        item.forEach(leftCombinator => {
            next.forEach(rightCombinator => {
                leftCombinator.connect(rightCombinator, 2, 0, 'green');
            });
        });
    });
};

/**
 * Creates a list of global wire signal names used as state machine
 * variables and a lookup function for converting internal (intermediate calculation)
 * values to the appropriate signal while avoiding collisions.
 * @param {*} states 
 */
const createSymbolLookup = (states) => {
    // The symbol set is the names of variables 
    // const symbolSet = {};
    const signalSet = {};

    states.forEach(({statements}) => {
        statements.forEach(({operations}) => {
            operations.forEach(group => {
                group.forEach(({left, right, out}) => {
                    [left, right, out].filter(Boolean).forEach(sym => {
                        if(typeof sym === 'string' && sym.match(/^signal/)) {
                            signalSet[sym] = true;
                        }
                    });
                });
            });
        });
    });

    const availableSymbols = new Array(26).fill(0)
        .map((u, i) => 'signal_' + String.fromCharCode(i + 65))
        .filter(signal => !(signal in signalSet));

    // Try to use signal_S for the state variable if available; otherwise use the last available element
    const stateSignal = availableSymbols.splice(availableSymbols.indexOf('signal_S'), 1)[0];

    return {
        signalList: Object.keys(signalSet).concat(stateSignal),
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
    const bp = new Blueprint();

    const { signalList, getSymbol } = createSymbolLookup(states);
    const timerList = timers.map(letter => `signal_${letter}`);
    let signalY = -1;
    signalList.filter(signal => !timerList.includes(signal)).forEach(signal => {
        createSymbolCombinator(bp, signal, {x: -3, y: signalY});
        signalY--;
        if(signalY % 7 === 0) {
            signalY--;
        }
    });
    timerList.forEach(timer => {
        createTimerCombinator(bp, timer, {x: -3, y: signalY});
        signalY--;
        if(signalY % 7 === 0) {
            signalY--;
        }
    });
    createCombinator(bp, 'constant', {x: -3, y: signalY}, true).setConstant(0, 'signal_S', 1);

    // Iterate states
    let y = 1;
    states.forEach(({statements}) => {
        statements.forEach(({start, operations}) => {
            const height = operations.map(group => group.length).reduce((a, b) => Math.max(a, b), 1);
            // TODO: Show line number when an unknown signal causes an exception
            createLocalConnections(
                operations.map((group, groupIndex) => group.map((operation, operationIndex) => {
                    const state = start + groupIndex;
                    const coords = {
                        x: -3 + 2 * groupIndex,
                        y: y + operationIndex
                    };
                    if(operation.guard) {
                        return createCombinator(bp, 'decider', coords, true, false).setCondition({
                            left: getSymbol('STATE'),
                            // Substate value is operation start state plus offset position
                            right: start + groupIndex,
                            operator: '=',
                            countFromInput: false,
                            out: getSymbol('GUARD')
                        });
                    } else if(operation.branch) {
                        return createCombinator(bp, 'arithmetic', coords, false, true).setCondition({
                            left: getSymbol(operation.branch),
                            // Additional 1 is required to offset clock
                            right: operation.goto - state - 1,
                            operator: '*',
                            out: getSymbol('STATE')
                        });
                    } else {
                        const {left, right, operator, countFromInput, out} = operation;
                        const type = ['=', '<', '>', '<=', '>=', '!='].includes(operator) ?
                            'decider' : 'arithmetic';
                        const leftSymbol = getSymbol(left);
                        const rightSymbol = getSymbol(right);
                        const outSymbol = getSymbol(out);
                        return createCombinator(
                            bp,
                            type,
                            coords,
                            left.toString().match(/^signal_/) || right.toString().match(/^signal_/),
                            out.toString().match(/^signal_/)
                        ).setCondition({
                            left: leftSymbol,
                            right: rightSymbol,
                            operator,
                            countFromInput,
                            out: outSymbol
                        });
                    }
                }))
            );
            y += height;
            if(y % 7 === 0) {
                y++; // TODO: Handle multi-height groups touching poles
            }
        });
    });

    return bp;
};
