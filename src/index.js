import demos from './demos/demos';

import css from './style.css'; // eslint-disable-line no-unused-vars

const textarea = document.createElement('textarea');

Object.entries(demos).forEach(([name, constructor]) => {
    const button = document.createElement('button');
    button.textContent = name;
    document.body.appendChild(button);

    button.addEventListener('click', () => {
        const bp = constructor();
        textarea.textContent = bp.encode();
    });
});

textarea.addEventListener('focus', () => textarea.select());

document.body.appendChild(textarea);
