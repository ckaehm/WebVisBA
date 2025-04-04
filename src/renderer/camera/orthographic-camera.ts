import * as THREE from 'three';
import { OrthographicController } from './controller/orthographic-controller';
import { Camera } from './camera';

export class OrthographicCamera extends Camera {
    protected camera: THREE.OrthographicCamera | undefined;

    constructor(canvas: HTMLCanvasElement) {
        super(canvas);
        this.camera = new THREE.OrthographicCamera();

        this.setStartCamera();
        if (this.canvas) {
            this.cameraController = new OrthographicController(this.canvas, this.camera);
        } else {
            throw Error('canvas not defined!')
        }

    }

    public getCamera(): THREE.OrthographicCamera {
        if (this.camera) {
            return this.camera;
        }
        throw Error('camera not defined!');
    }

    protected setStartCamera(): void {
        let aspect: number;

        if (this.canvas) {
            if (this.canvas.height < this.canvas.width) {
                aspect = this.canvas.width / this.canvas.height;
                this.camera = new THREE.OrthographicCamera(-aspect / 2, aspect / 2, 1 / 2, -1 / 2, 1, 1000);
            } else {
                aspect = this.canvas.height / this.canvas.width;
                this.camera = new THREE.OrthographicCamera(-1 / 2, 1 / 2, aspect / 2, -aspect / 2, 1, 1000);
            }
            this.camera.position.set(0, 0, 1);
            this.camera.lookAt(new THREE.Vector3(0, 0, 0));
        } else {
            throw Error('canvas not defined!')
        }

    }

    protected updateCamera(): void {
        if (this.camera) {
            let aspect: number;

            if (this.canvas) {
                if (this.canvas.height < this.canvas.width) {
                    aspect = this.canvas.clientWidth / this.canvas.clientHeight;
                    this.camera.left = -aspect / 2;
                    this.camera.right = aspect / 2;
                    this.camera.top = 1 / 2;
                    this.camera.bottom = -1 / 2;
                } else {
                    aspect = this.canvas.clientHeight / this.canvas.clientWidth;
                    this.camera.left = -1 / 2;
                    this.camera.right = 1 / 2;
                    this.camera.top = aspect / 2;
                    this.camera.bottom = -aspect / 2;
                }
                this.camera.updateProjectionMatrix()
            } else {
                throw Error('canvas not defined!')
            }

        }

    }
}
