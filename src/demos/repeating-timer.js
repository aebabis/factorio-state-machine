/**
 * State machine that alternates between incrementing
 * X three times and incrementing Y one time.
 */
export default () => {
    return 'timer T\n' +
    '10:\n' +
    '    T > 600 == 0 => 20\n' +
    '20:\n' +
    '    reset T\n' +
    '    => 10\n';
};
