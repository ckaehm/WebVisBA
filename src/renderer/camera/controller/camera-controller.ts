import * as THREE from "three";

export abstract class CameraController {
    // camera is specified via the constructor in the child class
    protected camera: THREE.PerspectiveCamera | THREE.OrthographicCamera | undefined;
    protected canvas: HTMLCanvasElement | undefined;
    protected mouseDown: boolean | undefined = false;

    private startMouseX: number | undefined;
    private startMouseY: number | undefined;

    constructor(canvas: HTMLCanvasElement, camera: THREE.PerspectiveCamera | THREE.OrthographicCamera) {
        this.canvas = canvas;
        this.camera = camera;

        this.startMouseX = 0;
        this.startMouseY = 0;

        this.onMouse();
    }

    protected abstract onMouseMove(deltaX: number, deltaY: number): void;
    protected abstract onWheel(delta: number): void;
    protected abstract releaseInChild(): void;

    public destroy(): void {
        this.releaseResources();
        this.releaseInChild();
    }

    private onMouse(): void {
        this.canvas?.addEventListener('wheel', (event) => {
            if (this.camera) {
                // Prevent scrolling website
                event.preventDefault();

                if ((this.camera instanceof THREE.OrthographicCamera && event.ctrlKey) || (this.camera instanceof THREE.PerspectiveCamera && !event.ctrlKey)) {
                    // mouse wheel delta
                    let delta = event.deltaY;
                    this.onWheel(delta);
                    this.camera.updateProjectionMatrix()
                }
            }
        });


        /* change camera position
        ** 1. store current mouse position
        ** event listener for the mouse down event */
        this.canvas?.addEventListener('mousedown', (event) => {
            // is right mouse button clicked with meta key or camera is perspective camera and left mouse button clicked
            if ((this.camera instanceof THREE.OrthographicCamera && event.button === 2 && event.ctrlKey) || (this.camera instanceof THREE.PerspectiveCamera && event.button === 0)) {
                this.mouseDown = true;

                // Get the mouse position relative to the canvas
                this.startMouseX = event.offsetX;
                this.startMouseY = event.offsetY;
            }
        });
        // 2. calculation of mouse movement while right mouse is down. Calculation starting from the position of the right click
        // event listener for mouse move event
        this.canvas?.addEventListener('mousemove', (event) => {
            if (this.camera && this.startMouseX && this.startMouseY) {
                // Check if the mouse button is down
                if ((this.camera instanceof THREE.OrthographicCamera && this.mouseDown && event.ctrlKey) || (this.mouseDown && this.camera instanceof THREE.PerspectiveCamera)) {
                    // Get the mouse position relative to the canvas
                    let deltaMouseX = event.offsetX - this.startMouseX;
                    let deltaMouseY = event.offsetY - this.startMouseY;

                    // Get the mouse position relative to the canvas
                    this.startMouseX = event.offsetX;
                    this.startMouseY = event.offsetY;
                    this.onMouseMove(deltaMouseX, deltaMouseY);
                    this.camera.updateProjectionMatrix()
                }
            }
        });
        // 3. right mouse up, stop changing camera position
        // event listener for mouse up event
        this.canvas?.addEventListener('mouseup', () => {
            this.mouseDown = false;
        });
        // special case handling
        // Listener for mouse leaving the canvas to avoid camera moving when mouse is released outside the canvas
        this.canvas?.addEventListener('mouseleave', () => {
            this.mouseDown = false;
        });
        // special case handling
        /* Listener for entering the canvas with the mouse, so that the camera is moved again 
        ** if the mouse was not released after leaving the canvas.
        */
        this.canvas?.addEventListener('mouseenter', (event) => {
            // is right mouse button clicked
            if ((this.camera instanceof THREE.OrthographicCamera && event.buttons === 2) || (this.camera instanceof THREE.PerspectiveCamera && event.buttons === 1)) {
                this.mouseDown = true;
            }
        });
    }

    private releaseResources(): void {
        delete this.camera;
        delete this.canvas
        delete this.mouseDown;

        delete this.startMouseX;
        delete this.startMouseY;
    }
}