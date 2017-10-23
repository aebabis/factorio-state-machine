import textToStateMachine from './text-to-state-machine';
import stateMachineToIntermediate from './state-machine-to-intermediate';
import intermediateToCombinators from './intermediate-to-combinators';
import combinatorsToBlueprint from './combinators-to-blueprint';

export default (lines, options) => {
    const stateMachine = textToStateMachine(lines, options);
    const intermediate = stateMachineToIntermediate(stateMachine, options);
    const combinators = intermediateToCombinators(intermediate, options);
    const blueprint = combinatorsToBlueprint(combinators, options);

    return blueprint;
};
