import './style.scss';
import './style.less';
import colors from './colors';

const select = document.querySelector('select');
const container = document.getElementById('selected-squares-container');

function createOptions () {
    const fragment = document.createDocumentFragment();
    for (let key in colors) {
        const option = document.createElement('option');
        option.textContent = key;
        option.setAttribute('value', colors[key]);
        fragment.appendChild(option);
    }
    select.appendChild(fragment);
}

function createSquare (type) {
    const square = document.createElement('div');
    square.className = `square ${type}`;
    return square;
}

function addSquare (e) {
    e.preventDefault();
    const type = select.options[select.selectedIndex].text;
    container.appendChild(createSquare(type));
}

function setupButtonHandler () {
    document.getElementById('add-square-button')
        .addEventListener('click', addSquare);
}

createOptions();
setupButtonHandler();
