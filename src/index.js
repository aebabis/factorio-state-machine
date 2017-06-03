import Blueprint from 'factorio-blueprint';

const bp = new Blueprint();

bp.createEntity('medium_electric_pole', { x: 0, y: 0 });

const bpString = bp.encode();

const pre = document.createElement('pre');
pre.textContent = bpString;
document.body.appendChild(pre);