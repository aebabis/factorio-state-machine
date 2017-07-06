import stateMachineToIntermediate from '../generator/state-machine-to-intermediate';
import intermediateToBlueprint from '../generator/intermediate-to-blueprint';

/**
 * Creates a simple state machine that alternates between incrementing
 * X three times and incrementing Y one time.
 */
export default () => {
    const stateMachine = [{
        state: 10,
        statements: [{
            left: 'X',
            right: 1,
            operator: '+',
            out: 'X'
        }],
        transitions: [{
            condition: {
                left: {
                    left: 'X',
                    right: 3,
                    operator: '%'
                },
                right: 0,
                operator: '=',
            },
            goto: 20
        }, {
            goto: 10
        }]
    }, {
        state: 20,
        statements: [{
            left: 'Y',
            right: 1,
            operator: '+',
            out: 'Y'
        }],
        transitions: [{
            goto: 10
        }]
    }];
    const intermediateForm = stateMachineToIntermediate(stateMachine);
    const blueprint = intermediateToBlueprint(intermediateForm);
    return blueprint;
};
