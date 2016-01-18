const React = require('react');
const f = require('functify');

const Modal = require('../views/modal.js');
const { div } = require('../operations.js');

function canTransform(node) {
    // can't do anything with a single node
    return false;
}

function canTransformNodes(selections) {
    if (selections.length == 2) {
        return f(selections).every(([node]) => node.parent.type === 'Equation');
    }
    return false;
}

function transformNodes(selections, exprToAdd) {
    if (canTransformNodes(selections)) {
        const [first, last] = selections;
        const parent = first.first.parent;

        // TODO: check that each selection is a single node

        // need to clone here otherwise we change the AST before the replace
        // which messes things up.
        // need to give exprToAdd clones new id's because we're adding distinct
        // items so they need different ids
        parent.replace(first.first, div(first.first.clone(), exprToAdd.clone(true)));
        parent.replace(last.first, div(last.first.clone(), exprToAdd.clone(true)));
    }
}

function getModal(selections, callback) {
    const mathToReplace = selections[0].toExpression();

    return <Modal
        math={mathToReplace}
        callback={callback}
    />;
}

module.exports = {
    label: 'divide both sides',
    canTransform,
    canTransformNodes,
    transformNodes,
    needsUserInput: true,
    getModal
};
