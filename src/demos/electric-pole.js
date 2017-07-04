import Blueprint from 'factorio-blueprint';

export default () => {
    const bp = new Blueprint();

    bp.createEntity('medium_electric_pole', { x: 0, y: 0 });

    return bp;
};
