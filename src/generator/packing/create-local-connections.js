/**
 * Connects all combinators for a single "instruction" with green wire.
 * This implementation is naive and will need to be rewriten if we do
 * compound instructions (e.g. `x = 3 * (x + 7) * (y + 2)`)
 * @param {Array} steps 
 */
export default (steps) => {
    const stepGroups = steps.map(item => Array.isArray(item) ? item : [item]);
    stepGroups.slice(0, -1).forEach((item, index) => {
        const next = stepGroups[index + 1];
        item.forEach(leftCombinator => {
            next.forEach(rightCombinator => {
                leftCombinator.connect(rightCombinator, 2, 0, 'green');
            });
        });
    });
};