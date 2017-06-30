import Blueprint from 'factorio-blueprint';
import intermediateToBlueprint from '../generator/intermediate-to-blueprint';

/**
 * Creates a simple state machine that alternates between incrementing
 * X three times and incrementing Y one time.
 */
export default () => {
    return intermediateToBlueprint([{
        state: 10,
        statements: [{
            start: 10,
            operations: [[{
                guard: true
            }], [{
                left: 'GUARD',
                right: 1,
                operator: '*',
                out: 'signal_X'
            }]]
        }, {
            start: 12,
            operations: [[{
                left: 'signal_X',
                right: 3,
                operator: '%',
                out: 'INT_A'
            }], [{
                left: 'INT_A',
                right: 0,
                operator: '=',
                countFromInput: false,
                out: 'INT_A'
            }, {
                guard: true
            }], [{
                left: 'INT_A',
                right: 'GUARD',
                operator: '*',
                out: 'INT_A'
            }], [{
                branch: 'INT_A',
                goto: 20
            }]]
        }, {
            start: 16,
            operations: [[{
                guard: true
            }], [{
                branch: 'GUARD',
                goto: 10
            }]]
        }
   ]}, {
        state: 20,
        statements: [{
            start: 20,
            operations: [[{
                guard: true
            }], [{
                left: 'GUARD',
                right: 1,
                operator: '*',
                out: 'signal_Y'
            }]]
        }, {
            start: 20,
            operations: [[{
                guard: true // TODO: Figure out the best way to share guards
            }], [{
                branch: 'GUARD',
                goto: 10
            }]]
        }]
    }]);
};