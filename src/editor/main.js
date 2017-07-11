import * as ace from 'brace';
import 'brace/mode/javascript';
import 'brace/theme/monokai';

export default (container) => {
    const editor = ace.edit(container.getAttribute('id'));
    editor.getSession().setMode('ace/mode/javascript');
    editor.setTheme('ace/theme/monokai');
    return editor;
};
