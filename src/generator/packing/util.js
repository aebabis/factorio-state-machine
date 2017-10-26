/**
 * Connects all combinators for a single "instruction" with green wire.
 * This implementation is naive and will need to be rewriten if we do
 * compound instructions (e.g. `x = 3 * (x + 7) * (y + 2)`)
 * @param {Array} steps 
 */
export default {
    createLocalConnections: (steps) => {
        const stepGroups = steps.map(item => Array.isArray(item) ? item : [item]);
        stepGroups.slice(0, -1).forEach((item, index) => {
            const next = stepGroups[index + 1];
            item.forEach(leftCombinator => {
                next.forEach(rightCombinator => {
                    leftCombinator.connect(rightCombinator, 2, 0, 'green');
                });
            });
        });
    },

    createSpeaker: (bp, clockCombinator) => {
        const {x, y} = clockCombinator.position;
        const speaker = bp.createEntity('programmable_speaker', {
            x: x + 1,
            y: y
        }, 2).setCondition({
            left: clockCombinator.constants[0].name,
            right: 0,
            operator: '='
        }).setParameters({
            volume: 0,
            playGlobally: false,
            allowPolyphony: false
        }).setAlertParameters({
            showAlert: true,
            showOnMap: true,
            icon: 'constant_combinator',
            message: 'State machine hasn\'t been turned on'
        });
        clockCombinator.connect(speaker, 1, 1, 'red');
    }
};
