/**
 * Converts a variable name to it's intermediate form.
 * Letter variables such as 'X' are converted to signals
 * while intermediate values (e.g. 'INT_A') are left untouched
 * @param {*} varName 
 */
const getSymbolFor = varName => {
    // TODO: Handle chemical signals
    if(varName.length === 1) {
        return `signal_${varName}`;
    } else {
        return varName;
    }
};

/**
 * Gets the intermediate form of a statement by converting it
 * into multiple instructions and guarding outputs
 * @param {*} node - A statement or expression 
 * @param {boolean} [isSecondarySignal] - true if the expression's output signal should be
 * the secondary signal (B). This is usually the case for the right operand of an expression.
 */
const getIntermediateFormOf = ({left, right, operator, out}, isSecondarySignal) => {
    if(typeof left === 'number') {
        // Combinators can only have a constant as the right operand.
        // If there's a constant on the left but not the right, we
        // can solve this by swapping, whereas if both values, are constant
        // the resulting intermediate form can be simplified
        if(typeof right !== 'number') {
            return getIntermediateFormOf({
                left: right,
                right: left,
                operator,
                out
            }, isSecondarySignal);
        } else {
            return [[{
                left: getSymbolFor(out),
                right: -1,
                operator: '*',
                out: getSymbolFor('INT_A')
            }, {
                // We use a ZERO signal to simplify constant generation
                // by not needing a special case for constant combinators
                left: getSymbolFor('ZERO'),
                right: left + right,
                operator: '+',
                out: getSymbolFor('INT_A')
            }, {
                guard: true
            }], [{
                left: getSymbolFor('INT_A'),
                right: 'GUARD',
                operator: '*',
                out: getSymbolFor(out)
            }]];
        }
        // TODO: Test cases: `X = Y + 100` and `X = 100 + Y`
    }
    // TODO: Explicitly define green connections here in order to
    // prevent variable collisions
    let leftVar, rightVar;
    let leftArr, rightArr;
    if(typeof left === 'object') {
        leftVar = 'INT_A';
        leftArr = getIntermediateFormOf(left);
    } else {
        leftVar = left;
        leftArr = [];
    }
    if(typeof right === 'object') {
        rightVar = 'INT_B';
        rightArr = getIntermediateFormOf(right, true);
    } else {
        rightVar = right;
        rightArr = [];
    }
    if(leftArr.length < rightArr.length) {
        leftArr = new Array(rightArr.length - leftArr.length).fill(null)
            .concat(leftArr);
    } else {
        rightArr = new Array(leftArr.length - rightArr.length).fill(null)
            .concat(rightArr);
    }
    const mergedArray = leftArr.map((item, index) =>
        (item || []).concat(rightArr[index] || [])
    );
    if(out) {
        // Ensure room for guard
        if(operator === '+' && left === out || right === out) {
            // Incrementation is a special case because it can be performed
            // implicitly by the circuit network. Using the signal combinators
            // (symbol table) to implicitly add saves a cycle in this case.

            // TODO: Test an example where a variable is assigned the result
            // of the sum of two other variables
            if(mergedArray.length === 0) {
                mergedArray.push([]);
            }
            mergedArray.slice(-1)[0].push({
                guard: true
            });
            mergedArray.push([{
                left: left === out ? 'GUARD' : getSymbolFor(leftVar),
                right: right === out ? 'GUARD': getSymbolFor(rightVar),
                operator: '*',
                out: getSymbolFor(out)
            }]);
            return mergedArray;
        } else {
            // Since the signal storage combinators function by adding values,
            // assignments must subtract the previous before setting. This is done
            // with the following steps:
            // 1) Perform operation and store in intermediate value
            // 2) On the same cycle, subtract 'out' signal from same value
            // 3) Multiply value by guard and then output into signal. In the
            // majority of cases, this final value will be negative
            mergedArray.push([{
                left: getSymbolFor(leftVar),
                right: getSymbolFor(rightVar),
                operator: operator,
                countFromInput: ['=', '<', '>', '<=', '>=', '!='].includes(operator) ? false : undefined,
                out: getSymbolFor('INT_A')
            }, {
                // Subtract old value of 'out' from result
                // making use of implicit addition
                left: getSymbolFor(out),
                right: -1,
                operator: '*',
                out: getSymbolFor('INT_A')
            }, {
                // Guard on same cycle
                guard: true
            }]);
            // Multiply added signal
            mergedArray.push([{
                left: 'INT_A',
                right: 'GUARD',
                operator: '*',
                out: getSymbolFor(out)
            }]);
            return mergedArray;
        }
    } else {
        mergedArray.push([{
            left: getSymbolFor(leftVar),
            right: getSymbolFor(rightVar),
            operator,
            // TODO: Import conditional types
            countFromInput: ['=', '<', '>', '<=', '>=', '!='].includes(operator) ? false : undefined,
            out: isSecondarySignal ? 'INT_B' : 'INT_A'
        }]);
        return mergedArray;
    }
};

/**
 * Converts the basic form of the parsed state machine
 * into an intermediate form that's easier to make
 * into a blueprint
 */
export default ({timers, states}) => {
    states = states.map(({state, statements, transitions}) => {
        // TODO: Parallelize statements that can be run in parallel
        // TODO: Perform tree rotations for statements with commutativity?
        // If it's addition, it can be all run in a single tick. If it's
        // multiplication, then it can't
        let substate = state;
        const intermediateStatements = statements.map(statement => {
            const operations = getIntermediateFormOf(statement);
            const start = substate;
            substate += operations.length;
            return {
                start,
                operations
            };
        });
        let hasUnconditionalBranch;
        const intermediateBranches = transitions.map(({condition, goto}) => {
            if(hasUnconditionalBranch) {
                throw new Error('Unreachable statement');
                // TODO: Unit test this
                // TOOD: Find other forms of unreachable statements
                // TODO: Include line number :)
            }
            const start = substate;
            if(condition) {
                const operations = getIntermediateFormOf(condition);
                operations.slice(-1)[0].push({
                    guard: true
                });
                operations.push([{
                    left: 'INT_A',
                    right: 'GUARD',
                    operator: '*',
                    out: 'INT_A'
                }]);
                operations.push([{
                    branch: 'INT_A',
                    goto
                }]);
                substate += operations.length;
                // TODO: Stagger branches so they end 1 tick apart
                // instead of standing end-to-end
                return {
                    start,
                    operations
                };
            } else {
                hasUnconditionalBranch = true;
                return {
                    start,
                    operations: [[{
                        guard: true
                    }], [{
                        branch: 'GUARD',
                        goto
                    }]]
                };
            }
        });
        return {
            state,
            statements: intermediateStatements.concat(intermediateBranches)
        };
    });

    // Since each statement group in the statement group array has time
    // given by (state + offset), we can determine the instruction-pointer-time
    // of each statement. If any statement bleeds into another state, we throw an error
    states.forEach(({state, statements}) => {
        const start = state;
        const end = statements
            .map(({start, operations}) => start + operations.length)
            .reduce((a, b) => Math.max(a, b), 0); // Last statement is always a branch, so no need to check past end
        states.forEach(({state}) => {
            if(start < state && end >= state) {
                const bleed = end - state + 1;
                throw new Error(`State ${start} implicitly overlaps state ${state} by ${bleed} instruction${bleed === 1 ? '' : 's'}. Consider increasing label value of state ${state}`);
            }
        });
    });

    return {
        timers,
        states
    };
};
