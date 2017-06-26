import Blueprint from 'factorio-blueprint';

/**
 * Gets the nearest pole to the given entity.
 * All poles are at coordinates divisible by 7
 * @param {*} bp - The blueprint containing the target entity
 * @param {*} entity - The entity
 */
const getNearestPole = (bp, entity) => {
    const {x, y} = entity.position;
    return bp.findEntity({
        x: Math.round(x / 7) * 7,
        y: Math.round(y / 7) * 7
    });
}

/**
 * Helper for creating combinators
 * @param {*} bp - The blueprint
 * @param {*} type - Combinator type: 'constant', 'arithmetic', or 'decider'
 * @param {*} coords - Coordinate object of the form `{x, y}`
 * @param {boolean} hasVarsIn - Flag indicating whether combinator reads state variables
 * @param {boolean} hasVarsOut - Flag indicating whether combinator updates state variables
 */
const createCombinator = (bp, type, coords, hasVarsIn = false, hasVarsOut = false) => {
    const combinator = bp.createEntity(`${type}_combinator`, coords, 2);
    const pole = getNearestPole(bp, combinator);
    if(hasVarsIn) {
        combinator.connect(pole, 1, 0, 'red');
    }
    if(hasVarsOut && type !== 'constant') {
        combinator.connect(pole, 2, 0, 'red');
    }
    return combinator;
}

/**
 * Adds a combinator representing one of the (global) state variables in the symbol table
 * @param {*} bp - The blueprint
 * @param {*} varName - The name of the variables (e.g. 'X')
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
}

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
}

/**
 * Creates a simple state machine that alternates between incrementing
 * X three times and incrementing Y one time.
 */
export default () => {
    const bp = new Blueprint();

    const poleBounds = {
        y1: -1,
        y2: 1,
        x2: 1
    };
    const poles = {};
    for(let y = poleBounds.y1; y <= poleBounds.y2; y++) {
        const my = y * 7;
        const row = poles[my] = {};
        for(let x = 0; x <= poleBounds.x2; x++) {
            const mx = x * 7;
            row[mx] = bp.createEntity('medium_electric_pole', { x: mx, y: my });
        }
    }

    for(let y = poleBounds.y1; y <= poleBounds.y2 - 1; y++) {
        for(let x = 0; x <= poleBounds.x2; x++) {
            bp.findEntity({ x: x * 7, y: y * 7 })
                .connect(bp.findEntity({x : x * 7, y: (y + 1) * 7}), 0, 0, 'red');
        }
    }

    for(let y = poleBounds.y1; y <= poleBounds.y2; y++) {
        for(let x = 0; x <= poleBounds.x2 - 1; x++) {
            bp.findEntity({ x: x * 7, y: y * 7 })
                .connect(bp.findEntity({x : (x + 1) * 7, y: y * 7}), 0, 0, 'red');
        }
    }

    createCombinator(bp, 'constant', {x: -3, y: -4}, true);
    createSymbolCombinator(bp, 'signal_S', {x: -3, y: -3}, true, true);
    createSymbolCombinator(bp, 'signal_X', {x: -3, y: -2}, true, true);
    createSymbolCombinator(bp, 'signal_Y', {x: -3, y: -1}, true, true);

    createLocalConnections([
        createCombinator(bp, 'decider', {x: -3, y: 1}, true, false).setCondition({
            left: 'signal_S',
            right: 10,
            operator: '=',
            countFromInput: false,
            out: 'signal_A'
        }),
        createCombinator(bp, 'arithmetic', {x: -1, y: 1}, false, true).setCondition({
            left: 'signal_A',
            right: 1,
            operator: '*',
            out: 'signal_X'
        })
    ]);

    createLocalConnections([
        createCombinator(bp, 'arithmetic', {x: -3, y: 2}, true, false).setCondition({
            left: 'signal_X',
            right: 3,
            operator: '%',
            out: 'signal_A'
        }), [
            createCombinator(bp, 'decider', {x: -1, y: 2}, false, false).setCondition({
                left: 'signal_A',
                right: 0,
                operator: '=',
                countFromInput: false,
                out: 'signal_A'
            }),
            createCombinator(bp, 'decider', {x: -1, y: 3}, true, false).setCondition({
                left: 'signal_S',
                right: 13,
                operator: '=',
                countFromInput: false,
                out: 'signal_B'
            })
        ],
        createCombinator(bp, 'arithmetic', {x: 1, y: 2}, false, false).setCondition({
            left: 'signal_A',
            right: 'signal_B',
            operator: '*',
            out: 'signal_A'
        }),
        createCombinator(bp, 'arithmetic', {x: 3, y: 2}, false, true).setCondition({
            left: 'signal_A',
            right: 4,
            operator: '*',
            out: 'signal_S'
        })
    ]);

    createLocalConnections([
        createCombinator(bp, 'decider', {x: -3, y: 4}, true, false).setCondition({
            left: 'signal_S',
            right: 16,
            operator: '=',
            countFromInput: false,
            out: 'signal_A'
        }),
        createCombinator(bp, 'arithmetic', {x: -1, y: 4}, false, true).setCondition({
            left: 'signal_A',
            right: -8,
            operator: '*',
            out: 'signal_S'
        })
    ]);

    createLocalConnections([
        createCombinator(bp, 'decider', {x: -3, y: 5}, true, false).setCondition({
            left: 'signal_S',
            right: 20,
            operator: '=',
            countFromInput: false,
            out: 'signal_A'
        }), [
            createCombinator(bp, 'arithmetic', {x: -1, y: 5}, false, true).setCondition({
                left: 'signal_A',
                right: 1,
                operator: '*',
                out: 'signal_Y'
            }),
            createCombinator(bp, 'arithmetic', {x: -1, y: 6}, false, true).setCondition({
                left: 'signal_A',
                right: -12,
                operator: '*',
                out: 'signal_S'
            })
        ]
    ]);

    return bp;
}
