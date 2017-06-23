import Blueprint from 'factorio-blueprint';
import demos from './demos/demos';

const pre = document.createElement('pre');

Object.entries(demos).forEach(([name, constructor]) => {
    const button = document.createElement('button');
    button.textContent = name;
    document.body.appendChild(button);

    button.addEventListener('click', () => {
        const bp = constructor();
        pre.textContent = bp.encode();
    });
});

document.body.appendChild(pre);
