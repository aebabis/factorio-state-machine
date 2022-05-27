import Blueprint from 'factorio-blueprint';
import PackingUtil from './util.js';

const POWER_POLES = {
    'small_electric_pole': {
        size: 1,
        range: 2,
        spacing: 6,
    },
    'medium_electric_pole': {
        size: 1,
        range: 3,
        spacing: 8,
    },
    'substation': {
        size: 2,
        range: 4,
        spacing: 16,
    },
};

// TODO: Make this a generator when you transpile
function ltrCoordGenerator(pole_info, startY = -pole_info.range) {
    let x = 2 * Math.floor(-pole_info.range/2);
    let y = startY;

    return {
        next: () => {
            const coords = { x, y };
            x += 2;
            const rowOffset = y % pole_info.spacing;
            if (x === 0 && rowOffset >= 0 && rowOffset < pole_info.size) {
                x += 2;
            } else if (x > pole_info.range) {
                x = 2 * Math.floor(-pole_info.range/2);
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
export default ({clock, signals, timers, states}, options={}) => {
    const bp = new Blueprint();

    const { pole_type='small_electric_pole' } = options;
    const pole_info = POWER_POLES[pole_type];

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
    const combPerRow = pole_info.spacing / 2;
    const inMiddleRow = combPerRow * pole_info.size;
    const inTopHalf = (combinatorCount - inMiddleRow) / 2;
    let startY = Math.max(
        -combPerRow + 1,
        -Math.ceil(inTopHalf / pole_info.spacing)
    );

    // Generate a sequence of coords
    const coordGenerator = ltrCoordGenerator(pole_info, startY);

    // Gets the power pole/substation at the given coords,
    // creating it if necessary
    const getPoleAt = (coords, canCreate = true) => {
        const {x, y} = coords;
        let pole = bp.findEntity(coords);
        if(!pole && canCreate) {
            pole = bp.createEntity(pole_type, coords);
            const neighbors = [
                getPoleAt({x: x - pole_info.spacing , y: y}, false),
                getPoleAt({x: x + pole_info.spacing, y: y}, false),
                getPoleAt({x: x, y: y - pole_info.spacing}, false),
                getPoleAt({x: x, y: y + pole_info.spacing}, false)
            ].filter(Boolean);
            neighbors.forEach(neighbor => pole.connect(neighbor, 0, 0, 'red'));
        }
        return pole || null;
    };

    // Gets the power pole or substation that will power the entity
    // based on its coords
    const getNearestPole = (entity) => {
        const {x, y} = entity.position;
        return getPoleAt({
            x: Math.round(x / pole_info.spacing) * pole_info.spacing,
            y: Math.round(y / pole_info.spacing) * pole_info.spacing
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
    let clockCoords = coordGenerator.next().value;
    if (pole_type === 'medium_electric_pole')
        clockCoords = coordGenerator.next().value;
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
