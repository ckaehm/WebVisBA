import './index.scss';
import './index.html'
import WebGL from 'three/examples/jsm/capabilities/WebGL';
import { WorkspaceController } from './utils/workspace-contoller';

// set error message on website, if WebGL is not supported
if (WebGL.isWebGL2Available() === false) {

  document.body.appendChild(WebGL.getWebGL2ErrorMessage());

}

// see https://dmitripavlutin.com/ecmascript-modules-dynamic-import/, visited 05.02.23
async function addModule(moduleName: string) {
  // the browser will resolve this import and fail if the file doesn't exist
  let module = await import(`./module/modules/${moduleName}.ts`);
  new module.default()
}

/* import * as fs from 'fs';
** -> is not possible as fs is not accessible on client side website
** solution to get module names: create own context with directory
** -> https://webpack.js.org/guides/dependency-management/#requirecontext, visited 07.02.23 */
declare const require: any;
function getModuleNames(r: any) {
  // the path is in the format ./module.ts
  // see https://javascript.plainenglish.io/javascript-capitalize-first-letter-of-each-word-in-string-22b631395937, visited 07.02.23
  return r.keys().filter((file: any) => file.includes('module/modules/'))
    .map((modulePath: string) => modulePath.split('/')[modulePath.split('/').length - 1].split('.')[0])
}
/* filenames ending with .ts
** see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions/Cheatsheet, visited 07.02.23 */
const modules = getModuleNames(require.context('./module/modules', false, /.ts$/));

const modulesDropdown = document.getElementById('modulesDropdown')
modules.forEach((module: string) => {
  const button = document.createElement('button')
  button.addEventListener('click', () => {
    addModule(module);
  })
  // set first char to upper case as all imported modules are in lowercase
  button.innerText = module.split('-').map(moduleName => moduleName.charAt(0).toUpperCase() + moduleName.slice(1)).join(' ');
  button.classList.add('moduleButton')
  modulesDropdown?.appendChild(button)
});

// toggle display of module list
const button = document.getElementById('dropdbutton');
button?.addEventListener('click', () => {
  modulesDropdown?.classList.toggle('displayBlock')
})
const workspace = document.getElementById('workspace');
workspace?.addEventListener('click', () => {
  // close module list
  modulesDropdown?.classList.remove('displayBlock');
})

let toggleCanvasButton = document.getElementById('toggleCanvas');
toggleCanvasButton?.addEventListener('click', () => {
  if (document.getElementById('renderCanvas')) {
    document.body.classList.toggle('canvasWindowWidth');
  }
})

// functions in a separate file that allow zooming, panning and resizing the workspace
WorkspaceController();
