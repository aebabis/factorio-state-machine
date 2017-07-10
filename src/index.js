import demos from './demos/demos';

import css from './style.css'; // eslint-disable-line no-unused-vars
import setupEditor from './editor/main';

import transpiler from './generator/transpiler';

const textarea = document.querySelector('textarea.output');
const select = document.querySelector('select');
const editorContainer = document.querySelector('#editor');

const editor = setupEditor(editorContainer);

let debounce;
editor.on('change', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
        const code = editor.getValue();
        textarea.textContent = transpiler(code).encode();
    }, 500);
});

const updateSelect = () => select.setAttribute('selection', select.value);

Object.keys(demos).forEach(name => {
    const option = document.createElement('option');
    option.textContent = name;
    select.appendChild(option);

    select.addEventListener('change', event => {
        const key = event.target.value;
        const bp = demos[key]();
        textarea.textContent = bp.encode();
        updateSelect();
    });
});
updateSelect();

textarea.addEventListener('focus', () => textarea.select());
