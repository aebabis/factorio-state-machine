import demos from './demos/demos.js';
import setupEditor from './editor/main.js';
import transpiler from './generator/transpiler.js';
import './style.css';

const textarea = document.querySelector('textarea.output');
const loader = document.querySelector('select.load');
const pole = document.querySelector('select.pole');
const packingAlgorithm = document.querySelector('select.packing');
const editorContainer = document.querySelector('#editor');
const compilerErrorContainer = document.querySelector('.compiler-error');

const editor = setupEditor(editorContainer);

const compileText = () => {
    const code = editor.getValue();
    try {
        const pack = packingAlgorithm.value === 'compact';
        const pole_type = pole.value;
        textarea.textContent = transpiler(code, { pack, pole_type }).encode();
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

for (const demo of Object.keys(demos)) {
    const option = document.createElement('option');
    option.textContent = demo;
    loader.appendChild(option);
}

loader.addEventListener('change', (event) => {
    const key = event.target.value;
    editor.setValue(demos[key]());
    editor.clearSelection();
    compileText();
    updateSelect();
});

packingAlgorithm.addEventListener('change', compileText);
pole.addEventListener('change', compileText);

updateSelect();

textarea.addEventListener('focus', () => textarea.select());
