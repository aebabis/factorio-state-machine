import demos from './demos/demos';

import css from './style.css'; // eslint-disable-line no-unused-vars
import setupEditor from './editor/main';

import transpiler from './generator/transpiler';

import './favicon.ico';

const textarea = document.querySelector('textarea.output');
const select = document.querySelector('select');
const editorContainer = document.querySelector('#editor');
const compilerErrorContainer = document.querySelector('.compiler-error');

const editor = setupEditor(editorContainer);

const compileText = () => {
    const code = editor.getValue();
    try {
        textarea.textContent = transpiler(code).encode();
        compilerErrorContainer.innerHTML = '&nbsp';
    } catch(e) {
        console.error(e);
        compilerErrorContainer.textContent = e.message;
    }
};

let debounce;
editor.on('change', () => {
    clearTimeout(debounce);
    debounce = setTimeout(compileText, 500);
});

const updateSelect = () => select.setAttribute('selection', select.value);

Object.keys(demos).forEach(name => {
    const option = document.createElement('option');
    option.textContent = name;
    select.appendChild(option);

    select.addEventListener('change', event => {
        const key = event.target.value;
        editor.setValue(demos[key]());
        editor.clearSelection();
        compileText();
        updateSelect();
    });
});
updateSelect();

textarea.addEventListener('focus', () => textarea.select());
