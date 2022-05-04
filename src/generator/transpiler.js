import textToStateMachine from './text-to-state-machine.js';
import stateMachineToIntermediate from './state-machine-to-intermediate.js';
import intermediateToCombinators from './intermediate-to-combinators.js';
import combinatorsToBlueprint from './combinators-to-blueprint.js';

export default (lines, options) => {
    const stateMachine = textToStateMachine(lines, options);
    const intermediate = stateMachineToIntermediate(stateMachine, options);
    const combinators = intermediateToCombinators(intermediate, options);
    const blueprint = combinatorsToBlueprint(combinators, options);

    return blueprint;
};
