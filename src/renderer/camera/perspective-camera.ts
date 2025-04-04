import * as THREE from "three";
import { Camera } from "./camera";
import { PerspectiveController } from "./controller/perspective-controller";

export class PerspectiveCamera extends Camera {
    protected camera: THREE.PerspectiveCamera | undefined;

    constructor(canvas: HTMLCanvasElement) {
        super(canvas);
        this.camera = new THREE.PerspectiveCamera();

        this.setStartCamera();
        if (this.canvas) {
            this.cameraController = new PerspectiveController(this.canvas, this.camera);
        } else {
            throw Error('canvas not defined!')
        }
    }

    public getCamera(): THREE.PerspectiveCamera {
        if (this.camera) {
            return this.camera;
        }
        throw Error('camera not defined!');
    }

    protected setStartCamera(): void {
        if (this.canvas) {
            const aspect = this.canvas.width / this.canvas.height;
            this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 100)
            this.camera.aspect = aspect;

            this.camera.position.set(0, 0, 1.5);
            this.camera.updateProjectionMatrix();
        } else {
            throw Error('canvas not defined!')
        }
    }
    protected updateCamera(): void {
        if (this.camera) {
            if (this.canvas) {
                let aspect: number;
                aspect = this.canvas.clientWidth / this.canvas.clientHeight;
                this.camera.aspect = aspect
                this.camera.updateProjectionMatrix()
            } else {
                throw Error('canvas not defined!')
            }
        }
    }
}