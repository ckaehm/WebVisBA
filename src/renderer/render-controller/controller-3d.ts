import { ImageDataObject } from "../../utils/own-types";
import { RenderController } from "./render-controller";

export class Controller3D extends RenderController {
    constructor(data: ImageDataObject | undefined, material: THREE.ShaderMaterial, canvas: HTMLCanvasElement, htmlInfo: HTMLElement) {
        super(data, material, canvas, htmlInfo)
    }
    protected appendHtmlInfoChild(): void {
        // not specific Html Info
    }
    protected clearHtmlInfoTextChild(): void {
    }
    protected releaseInChild(): void {
    }
    protected onWheel(): void {
        // no specific changes on wheel
    }
    protected updateControllerChild(): void {
    }

}