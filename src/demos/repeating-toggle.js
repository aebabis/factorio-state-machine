/**
 * Simple state machine that alternates between two different values of A.
 */
export default () => {
    return '0:\n' +
    '    A = 100\n' +
    '    => 10\n' +
    '10:\n' +
    '    X = X + 1\n' +
    '    X == 50 => 20\n' +
    '    => 10\n' +
    '20:\n' +
    '    A = 200\n' +
    '    => 30\n' +
    '30:\n' +
    '    X = X - 1\n' +
    '    X == 0 => 0\n' +
    '    => 30';
};
