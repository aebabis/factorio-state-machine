/**
 * State machine that alternates between incrementing
 * X three times and incrementing Y one time.
 */
export default () => {
    return 'timer T\n' +
    '10:\n' +
    '   T > 12000 => 20\n' +
    '20:\n' +
    '   reset T\n' +
    '   // Set this value based on number of reactors\n' +
    '   steam < 10000 => 30\n' +
    '   => 10\n' +
    '30: // Arms should grab fuel cells on S = 30\n' +
    '   => 10\n';
};
