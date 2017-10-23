import demos from './demos/demos';

import css from './style.css'; // eslint-disable-line no-unused-vars
import setupEditor from './editor/main';

import transpiler from './generator/transpiler';

const textarea = document.querySelector('textarea.output');
const loader = document.querySelector('select.load');
const packingAlgorithm = document.querySelector('select.packing');
const editorContainer = document.querySelector('#editor');
const compilerErrorContainer = document.querySelector('.compiler-error');

const editor = setupEditor(editorContainer);

let pack = true;

const compileText = () => {
    const code = editor.getValue();
    try {
        textarea.textContent = transpiler(code, {pack: pack}).encode();
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

const updateSelect = () => loader.setAttribute('selection', loader.value);

Object.keys(demos).forEach(name => {
    const option = document.createElement('option');
    option.textContent = name;
    loader.appendChild(option);

    loader.addEventListener('change', event => {
        const key = event.target.value;
        editor.setValue(demos[key]());
        editor.clearSelection();
        compileText();
        updateSelect();
    });
});

packingAlgorithm.addEventListener('change', event => {
    pack = event.target.value === 'compact';
    compileText();
});

updateSelect();

textarea.addEventListener('focus', () => textarea.select());
