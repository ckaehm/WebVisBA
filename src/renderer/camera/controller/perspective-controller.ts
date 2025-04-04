import { CameraController } from "./camera-controller";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import * as THREE from "three";

export class PerspectiveController extends CameraController {
    private controller: OrbitControls | undefined;
    constructor(canvas: HTMLCanvasElement, camera: THREE.PerspectiveCamera) {
        super(canvas, camera);
        if (this.camera) {
            this.controller = new OrbitControls(this.camera, this.canvas);
            if (this.controller) {

                // disable zoom from THREE OrbitControls, as there is an own implementation here
                this.controller.enableZoom = false;

                // remove all references to the mouse actions used by the controls except rotation
                // PAN with CTRL and left mouse button is also provided by this specification
                this.controller.mouseButtons = {
                    LEFT: THREE.MOUSE.ROTATE
                }
            }
        }

    }

    protected onMouseMove(deltaX: number, deltaY: number): void {
        // not necessary, as THREE OrbitControls handles the mouse movement control
    }
    protected onWheel(delta: number): void {
        if (this.camera) {
            if (delta > 0.0) {
                // Zoom out
                this.camera.zoom *= 0.98;
            } else {
                // Zoom in
                this.camera.zoom *= 1.02;
            }
        }
    }

    protected releaseInChild(): void {
        delete this.controller;
    }
}