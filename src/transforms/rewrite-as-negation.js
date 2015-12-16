const { Negation, Literal } = require('../ast.js');

function canTransform(node) {
    // TODO: handle a * -1 * b -> a * -b
    // TODO: handle b * -1 -> -b
    if (node.type === 'Product' && node.length === 3) {
        return node.first.type === 'Literal' && node.first.value === -1;
    }
}

function doTransform(node) {
    if (canTransform(node)) {
        if (node.last.type === 'Literal' && node.last.value > 0) {
            node.parent.replace(node, new Literal(-node.last.value));
        } else {
            const replacement = new Negation(node.last.clone());
            node.parent.replace(node, replacement);
        }
    }
}

module.exports = {
    label: 'rewrite as negation',
    canTransform,
    doTransform
};
