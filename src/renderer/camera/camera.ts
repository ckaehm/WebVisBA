import { EventEmitter } from 'events';
import { CameraController } from './controller/camera-controller';

export abstract class Camera {
    // specify camera type in child class
    protected camera: THREE.OrthographicCamera | THREE.PerspectiveCamera | undefined;
    protected cameraController: CameraController | undefined
    protected canvas: HTMLCanvasElement | undefined;

    public cameraUpdatedEvent: EventEmitter | undefined;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.cameraUpdatedEvent = new EventEmitter();
        this.onCanvasResize();
    }

    public abstract getCamera(): THREE.OrthographicCamera | THREE.PerspectiveCamera;

    protected abstract setStartCamera(): void;
    protected abstract updateCamera(): void;

    public destroy(): void {
        delete this.camera;
        this.cameraController?.destroy();
        delete this.cameraController
        delete this.canvas;
        delete this.cameraUpdatedEvent;
    }

    private onCanvasResize(): void {
        if (this.canvas) {
            let canvasResizeObserver = new ResizeObserver(() => {
                this.updateCamera();
                this.cameraUpdatedEvent?.emit('cameraUpdated');
            });
            canvasResizeObserver.observe(this.canvas);
        } else {
            throw Error('canvas not defined!')
        }
    }
}