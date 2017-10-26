/**
 * Simple state machine that alternates between two different values of A.
 */
export default () => {
    return '10:\n' +
    '    A = 100\n' +
    '    => 20\n' +
    '20:\n' +
    '    X = X + 1\n' +
    '    X == 50 => 30\n' +
    '    => 20\n' +
    '30:\n' +
    '    A = 200\n' +
    '    => 40\n' +
    '40:\n' +
    '    X = X - 1\n' +
    '    X == 0 => 10\n' +
    '    => 40';
};
