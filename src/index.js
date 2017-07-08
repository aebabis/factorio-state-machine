import demos from './demos/demos';

import css from './style.css'; // eslint-disable-line no-unused-vars
import setupEditor from './editor/main';

const textarea = document.querySelector('textarea.output');
const select = document.querySelector('select');
const editor = document.querySelector('#editor');

setupEditor(editor);

Object.keys(demos).forEach(name => {
    const option = document.createElement('option');
    option.textContent = name;
    select.appendChild(option);

    select.addEventListener('change', event => {
        const key = event.target.value;
        const bp = demos[key]();
        textarea.textContent = bp.encode();
    });
});

textarea.addEventListener('focus', () => textarea.select());
