/**
 * State machine that alternates between incrementing
 * X three times and incrementing Y one time.
 */
export default () => {
    return '10:\n' +
    '    X = X + 1\n' +
    '    X % 3 == 0 => 20\n' +
    '    => 10\n' +
    '20:\n' +
    '    Y = Y + 1\n' +
    '    => 10\n';
};
