import { Module } from "../module/module";
import { ModuleInOutPutTypes } from "../utils/enum-input-output-module";
import { ModuleInOutPut } from "../utils/own-types";

// all Enum keys have to be set
const inputModuleList: ModuleInOutPut = {
    [ModuleInOutPutTypes.ImageData]: 0,
    [ModuleInOutPutTypes.Scene]: 0,
    [ModuleInOutPutTypes.BaseObject]: 0,
};

// all Enum keys have to be set
const outputModuleList: ModuleInOutPut = {
    [ModuleInOutPutTypes.ImageData]: 1,
    [ModuleInOutPutTypes.Scene]: 0,
    [ModuleInOutPutTypes.BaseObject]: 0,
};

export abstract class DataLoader extends Module {
    protected index: number | undefined = 0;
    constructor(moduleName: string) {
        /* imageData, sceneData, baseObject have to be set directly in the constructor super()
        ** defining a variable in the class is not possible, as 'super' must be called before accessing 'this'
        ** and defining a variable outside the class defines a static variable, so all class objects have the same memory reference */
        super(inputModuleList, outputModuleList, 'dataLoader', moduleName);

        this.setImageData();
    }

    protected abstract loadFile(): Promise<Blob | undefined>;
    protected abstract releaseInDataLoadChild(): void;
    // set Data Properties dataType, modality, width, height, depth, voxelSize in this.imageDataOutputs[0].data
    protected abstract setDataProperties(): void;

    protected onDialogSubmitCallback(value: any): void {
        throw new Error("Method not implemented.");
    }

    protected onUpdateImageDataInput(): Promise<void> {
        throw Error('DataLoader has no input. Therefore, the callback function should never be called.')
    }

    protected async onUpdateSceneInput(): Promise<void> {
        throw Error('DataLoader has no input. Therefore, the callback function should never be called.')
    }

    protected async onUpdateBaseObjectInput(): Promise<void> {
        throw Error('DataLoader has no input. Therefore, the callback function should never be called.')
    }

    protected async setImageData(): Promise<void> {
        const blob: Blob | undefined = await this.loadFile();
        await this.setDataProperties();
        await this.setDataElement(blob);
        this.notifyOutputs();
    }

    protected releaseInChild() {
        delete this.index;
        this.releaseInDataLoadChild();
    }

    private async setDataElement(data: Blob | undefined): Promise<void> {
        let buffer = await new Response(data).arrayBuffer();
        if (this.imageDataOutputs?.[0].data?.dataType === 'Uint8') {
            this.imageDataOutputs[0].data.data = new Uint8Array(buffer);
        } else if (this.imageDataOutputs?.[0].data?.dataType === 'Uint16') {
            this.imageDataOutputs[0].data.data = new Uint16Array(buffer);
        } else {
            throw new TypeError('Data type not supported');
        }
    }
}