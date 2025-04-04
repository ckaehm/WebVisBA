import { ImageDataObject, BaseObject, SceneObject, ConOutPRemoveCallback } from "../utils/own-types";

export interface IInput {
    destroy(): void
    onConnected(): void
    removeConOutP(): void;
    setConnectLine(line: SVGLineElement): void;
    setData(data: ImageDataObject | SceneObject | BaseObject | undefined): void;
    setCallbackToConOutP(callback: ConOutPRemoveCallback): void
    update(): void;
    updateEndLine(x: number, y: number): void;
}