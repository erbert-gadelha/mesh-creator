//import dog from './demostrations/dog.svg';

const box = document.getElementById('box');
const path =  document.getElementById('path');
const line =  document.getElementById('line-path');
const actions = [];
const revertedActions = [];
let size_ = 0;

const dots = [];

const draging = {dot: null}
const mousePos = {x:0, y:0};
const rawMouse = {x:0, y:0};
const dot_size = 10/2;
let targetEdge = -1;
let saving = true;

const mouseButtons = {left: false, middle: false, right: false};


const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
const getMousePosition = (event) => {
    const rectBox = box.getBoundingClientRect();

    rawMouse.x = event.clientX - rectBox.left;
    rawMouse.y = event.clientY - rectBox.top;

    mousePos.x = clamp(rawMouse.x, 0, rectBox.width);
    mousePos.y = clamp(rawMouse.y, 0, rectBox.height);
    
    const ratioW = 100/rectBox.width;
    mousePos.x = parseInt(ratioW*mousePos.x);
    mousePos.y = parseInt(ratioW*mousePos.y);


    if(draging.dot != null) {
        if(mouseButtons.left == false)
            ReleaseDot();
        else {
            draging.dot.style.left = `${mousePos.x}%`;
            draging.dot.style.top  = `${mousePos.y}%`;
            redraw();
        }
    } else {
        nearestEdges();
    }
};

box.addEventListener('mousemove', getMousePosition);

box.addEventListener('contextmenu', function(event) {
    event.preventDefault();
});

window.addEventListener('mouseup' , (event) => {
    switch(event.button) {
        case 0:
            mouseButtons.left   = false;
            break;
        case 1:
            mouseButtons.middle = false;
            break;
        case 2:
            mouseButtons.right  = false;
            break;
    }
    
});

window.addEventListener('mousedown' , (event) => {
    switch(event.button) {
        case 0:
            mouseButtons.left   = true;
            break;
        case 1:
            mouseButtons.middle = true;
            break;
        case 2:
            mouseButtons.right  = true;
            break;
    }
});

box.addEventListener('mousedown' , (event) => {
    
    if(event.button !== 0)
        return;

    CreateDot(mousePos);

    targetEdge = -1;
    drawLine();
    redraw();
});

function CreateDot(position) {
    const dot = document.createElement('div');

    dot.id = `dot${size_++}`;
    dot.classList.add('dot');

    dot.style.left = `${position.x}%`;
    dot.style.top  = `${position.y}%`;
    
    box.appendChild(dot);
    dots.splice(parseInt(targetEdge)+1, 0, dot);

    dot.addEventListener('mousedown', (event) => {
        event.stopPropagation();

        if(event.button == 2)
            RemoveDot(dots.indexOf(dot));
        
        if(event.button == 0) {
            mouseButtons.left = true;
            GrabDot(dot);
        }
    });

    SaveAction({
        action: 'create',
        index: dots.indexOf(dot),
        position: {
            x: parseInt(dot.style.left),
            y: parseInt(dot.style.top)
    }});

    return dot;
}


const prevPositition = {x:0, y:0};
function GrabDot (dot) {
    draging.dot = dot;
    prevPositition.x = parseInt(dot.style.left);
    prevPositition.y = parseInt(dot.style.top);
    targetEdge = -1;
    drawLine();

}

function ReleaseDot () {
    if(draging.dot == null){
        console.warn('ReleaseDot: draging.dot == null');
        return;
    }

    const dot = draging.dot;
    draging.dot = null;
    
    const delta = {
        x:prevPositition.x - parseInt(dot.style.left),
        y:prevPositition.x - parseInt(dot.style.left)
    };


    if(delta.x!=0 || delta.y!=0)
        SaveAction({
            action: 'move',
            index: dots.indexOf(dot),
            position: {
                x: prevPositition.x,
                y: prevPositition.y
            }
        });
}

function RemoveDot(index) {
    const dot = dots[index];

    SaveAction({
        action: 'remove',
        index: dots.indexOf(dot),
        position: {
            x: parseInt(dot.style.left),
            y: parseInt(dot.style.top)
        }
    });
    
    dots.splice(index, 1);
    dot.remove();
    redraw();

    targetEdge = -1;
    drawLine();


    return;
}

function redraw () {

    let pathString = '';

    if(dots.length > 0) {
        const x = parseInt(dots[0].style.left);
        const y = parseInt(dots[0].style.top);
        pathString = `${x} ${y}`;

        for(let index = 1; index < dots.length; index++) {
            const x = parseInt(dots[index].style.left);
            const y = parseInt(dots[index].style.top);
            pathString += `, ${x} ${y}`;
        }
    }

    if(pathString.length == 0)
        pathString = '0 0'
    
    path.setAttribute('d', `M${pathString}z`);
};

function nearestEdges () {
    if(draging.dot != null)
        return;

    const distances = {}

    dots.forEach((dot, index) => {
        const target = {
            x: (parseInt(dots[index].style.left)+parseInt(dots[(index+1)%dots.length].style.left))/2,
            y: (parseInt(dots[index].style.top)+parseInt(dots[(index+1)%dots.length].style.top))/2
        };
        distances[index] = (Math.pow(target.x - mousePos.x, 2) + Math.pow(target.y - mousePos.y, 2));
    });

    // Create items array
    var items = Object.keys(distances).map(function(key) { return [key, distances[key]]; });
    items.sort(function(first, second) { return first[1] - second[1]; });
    
    if(items.length > 1)
        targetEdge = items[0][0];
    else
        targetEdge = -1;

    drawLine();

}

function drawLine () {
    
    if(dots.length >= 2 && targetEdge >= 0) {
        const head = dots[targetEdge];
        const tail = dots[(parseInt(targetEdge)+1)%dots.length];
        line.setAttribute('d', `M${parseInt(head.style.left)} ${parseInt(head.style.top)}, ${parseInt(tail.style.left)} ${parseInt(tail.style.top)}z`);
    } else {
        line.setAttribute('d', '');
    }
}

function saveSVG() {
    const svgElement = document.getElementById('svg');

    if (svgElement) {
        const confirmacao = window.confirm('Deseja salvar como arquivo svg?');
        if (!confirmacao) {
            return;
        }

        const svgString = new XMLSerializer().serializeToString(svgElement);
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'svgOnly.svg';
        a.click();

        URL.revokeObjectURL(url);
    }
}

function loadSVG(event) {
    const file = event.target.files[0];
    event.target.value = null;

    if (file) {
        const reader = new FileReader();

        reader.onload = (event) => {
            const conteudoDoSVG = event.target.result;
            //console.log(conteudoDoSVG);

            refreshSVG(conteudoDoSVG)
            return conteudoDoSVG;
        };

        // Lê o arquivo como texto
        reader.readAsText(file);
    }

}

function refreshSVG(newSVG) {
    //svg.innerHTML = '';

    if(dots.length > 2) {
        const confirmacao = window.confirm('Todo progresso não salvo será perdido. Deseja continuar?');
        if (!confirmacao)
            return;
    }

    actions.splice(0, actions.length);
    revertedActions.splice(0, revertedActions.length);
    clearingReverted = true;
    saving = false;

    path.setAttribute('d', '');

    for(let i = dots.length-1; i >= 0 ; i--) RemoveDot(i);

    const tempElement = document.createElement('div');
    tempElement.innerHTML = newSVG;
    const pathElement = tempElement.querySelector('#path');

    if (pathElement) {
        const val = pathElement.getAttribute('d');
        const valorCortado = val.substring(1, val.length - 1);
        const posicoes = valorCortado.split(', ');
        
        const posicoe = [];
        posicoes.forEach((pos, index) => {
            const split = pos.split(' ');
            const param = {x: parseInt(split[0]), y: parseInt(split[1])};
            posicoe.push(param);

            CreateDot(param);
        });
        
    } else {
        console.log('Elemento <path> não encontrado.');
    }
    saving = true;
    
    targetEdge = -1;
    drawLine();
    redraw();
}

document.getElementById('fileInput').addEventListener('change', (event) => loadSVG(event));
document.getElementById('btn-save').addEventListener('click', saveSVG);



box.addEventListener('mouseenter', function() {
    dots.forEach((dot) => {
        //dot.style.overflow = 'visible';
        dot.style.display = 'block';
    });

});

box.addEventListener('mouseleave', function() {
    dots.forEach((dot) => {
        //dot.style.overflow = 'hidden';
        dot.style.display = 'none';
    });
    targetEdge = -1;
    drawLine();
});


let clearingReverted = true;
function SaveAction(action) {
    if(!saving)
        return;

    actions.push(action);
    //console.log('Save Actions', actions);
    if(clearingReverted)
        revertedActions.splice(0, revertedActions.length);
}

function RevertAction() {
    if(actions.length <= 0)
        return;

    const action = actions.pop();
    //console.log('RevertAction', action);
    saving = false;
    
    switch(action.action) {
        case 'create':
            RemoveDot(action.index);
            break;
        case 'remove':
            targetEdge = action.index-1;
            CreateDot(action.position);
            break;
        case 'move':
            console.log('move', action);
            const dot = dots[action.index];
            const temp = {x: parseInt(dot.style.left), y: parseInt(dot.style.top)};

            dot.style.left = `${action.position.x}%`;
            dot.style.top  = `${action.position.y}%`;

            action.position.x = temp.x;
            action.position.y = temp.y;

            redraw();
            break;
    }

    saving = true;

    targetEdge = -1;
    redraw();
    drawLine();
    revertedActions.push(action);
    //console.log('Revert Actions', actions);
}

function RedoAction() {
    if(revertedActions.length <= 0)
        return;

    const action = revertedActions.pop();
    console.log('RedoAction', action);
    clearingReverted = false;
    //saving = false;
    
    switch(action.action) {
        case 'create':
            targetEdge = action.index-1;
            CreateDot(action.position);
            //RemoveDot(action.index);
            break;
        case 'remove':
            RemoveDot(action.index);
            /*targetEdge = action.index-1;
            CreateDot(action.position);*/
            break;
        case 'move':
            console.log('move', action);
            const dot = dots[action.index];
            const temp = {x: parseInt(dot.style.left), y: parseInt(dot.style.top)};

            dot.style.left = `${action.position.x}%`;
            dot.style.top  = `${action.position.y}%`;

            action.position.x = temp.x;
            action.position.y = temp.y;

            SaveAction(action);

            redraw();
            break;
    }

    clearingReverted = true;
    //saving = true;

    targetEdge = -1;
    redraw();
    drawLine();
    console.log('Reverted Actions', revertedActions);
}

window.addEventListener('keydown', (event) => {
    if (event.ctrlKey && ((event.shiftKey && event.key === 'Z') || event.key === 'y'))
        RedoAction();
    else if (event.ctrlKey && event.key === 'z')
        RevertAction();
    else if (event.ctrlKey && event.key === 's'){
        event.preventDefault();
        saveSVG();
    }
});


function FetchFor(param) {
    fetch(`demostrations/${param}.svg`)
    .then(response => response.text())
    .then(svgData => {
        refreshSVG(svgData);
    })
    .catch(error => {
        console.error('Erro ao carregar o SVG:', error);
    });
}