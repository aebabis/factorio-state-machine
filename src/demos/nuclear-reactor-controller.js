export default () => {
    return 'timer T\n' +
    '10:\n' +
    '   // Reactor takes 200s (12k ticks) to burn a fuel cell\n' +
    '   T > 12000 => 20\n' +
    '20:\n' +
    '   // Set this value based on number of reactors\n' +
    '   steam < 10000 => 30\n' +
    '   => 20\n' +
    '30: // Arms should grab fuel cells on S = 30\n' +
    '   reset T\n' +
    '   => 10\n';
};
