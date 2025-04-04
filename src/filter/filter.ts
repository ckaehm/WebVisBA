import { IDialog } from "../dialog/i-dialog";
import { Module } from "../module/module";
import { ModuleInOutPutTypes } from "../utils/enum-input-output-module";
import { ModuleInOutPut } from "../utils/own-types";

// all Enum keys have to be set
const inputModuleList: ModuleInOutPut = {
    [ModuleInOutPutTypes.ImageData]: 1,
    [ModuleInOutPutTypes.Scene]: 0,
    [ModuleInOutPutTypes.BaseObject]: 0,
};

// all Enum keys have to be set
const outputModuleList: ModuleInOutPut = {
    [ModuleInOutPutTypes.ImageData]: 1,
    [ModuleInOutPutTypes.Scene]: 0,
    [ModuleInOutPutTypes.BaseObject]: 0,
};

export abstract class Filter extends Module {
    protected kernel: number[] | undefined;

    constructor(moduleName: string, kernel: number[], dialog: IDialog | undefined) {
        super(inputModuleList, outputModuleList, 'filter', moduleName, dialog);
        this.kernel = kernel;
    }

    protected abstract updateKernel(value: any): void;
    protected abstract setFilteredOutput(): void;
    protected abstract releaseFilterChild(): void;


    protected async onDialogSubmitCallback(value: any): Promise<void> {
        this.updateKernel(value);
        await this.setFilteredOutput();
        this.notifyOutputs();
    };



    protected async onUpdateSceneInput(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    protected async onUpdateBaseObjectInput(): Promise<void> {
        throw new Error("Method not implemented.");
    }

    protected releaseInChild(): void {
        delete this.kernel;
        this.releaseFilterChild();
    }

    protected setImageDataProperties(): void {
        if (this.imageDataOutputs) {
            /* deep copy not possible with 
            ** this.imageDataOutputs[0].data = Object.assign({}, this.imageDataInputs?.[0].data)
            ** as this.imageDataOutputs[0] is a nested data object, and then this output data reference, if module is already connected, would be overwritten */
            if (this.imageDataOutputs?.[0].data && this.imageDataInputs?.[0].data) {
                this.imageDataOutputs[0].data.dataType = this.imageDataInputs?.[0].data.dataType
                this.imageDataOutputs[0].data.modality = this.imageDataInputs?.[0].data.modality
                this.imageDataOutputs[0].data.height = this.imageDataInputs?.[0].data.height
                this.imageDataOutputs[0].data.width = this.imageDataInputs?.[0].data.width;
                this.imageDataOutputs[0].data.depth = this.imageDataInputs?.[0].data.depth;
                this.imageDataOutputs[0].data.voxelSize = this.imageDataInputs?.[0].data.voxelSize
            }
        }
    }

}