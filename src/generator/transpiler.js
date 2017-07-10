import textToStateMachine from './text-to-state-machine';
import stateMachineToIntermediate from './state-machine-to-intermediate';
import intermediateToBlueprint from './intermediate-to-blueprint';

export default (lines) => {
    const stateMachine = textToStateMachine(lines);
    const intermediate = stateMachineToIntermediate(stateMachine);
    const blueprint = intermediateToBlueprint(intermediate);

    return blueprint;
};
