import { DataObject } from './data-object';
import { ModuleInOutPutTypes } from './enum-input-output-module';
import * as THREE from 'three';
import { IInput } from '../input/i-input';
import { ShaderObject } from './shader-object';

export type ConnectServiceCallback = (inp: IInput) => void;

export type CallbackToModule = () => Promise<void>;
export type ConOutPRemoveCallback = (inp: IInput) => void;

export type DialogSubmitCallback = (number: number) => void;
export type DialogDefaultSubmitCallback = (value: any) => void;

export type ModuleInOutPut = {
    [ModuleInOutPutTypes.ImageData]: number;
    [ModuleInOutPutTypes.Scene]: number;
    [ModuleInOutPutTypes.BaseObject]: number;
}

export type Position = {
    x: number;
    y: number;
  };

// input/output data types
// all have the same fields so that use is simplified
// ? is needed cause the type undefined
export class ImageDataObject {
    data?: DataObject | undefined = new DataObject;
    shader?: ShaderObject | undefined = new ShaderObject;
}

export class SceneObject {
    data?: THREE.Mesh | undefined = undefined;
}

export class BaseObject {
    data?: string | undefined = undefined;
}

export type VoxelSize = {
    x: number,
    y: number,
    z: number
}