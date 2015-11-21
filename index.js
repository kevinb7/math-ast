let {
    Expression,
    Literal,
    Product,
    Fraction,
    Identifier,
    Operator,
    Equation
} = require('./src/ast.js');

const {
    getMetrics,
    createFlatLayout,
    RenderOptions
} = require("./src/layout.js");

const { add, sub, mul, div, removeExtraParens } = require('./src/operations.js');

const { evaluate } = require('./src/transforms.js');

let canvas = document.createElement('canvas');
let ctx = canvas.getContext('2d');

ctx.fillStyle = 'black';
ctx.strokeStyle = 'red';

let pixelRatio = window.devicePixelRatio;

canvas.width = 1200 * pixelRatio;
canvas.height = 700 * pixelRatio;
canvas.style.width = 1200 + "px";
canvas.style.height = 700 + "px";
ctx.scale(pixelRatio, pixelRatio);

document.body.appendChild(canvas);

let expr1, expr2, eqn1;

//expr1 = add(new Literal(25), mul(new Literal(42), mul(new Identifier('pi'), new Identifier('r'))));
//expr1 = add(expr1, new Identifier('theta'));
//expr2 = sub(new Fraction(new Identifier('y'), add(new Literal(5), new Identifier('x'))), new Literal(-2));

expr1 = mul(new Literal(2), add(new Literal(3), mul(new Literal(5), new Literal(-4))));
expr2 = div(sub(mul(new Literal(-1), new Literal(-3)), new Literal(12)), new Literal(3));

eqn1 = new Equation(expr1, expr2);

let flattenedLayout = createFlatLayout(eqn1, 72, canvas.width, canvas.height);

function drawAxes(ctx) {
    let width = canvas.width;
    let height = canvas.height;
    ctx.strokeStyle = 'red';
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
}

let selection = null;
RenderOptions.bounds = false;
RenderOptions.axes = false;

function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (RenderOptions.axes) {
        drawAxes(ctx);
    }

    if (selection) {
        ctx.fillStyle = 'rgba(255,255,0,0.5)';

        const bounds = selection.bounds;

        const width = bounds.right - bounds.left;
        const height = bounds.bottom - bounds.top;
        const x = bounds.left;
        const y = bounds.top;
        const padding = 8;
        const radius = width/2 + padding;

        if (selection.circle) {
            ctx.beginPath();
            ctx.arc(x + width/2, y + height/2, radius, 0, 2 * Math.PI, false);
            ctx.closePath();
            ctx.fill();
        } else {
            roundRect(ctx, x - padding, y - padding, width + 2 * padding, height + 2 * padding, padding);
            //ctx.fillRect(x - padding, y - padding, width + 2 * padding, height + 2 * padding);
        }
    }

    ctx.fillStyle = 'black';
    flattenedLayout.render(ctx);
}

draw();

function findNode(node, id) {
    if (node.id === id) {
        return node;
    } else if (["Expression", "Product"].includes(node.type)) {
        for (const child of node) {
            const result = findNode(child, id);
            if (result) {
                return result;
            }
        }
    } else if (node.type === "Equation") {
        const lhs = findNode(node.left, id);
        if (lhs) return lhs;
        const rhs = findNode(node.right, id);
        if (rhs) return rhs;
    } else if (node.type === "Fraction") {
        const num = findNode(node.numerator, id);
        if (num) return num;
        const den = findNode(node.denominator, id);
        if (den) return den;
    }
}

document.addEventListener('click', function(e) {
    const layoutNode = flattenedLayout.hitTest(e.pageX, e.pageY);
    if (layoutNode) {
        const {id} = layoutNode;
        const selectedNode = findNode(eqn1, id);

        if (selectedNode) {
            if (evaluate.canTransform(selectedNode)) {
                console.log(eqn1.toString());
                evaluate.doTransform(selectedNode);
                console.log(eqn1.toString());

                flattenedLayout = createFlatLayout(eqn1, 72, canvas.width, canvas.height);
            }
        }

        if (layoutNode !== selection) {
            selection = layoutNode;
            const bounds = layoutNode.bounds;
            const items = [{
                label: 'apple',
                action: function() {
                    console.log('apple');
                    selection = null;
                    menu = null;
                    hideMenu(menu);
                },
            }, {
                label: 'banana',
                action: function() {
                    console.log('banana');
                    selection = null;
                    menu = null;
                    hideMenu(menu);
                }
            }, {
                label: 'cupcake',
                action: function() {
                    console.log('cupcake');
                    selection = null;
                    menu = null;
                    hideMenu(menu);
                    draw();
                }
            }];

            showMenu(items, (bounds.left + bounds.right) / 2, bounds.top - 10);
        } else {
            selection = null;
            hideMenu(menu);
        }
    } else {
        selection = null;
        hideMenu(menu);
    }

    draw();
});

let menu = null;

function hideMenu(menu) {
    if (menu) {
        document.body.removeChild(menu);
        menu = null;
    }
}

function showMenu(items, x, y) {
    if (menu) {
        document.body.removeChild(menu);
    }
    menu = document.createElement('div');
    const k = 160;
    const a = 0.95;

    const container = document.createElement('div');
    Object.assign(container.style, {
        display: 'inline-block',
        backgroundColor: `rgba(${k},${k},${k},${a})`,
        color: 'white',
        fontSize: '36px',
        fontFamily: 'Helvetica',
        fontWeight: '100',
        padding: '10px',
        borderRadius: '10px',
    });

    Object.assign(menu.style, {
        display: 'inline-block',
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translate(-50%, -100%)',
    });

    const ul = document.createElement('ul');
    Object.assign(ul.style, {
        listStyleType: 'none',
        padding: 0,
        margin: 0
    });

    for (const item of items) {
        const li = document.createElement('li');
        Object.assign(li.style, {
            cursor: 'pointer',
        });
        li.onmouseover = () => li.style.color = 'rgb(255,255,128)';
        li.onmouseout = () => li.style.color = 'white';
        li.innerText = item.label;
        li.onclick = item.action;
        ul.appendChild(li);
    }
    container.appendChild(ul);
    menu.appendChild(container);

    const triangle = document.createElement('div');
    Object.assign(triangle.style, {
        width: 0,
        height: 0,
        borderStyle: 'solid',
        borderWidth: '10px 10px 0 10px',
        borderColor: `rgba(${k},${k},${k},${a}) transparent transparent transparent`,
        margin: 'auto'
    });

    menu.appendChild(triangle);

    // TODO: cleanup event listeners when removing menu
    container.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    document.body.appendChild(menu);
}