import textToStateMachine from '../src/generator/text-to-state-machine';

describe('text-to-state-machine', () => {
    test('should convert the source code for a 2-state machine to state machine notation', () => {
        const source =
        '10:\n' +
        '    X = X + 1\n' +
        '    X % 3 == 0 => 20\n' +
        '    => 10\n' +
        '20:\n' +
        '    Y = Y + 1\n' +
        '    => 10\n';

        const expected = {
            timers: [],
            states: [{
                state: 10,
                statements: [{
                    left: 'X',
                    right: 1,
                    operator: '+',
                    out: 'X'
                }],
                transitions: [{
                    condition: {
                        left: {
                            left: 'X',
                            right: 3,
                            operator: '%'
                        },
                        right: 0,
                        operator: '=',
                    },
                    goto: 20
                }, {
                    goto: 10
                }]
            }, {
                state: 20,
                statements: [{
                    left: 'Y',
                    right: 1,
                    operator: '+',
                    out: 'Y'
                }],
                transitions: [{
                    goto: 10
                }]
            }]
        };

        const result = textToStateMachine(source);

        expect(result).toEqual(expected);
    });

    test('should convert the source code for the simple toggle machine to state machine notation', () => {
        const source =
        '10:\n' +
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

        const expected = {
            timers: [],
            states: [{
                state: 10,
                statements: [{
                    left: 100,
                    right: 0,
                    operator: '+', // TODO: Should "set immediate" be converted to "+" in the first converter?
                    out: 'A'
                }],
                transitions: [{
                    goto: 20
                }]
            }, {
                state: 20,
                statements: [{
                    left: 'X',
                    right: 1,
                    operator: '+',
                    out: 'X'
                }],
                transitions: [{
                    condition: {
                        left: 'X',
                        right: 50,
                        operator: '=',
                    },
                    goto: 30
                }, {
                    goto: 20
                }]
            }, {
                state: 30,
                statements: [{
                    left: 200,
                    right: 0,
                    operator: '+',
                    out: 'A'
                }],
                transitions: [{
                    goto: 40
                }]
            }, {
                state: 40,
                statements: [{
                    left: 'X',
                    right: 1,
                    operator: '-',
                    out: 'X'
                }],
                transitions: [{
                    condition: {
                        left: 'X',
                        right: 0,
                        operator: '=',
                    },
                    goto: 10
                }, {
                    goto: 40
                }]
            }]
        };

        const result = textToStateMachine(source);

        expect(result).toEqual(expected);
    });

    test('should convert the source code for a repeating timer machine to state machine notation', () => {
        const source =
        '10:\n' +
        '    T > 600 => 20\n' +
        '20:\n' +
        '    reset T\n' +
        '    => 10\n';

        const expected = {
            timers: [],
            states: [{
                state: 10,
                statements: [],
                transitions: [{
                    condition: {
                        left: 'T',
                        right: 600,
                        operator: '>',
                    },
                    goto: 20
                }, {
                    goto: 10
                }]
            }, {
                state: 20,
                statements: [{
                    left: 0,
                    right: 0,
                    operator: '+',
                    out: 'T'
                }],
                transitions: [{
                    goto: 10
                }]
            }]
        };

        const result = textToStateMachine(source);

        expect(result).toEqual(expected);
    });
});
