import nearley from 'nearley';
import Grammar from './grammar.ne';

// import unparse from 'nearley-unparse';
// console.log("dummy", unparse(Grammar));

const removeComments = (lines) => {
    return lines
        // https://stackoverflow.com/a/15123777/2993478
        .replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
};

export default (code) => {
    const parser = new nearley.Parser(Grammar.ParserRules, Grammar.ParserStart);
    const lines = removeComments(code);

    parser.feed(lines);
    const {results} = parser;

    return results[0];
};
