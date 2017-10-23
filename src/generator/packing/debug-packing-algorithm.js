import Blueprint from 'factorio-blueprint';
import createLocalConnections from './create-local-connections';

export default ({clock, signals, timers, states}) => {
    const bp = new Blueprint();
    const getPoleAt = (coords, canCreate = true) => {
        const {x, y} = coords;
        let pole = bp.findEntity(coords);
        if(!pole && canCreate) {
            pole = bp.createEntity('medium_electric_pole', coords);
            const neighbors = [
                getPoleAt({x: x - 7, y: y}, false),
                getPoleAt({x: x + 7, y: y}, false),
                getPoleAt({x: x, y: y - 7}, false),
                getPoleAt({x: x, y: y + 7}, false)
            ].filter(Boolean);
            neighbors.forEach(neighbor => pole.connect(neighbor, 0, 0, 'red'));
        }
        return pole || null;
    };

    const getNearestPole = (entity) => {
        const {x, y} = entity.position;
        return getPoleAt({
            x: Math.round(x / 7) * 7,
            y: Math.round(y / 7) * 7
        });
    };

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

    let signalY = -1;
    signals.forEach(signal => {
        getCombinator(bp, signal, {x: -3, y: signalY});
        signalY--;
        if(signalY % 7 === 0) {
            signalY--;
        }
    });
    timers.forEach(timer => {
        getCombinator(bp, timer, {x: -3, y: signalY});
        signalY--;
        if(signalY % 7 === 0) {
            signalY--;
        }
    });
    const clockCombinator = getCombinator(bp, clock, {x: -3, y: signalY});
    clockCombinator.setConstant(0, clock.signal, 1);

    // Iterate states
    let y = 1;
    states.forEach(statements => {
        statements.forEach(operations => {
            const height = operations.map(group => group.length).reduce((a, b) => Math.max(a, b), 1);
            const offset = y % 7;
            if(offset === 0) {
                y++;
            } else if(offset + height > 7) {
                // Go past next pole
                y += 8 - offset;
            }

            const operationGroup = operations.map((combinators, groupIndex) => {
                return combinators.map((combinator, operationIndex) => {
                    const coords = {
                        x: -3 + 2 * groupIndex,
                        y: y + operationIndex
                    };
                    return getCombinator(bp, combinator, coords);
                });
            });

            createLocalConnections(operationGroup);

            y += height;
        });
    });

    return bp;

};
