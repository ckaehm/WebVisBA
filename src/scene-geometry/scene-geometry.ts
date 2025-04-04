import * as THREE from "three";
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
    [ModuleInOutPutTypes.ImageData]: 0,
    [ModuleInOutPutTypes.Scene]: 1,
    [ModuleInOutPutTypes.BaseObject]: 0,
};

export abstract class SceneGeometry extends Module {
    protected geometry: THREE.BufferGeometry | undefined;
    protected material: THREE.Material | undefined;
    protected mesh: THREE.Mesh | undefined;

    constructor(moduleName: string, geometry: THREE.BufferGeometry, material: THREE.Material) {
        super(inputModuleList, outputModuleList, 'sceneGeometry', moduleName)

        this.geometry = geometry;
        this.material = material;

        this.mesh = new THREE.Mesh(
            this.geometry,
            this.material
        );

        if (this.sceneDataOutputs) {
            this.sceneDataOutputs[0].data = this.mesh;
        }
    }

    protected onUpdateImageDataInput(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    protected onUpdateSceneInput(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    protected onUpdateBaseObjectInput(): Promise<void> {
        throw new Error("Method not implemented.");
    }

    protected onDialogSubmitCallback(value: any): void {
        throw new Error("Method not implemented.");
    }

    protected releaseInChild(): void {
        this.material?.dispose();
        this.geometry?.dispose();
        delete this.material;
        delete this.geometry;
        delete this.mesh;
    }
}