import ace from 'brace';
import 'brace/mode/javascript.js';
import 'brace/theme/monokai.js';

export default (container) => {
    const editor = ace.edit(container.getAttribute('id'));
    editor.getSession().setMode('ace/mode/javascript');
    editor.setTheme('ace/theme/monokai');
    return editor;
};
