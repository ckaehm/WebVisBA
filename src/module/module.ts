import { IOutput } from "../output/i-output";
import { ImageDataOutput } from "../output/outputs/image-data-output";
import { BaseObjectOutput } from "../output/outputs/base-object-output";
import { SceneOutput } from "../output/outputs/scene-output";
import { IInput } from "../input/i-input";
import { ImageDataInput } from "../input/inputs/image-data-input";
import { BaseObjectInput } from "../input/inputs/base-object-input";
import { SceneInput } from "../input/inputs/scene-input";
import { ModuleInOutPut, ImageDataObject, BaseObject, SceneObject } from "../utils/own-types";
import { IDialog } from "../dialog/i-dialog";
import openIcon from "../assets/open_dialog.svg"

/*
To create a new concrete module, the values are provided by inheritance with this class:
    * inputs: ModuleInOutPut -> number of Inputs
    * outputs: ModuleInOutPut -> number of Outputs
    * moduleType: string -> a CSS class to style the HTML of the module
    * moduleName: string -> module name, which will be displayed in the module
    * dialog: IDialog -> if necessary a dialog

Also the Methods have to be implemented :
    * onUpdateImageDataInput() -> define what should happen when imageData input is updated.
                                If the module has an output, the relevant output element should also be updated here (imageDataOutputs, sceneDataOutputs, baseObjectsOutputs)
                                and then notifyOutputs() has to be called.
                                Current input data are available in array imageDataInputs, sceneDataInputs, baseObjectInputs.
                                No information which specific imageData input was changed.
                                Only the type, because the specific method onUpdateImageDataInput is called when an imageData input is updated.
    * onUpdateSceneInput() -> same as for onUpdateImageDataInput()
    * onUpdateBaseObjectInput() -> same as for onUpdateImageDataInput()
    * onDialogSubmitCallback(value: any) -> callback that is passed to a created dialog. Specify what should happen on callback
    * releaseInChild() -> delete classes variables
    * setInnerModule() -> customize html of the module. Use variable innerModule or if necessary html

Put file in directory "scr/module/modules" and declare the class with "export default class <Klassenname> extends Module{}"
*/

export abstract class Module {
    protected moduleName: string | undefined;

    // output data
    // separate output object is required, since the input reference from other module would be overwritten if the data were changed in this module
    // only new object if data changed in module
    protected imageDataOutputs: Array<ImageDataObject> | undefined = [];
    protected sceneDataOutputs: Array<SceneObject> | undefined = [];
    protected baseObjectsOutputs: Array<BaseObject> | undefined = [];
    // input data
    protected imageDataInputs: Array<ImageDataObject> | undefined = [];
    protected sceneDataInputs: Array<SceneObject> | undefined = [];
    protected baseObjectInputs: Array<BaseObject> | undefined = [];

    protected html: HTMLElement | undefined = document.createElement('div');
    protected innerModule: HTMLElement | undefined;

    // array for each input type not required, because each input has its own callback function
    private inputElements: Array<IInput> | undefined = [];
    private outputImageDataElements: Array<IOutput> | undefined = [];
    private outputSceneElements: Array<IOutput> | undefined = [];
    private outputBaseObjectElements: Array<IOutput> | undefined = [];

    private positionTop: number | undefined = 0;
    private positionLeft: number | undefined = 0;
    private clicked: boolean | undefined = false;
    private root: HTMLElement | undefined = document.querySelector(':root') as HTMLElement;

    private htmlInput: HTMLElement | undefined = document.createElement('section');
    private htmlOutput: HTMLElement | undefined = document.createElement('section');
    private removeButton: HTMLButtonElement | undefined = document.createElement('button');

    // dialog
    private dialog: IDialog | undefined;
    private dialogIcon: HTMLImageElement | undefined = document.createElement('img');

    constructor(inputs: ModuleInOutPut, outputs: ModuleInOutPut, moduleType: string, moduleName: string, dialog: IDialog | undefined = undefined) {
        this.html?.classList.add(moduleType);

        this.moduleName = moduleName;

        this.dialog = dialog;

        this.createInput(inputs);
        this.createOutput(outputs);

        this.createModuleHtml();
        this.setInnerModule();
        this.onMoveModule();
        this.onDestroy();


        if (this.dialogIcon && this.dialog) {
            this.dialogIcon.src = openIcon;
            this.dialogIcon.classList.add('icon');
            this.innerModule?.appendChild(this.dialogIcon)
            this.onDblClickOpenDialog();
        }
    }

    // in onUpdate...DataInput update the outputs module
    protected abstract onUpdateImageDataInput(): Promise<void>;
    protected abstract onUpdateSceneInput(): Promise<void>;
    protected abstract onUpdateBaseObjectInput(): Promise<void>;
    protected abstract onDialogSubmitCallback(value: any): void;
    protected abstract releaseInChild(): void;
    protected abstract setInnerModule(): void;

    protected notifyOutputs(): void {
        this.notifyImageDataOutputs();
        this.notifySceneOutputs();
        this.notifyBaseObjectOutputs();
    }

    private notifyImageDataOutputs(): void {
        this.outputImageDataElements?.forEach((outP: IOutput) => {
            outP.notifyConInputs();
        })
    }
    private notifySceneOutputs(): void {
        this.outputSceneElements?.forEach((outP: IOutput) => {
            outP.notifyConInputs()
        })
    }
    private notifyBaseObjectOutputs(): void {
        this.outputBaseObjectElements?.forEach((outP: IOutput) => {
            outP.notifyConInputs()
        })
    }

    private createInput(inputs: ModuleInOutPut): void {
        if (this.htmlInput && this.inputElements) {
            // ImageData
            if (this.imageDataInputs) {
                for (let i = 0; i < inputs[0]; i++) {
                    const newImageData = new ImageDataObject();
                    this.imageDataInputs.push(newImageData);
                    this.inputElements?.push(new ImageDataInput(() => this.onUpdateInputImageDataCallback(), newImageData, this.htmlInput))
                }
            }

            // Scene
            if (this.sceneDataInputs) {
                for (let i = 0; i < inputs[1]; i++) {
                    const newSceneObject = new SceneObject();
                    this.sceneDataInputs.push(newSceneObject);
                    this.inputElements.push(new SceneInput(() => this.onUpdateInputSceneCallback(), newSceneObject, this.htmlInput))
                }
            }

            // BaseObject
            if (this.baseObjectInputs) {
                for (let i = 0; i < inputs[2]; i++) {
                    const newBaseObject = new BaseObject();
                    this.baseObjectInputs.push(newBaseObject);
                    this.inputElements.push(new BaseObjectInput(() => this.onUpdateInputBaseObjectCallback(), newBaseObject, this.htmlInput))
                }
            }
        }
    }

    private createOutput(outputs: ModuleInOutPut): void {
        if (this.htmlOutput) {
            // ImageData
            if (this.imageDataOutputs && this.outputImageDataElements) {
                for (let i = 0; i < outputs[0]; i++) {
                    const newImageData = new ImageDataObject();
                    this.imageDataOutputs.push(newImageData);
                    this.outputImageDataElements.push(new ImageDataOutput(newImageData, this.htmlOutput))
                }
            }

            // Scene
            if (this.sceneDataOutputs && this.outputSceneElements) {
                for (let i = 0; i < outputs[1]; i++) {
                    const newSceneObject = new SceneObject();
                    this.sceneDataOutputs.push(newSceneObject);
                    this.outputSceneElements.push(new SceneOutput(newSceneObject, this.htmlOutput))
                }
            }


            // BaseObject
            if (this.baseObjectsOutputs && this.outputBaseObjectElements) {
                for (let i = 0; i < outputs[2]; i++) {
                    const newBaseObject = new BaseObject();
                    this.baseObjectsOutputs.push(newBaseObject);
                    this.outputBaseObjectElements.push(new BaseObjectOutput(newBaseObject, this.htmlOutput))
                }
            }
        }
    }

    private createModuleHtml() {
        if (this.html && this.htmlOutput && this.htmlInput && this.removeButton) {
            this.html.classList.add('module');
            document.getElementById('modules')?.appendChild(this.html);
            this.innerModule = document.createElement('section');
            this.innerModule.innerHTML = `
                <p>${this.moduleName}</p>
            `;
            this.htmlInput.classList.add('input');
            this.htmlOutput.classList.add('output');
            this.innerModule.classList.add('innerModule');
            this.removeButton.classList.add('remove');
            this.removeButton.innerHTML = '<p>x</p>';
            this.html.appendChild(this.htmlOutput)
            this.html.appendChild(this.innerModule);
            this.html.appendChild(this.htmlInput);
            this.html.appendChild(this.removeButton);
        }
    }

    private destroy(): void {
        this.html?.remove();
        this.releaseResources();
        this.releaseInChild();
    }

    private onDestroy(): void {
        this.removeButton?.addEventListener('click', () => {
            this.destroy();
        })
    }

    private onDblClickOpenDialog(): void {
        this.dialogIcon?.addEventListener('dblclick', () => {
            this.dialog?.openDialog();
        });
    }

    private onMoveModule(): void {
        this.html?.addEventListener('mousedown', () => {
            this.clicked = true;
        })
        document.addEventListener('mouseup', () => {
            this.clicked = false;
        })
        document.getElementById('workspace')?.addEventListener('mousemove', event => {
            if (this.clicked && !event.ctrlKey) {
                if (this.html && this.positionTop != undefined && this.positionLeft != undefined && this.root && this.outputImageDataElements && this.outputSceneElements && this.outputBaseObjectElements && this.inputElements) {
                    // get CSS Variable see: https://www.w3schools.com/css/css3_variables_javascript.asp, visited 21.02.23
                    // zoomFactor is needed as the zoom changes the speed at which the element changes its position when the mouse moves
                    this.positionTop += event.movementY / Number(getComputedStyle(this.root).getPropertyValue('--zoomFactor'));
                    this.positionLeft += event.movementX / Number(getComputedStyle(this.root).getPropertyValue('--zoomFactor'));
                    this.html.style.top = this.positionTop + 'px';
                    this.html.style.left = this.positionLeft + 'px';

                    this.outputImageDataElements.forEach((output: IOutput) => {
                        output.updateStartLine(event.movementX, event.movementY);
                    })
                    this.outputSceneElements.forEach((output: IOutput) => {
                        output.updateStartLine(event.movementX, event.movementY);
                    })
                    this.outputBaseObjectElements.forEach((output: IOutput) => {
                        output.updateStartLine(event.movementX, event.movementY);
                    })
                    this.inputElements.forEach((input: IInput) => {
                        input.updateEndLine(event.movementX, event.movementY);
                    })
                }
            }
        })
    }

    private async onUpdateInputImageDataCallback(): Promise<void> {
        await this.onUpdateImageDataInput();
        this.notifyOutputs();
    };
    private async onUpdateInputSceneCallback(): Promise<void> {
        await this.onUpdateSceneInput();
        this.notifyOutputs();
    };
    private async onUpdateInputBaseObjectCallback(): Promise<void> {
        await this.onUpdateBaseObjectInput();
        this.notifyOutputs();
    };

    private releaseResources(): void {
        // delete only the output data, as the input data have the reference to the connected module. So the data would be deleted there too
        this.imageDataOutputs?.forEach((outputElement: ImageDataObject) => {
            if (outputElement.data)
                outputElement.data.data = undefined
        })
        this.sceneDataOutputs?.forEach((outputElement: SceneObject) => {
            if (outputElement.data)
                outputElement.data = undefined
        })
        this.baseObjectsOutputs?.forEach((outputElement: BaseObject) => {
            if (outputElement.data)
                outputElement.data = undefined
        })

        this.outputImageDataElements?.forEach((output: IOutput) => {
            output.destroy();
        })
        this.outputSceneElements?.forEach((output: IOutput) => {
            output.destroy();
        })
        this.outputBaseObjectElements?.forEach((output: IOutput) => {
            output.destroy();
        })
        this.inputElements?.forEach((input: IInput) => {
            input.destroy();
        })
        delete this.moduleName;
        delete this.imageDataInputs;
        delete this.sceneDataInputs;
        delete this.baseObjectInputs;
        delete this.html
        delete this.innerModule
        delete this.inputElements
        delete this.outputImageDataElements
        delete this.outputSceneElements
        delete this.outputBaseObjectElements
        delete this.positionTop
        delete this.positionLeft
        delete this.clicked
        delete this.root
        delete this.htmlInput
        delete this.htmlOutput
        delete this.removeButton
        this.dialog?.destroy();
        delete this.dialog;
        delete this.dialogIcon;
    }
}