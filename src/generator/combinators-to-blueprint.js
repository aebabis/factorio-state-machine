import packingAlgorithms from './packing/packing-algorithms.js';

/**
 * Converts a set combinator representations into a blueprint by selecting
 * a packing algorithm to construct and arrange the combinators
 */
export default (combinators, {pack = true} = {}) => {
    if(pack) {
        return packingAlgorithms.compactPackingAlgorithm(combinators);
    } else {
        return packingAlgorithms.debugPackingAlgorithm(combinators);
    }
};
