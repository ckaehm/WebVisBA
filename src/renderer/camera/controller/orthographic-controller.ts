import * as THREE from 'three';
import { CameraController } from "./camera-controller";

export class OrthographicController extends CameraController {
    constructor(canvas: HTMLCanvasElement, camera: THREE.OrthographicCamera) {
        super(canvas, camera);
    }

    protected onMouseMove(deltaX: number, deltaY: number): void {
        if (this.camera) {
            // change position depending on zoom factor with fixed correction value
            const correction: number = 1.9;
            this.camera.position.x -= deltaX / (1000 * this.camera.zoom / correction);
            this.camera.position.y += deltaY / (1000 * this.camera.zoom / correction);
        }
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
    }
}
