import Blueprint from 'factorio-blueprint';
import PackingUtil from './util.js';

const SUBSTATION_SPACING = 16;

// TODO: Make this a generator when you transpile
function ltrCoordGenerator(startY = -4) {
    let x = -4;
    let y = startY;

    return {
        next: () => {
            const coords = { x, y };
            x += 2;
            if(x === 0 && (y % SUBSTATION_SPACING === 0 || y % SUBSTATION_SPACING === 1)) {
                x += 2;
            } else if(x > 4) {
                x = -4;
                y++;
            }
            return {
                value: coords
            };
        }
    };
}

/**
 * Packing algorithm that attempts to fit combinators
 * into a neat rectangle around substations.
 */
export default ({clock, signals, timers, states}) => {
    const bp = new Blueprint();

    // Recursively count combinators in an array
    const countCombinators = (item) => {
        if(!Array.isArray(item)) {
            return 1;
        } else {
            return item.map(countCombinators).reduce((a, b) => a + b, 0);
        }
    };

    // Count all combinators to help determine layout
    const combinatorCount = 
        countCombinators(clock) +
        countCombinators(signals) +
        countCombinators(timers) + 
        countCombinators(states);

    // Attempt to balance combinators around first
    // power pole so that small machines don't have
    // gaps
    let startY = Math.max(
        -7,
        -Math.ceil((combinatorCount - 8) / 10)
    );

    // Generate a sequence of coords
    const coordGenerator = ltrCoordGenerator(startY);

    // Gets a substation at the given coords, making
    // it if necessary
    const getPoleAt = (coords, canCreate = true) => {
        const {x, y} = coords;
        let pole = bp.findEntity(coords);
        if(!pole && canCreate) {
            pole = bp.createEntity('substation', coords);
            const neighbors = [
                getPoleAt({x: x - SUBSTATION_SPACING , y: y}, false),
                getPoleAt({x: x + SUBSTATION_SPACING, y: y}, false),
                getPoleAt({x: x, y: y - SUBSTATION_SPACING}, false),
                getPoleAt({x: x, y: y + SUBSTATION_SPACING}, false)
            ].filter(Boolean);
            neighbors.forEach(neighbor => pole.connect(neighbor, 0, 0, 'red'));
        }
        return pole || null;
    };

    // Gets the substation that will power the entity
    // based on its coords
    const getNearestPole = (entity) => {
        const {x, y} = entity.position;
        return getPoleAt({
            x: Math.round(x / SUBSTATION_SPACING) * SUBSTATION_SPACING,
            y: Math.round(y / SUBSTATION_SPACING) * SUBSTATION_SPACING
        });
    };

    // Creates a combinator
    const getCombinator = (bp, {type, hasSignalsIn, hasSignalsOut, condition}, coords) => {
        const combinator = bp.createEntity(`${type}_combinator`, coords, 2);
        const pole = getNearestPole(combinator);
        if(hasSignalsIn ) {
            combinator.connect(pole, 1, 0, 'red');
        }
        if(hasSignalsOut && type !== 'constant') {
            combinator.connect(pole, 2, 0, 'red');
        }
        if(condition) {
            combinator.setCondition(condition);
        }
        return combinator;
    };

    // Place combinators
    const clockCoords = coordGenerator.next().value;
    const clockCombinator = getCombinator(bp, clock, clockCoords);
    clockCombinator.setConstant(0, clock.signal, 1);
    clockCombinator.constantEnabled = false;
    PackingUtil.createSpeaker(bp, clockCombinator);

    signals.forEach(signal => {
        getCombinator(bp, signal, coordGenerator.next().value);
    });

    timers.forEach(timer => {
        getCombinator(bp, timer, coordGenerator.next().value);
    });

    states.forEach(statements => {
        statements.forEach(operations => {
            const operationGroup = operations.map((combinators) => {
                return combinators.map((combinator) => {
                    return getCombinator(bp, combinator, coordGenerator.next().value);
                });
            });

            // Connect statement combinators with green wire
            PackingUtil.createLocalConnections(operationGroup);
        });
    });

    return bp;
};
