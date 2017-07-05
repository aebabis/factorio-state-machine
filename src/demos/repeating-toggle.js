import stateMachineToIntermediate from '../generator/state-machine-to-intermediate';
import intermediateToBlueprint from '../generator/intermediate-to-blueprint';

/**
 * Creates a simple state machine that alternates between two
 * different values of A.
 */
export default () => {
    const stateMachine = [{
        state: 0,
        statements: [{
            left: 100,
            right: 0,
            operator: '+', // TODO: Should "set immediate" be converted to "+" in the first converter?
            out: 'A'
        }],
        transitions: [{
            goto: 10
        }]
    }, {
        state: 10,
        statements: [{
            left: 'X',
            right: 1,
            operator: '+',
            out: 'X'
        }],
        transitions: [{
            condition: {
                left: 'X',
                right: 50,
                operator: '=',
            },
            goto: 20
        }, {
            goto: 10
        }]
    }, {
        state: 20,
        statements: [{
            left: 200,
            right: 0,
            operator: '+',
            out: 'A'
        }],
        transitions: [{
            goto: 30
        }]
    }, {
        state: 30,
        statements: [{
            left: 'X',
            right: 1,
            operator: '-',
            out: 'X'
        }],
        transitions: [{
            condition: {
                left: 'X',
                right: 0,
                operator: '=',
            },
            goto: 0
        }, {
            goto: 30
        }]
    }];
    const intermediateForm = stateMachineToIntermediate(stateMachine);
    const blueprint = intermediateToBlueprint(intermediateForm);
    return blueprint;
};
