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
        const expected = [{
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
        }];

        const result = textToStateMachine(source);

        expect(result).toEqual(expected);
    });
});