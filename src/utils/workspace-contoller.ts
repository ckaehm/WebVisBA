import { Position } from "./own-types";

// change css variable in typescript see https://www.w3schools.com/css/css3_variables_javascript.asp, visited 21.02.23
// set type for root, otherwise an error occurs at root.style
var root = document.querySelector(':root') as HTMLElement;
var scale = 1;              // current scale

const modulesHtml = document.getElementById('modules');
const svgConnectLines = document.getElementById('connectLines');
const lines = document.getElementsByTagName('line');
const workspace = document.getElementById('workspace');

let lastWidth = workspace?.clientWidth ? workspace?.clientWidth : 0;
let lastHeight = workspace?.clientHeight ? workspace?.clientHeight : 0;

let lastLeft = 0;
let lastTop = 0;

export function WorkspaceController(): void {
    if (modulesHtml && workspace && svgConnectLines && lines) {
      workspace.addEventListener('wheel', event => {
        event.stopPropagation()
        const x = event.pageX - (modulesHtml.clientWidth / 2);
        const y = event.pageY - (modulesHtml.clientHeight / 2);
  
        if (event.deltaY > 0) {
          view.scaleAt({ x, y }, 1.1);
        } else {
          view.scaleAt({ x, y }, 1 / 1.1);
        }
        view.applyTo(modulesHtml);
        scaleConnectLines();
  
        event.preventDefault();
      }, { passive: false });
  
      workspace.addEventListener('mousemove', event => {
        if (event.buttons === 1 && event.altKey) {
          view.pan({ x: event.movementX, y: event.movementY });
          view.applyTo(modulesHtml);
          panConnectLines(event);
        }
      });
  
      // rest on contextmenu as there is a bug by opening or closing devtools
      workspace.addEventListener('contextmenu', () => {
        view.scaleReset();
        view.update();
        view.applyTo(modulesHtml)
        scaleConnectLines();
      })
  
      window.addEventListener('resize', () => onWindowResize());
    }
  
  }


/* set start and end from each line depending on the position and width&height changed from modulesHtml on wheel
** newPos = (currentPos - lastOffset) / modulesHtmlClientWidth * modulesHtmlWidth + offset */
function scaleConnectLines(): void {
  const modulesHtmlClientRect = modulesHtml?.getBoundingClientRect();
  if (modulesHtmlClientRect) {
    for (let i = 0; i < lines.length; i++) {
      const x1 = lines[i].getAttribute('x1');
      const x2 = lines[i].getAttribute('x2');
      const y1 = lines[i].getAttribute('y1');
      const y2 = lines[i].getAttribute('y2');
      if (x1 && x2 && y1 && y2) {
        lines[i].setAttribute('x1', ((parseFloat(x1) - lastLeft) / lastWidth) * modulesHtmlClientRect.width + modulesHtmlClientRect.x + 'px');
        lines[i].setAttribute('x2', ((parseFloat(x2) - lastLeft) / lastWidth) * modulesHtmlClientRect.width + modulesHtmlClientRect.x + 'px');
        lines[i].setAttribute('y1', ((parseFloat(y1) - lastTop) / lastHeight) * modulesHtmlClientRect.height + modulesHtmlClientRect.y + 'px');
        lines[i].setAttribute('y2', ((parseFloat(y2) - lastTop) / lastHeight) * modulesHtmlClientRect.height + modulesHtmlClientRect.y + 'px');
      }
    }
    lastWidth = modulesHtmlClientRect.width;
    lastHeight = modulesHtmlClientRect.height;
    lastLeft = modulesHtmlClientRect.x;
    lastTop = modulesHtmlClientRect.y
  }
}

function panConnectLines(event: MouseEvent): void {
  for (let i = 0; i < lines.length; i++) {
    const x1 = lines[i].getAttribute('x1');
    const x2 = lines[i].getAttribute('x2');
    const y1 = lines[i].getAttribute('y1');
    const y2 = lines[i].getAttribute('y2');
    if (x1 && x2 && y1 && y2) {
      lines[i].setAttribute('x1', parseInt(x1) + event.movementX + 'px');
      lines[i].setAttribute('x2', parseInt(x2) + event.movementX + 'px');
      lines[i].setAttribute('y1', parseInt(y1) + event.movementY + 'px');
      lines[i].setAttribute('y2', parseInt(y2) + event.movementY + 'px');
    }
  }

  lastLeft += event.movementX;
  lastTop += event.movementY;
}

function onWindowResize(): void {
  if (svgConnectLines) {
    // set viewBox for svg to adjust the position of the lines to the displayed svg size
    const width = window.innerWidth / 2;
    const height = window.innerHeight;
    svgConnectLines.setAttribute('viewBox', `0 0 ${width} ${height}`);
    if (modulesHtml) {

      // if modulesHtml and lines are transformed, reset. Otherwise, this.modulesHtml changes its size, thus modules changes its position, but lines do not 
      if (scale != 1) {
        view.scaleReset();
        view.update();
        view.applyTo(modulesHtml)
        scaleConnectLines();
      } else {
        // update values for this.scaleConnectLines(), otherwise lines will not be set to the correct position at the next scaling
        let modulesHtmlClientRect = modulesHtml?.getBoundingClientRect()
        lastWidth = modulesHtmlClientRect.width;
        lastHeight = modulesHtmlClientRect.height;
        lastLeft = modulesHtmlClientRect.x;
        lastTop = modulesHtmlClientRect.y
      }
    }
  }
}

// scale displayed modules to mouse position see: https://stackoverflow.com/questions/60190965/zoom-scale-at-mouse-position/60235061#60235061, visited 26.02.23
const view = (() => {
  const matrix = [1, 0, 0, 1, 0, 0]; // current view transform
  var m = matrix;             // alias 
  var dirty = true;
  const pos = { x: 0, y: 0 }; // current position of origin
  const API = {
    applyTo(el: HTMLElement) {
      if (dirty) { this.update() }
      el.style.transform = `matrix(${m[0]},${m[1]},${m[2]},${m[3]},${m[4]},${m[5]})`;
    },
    update() {
      dirty = false;
      m[3] = m[0] = scale;
      m[2] = m[1] = 0;
      m[4] = pos.x;
      m[5] = pos.y;
    },
    pan(amount: Position) {
      if (dirty) { this.update() }
      pos.x += amount.x;
      pos.y += amount.y;
      dirty = true;
    },
    scaleAt(at: Position, amount: number) { // at in screen coords
      if (dirty) {
        this.update();
      }
      scale *= amount;
      // set zoomFactor, as other component use it
      root.style.setProperty('--zoomFactor', scale.toString());
      pos.x = at.x - (at.x - pos.x) * amount;
      pos.y = at.y - (at.y - pos.y) * amount;
      dirty = true;
    },
    scaleReset() { // in screen coords
      if (dirty) {
        this.update();
      }

      scale = 1;
      // set zoomFactor, as other component use it
      root.style.setProperty('--zoomFactor', scale.toString());
      pos.x = 0;
      pos.y = 0;
      dirty = true;
    }
  };
  return API;
})();
