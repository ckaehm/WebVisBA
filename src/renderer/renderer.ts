import * as THREE from 'three';
import { Camera } from "./camera/camera";
import { RenderController } from "./render-controller/render-controller";
import { Module } from "../module/module";
import { ModuleInOutPut, SceneObject } from "../utils/own-types";
import { ModuleInOutPutTypes } from "../utils/enum-input-output-module";
import { PerspectiveCamera } from './camera/perspective-camera';

import fragmentShader2dConv from '../renderer/shader/fragment-shader-conv.glsl'
import vertexShader2dConv from '../renderer/shader/vertex-shader-conv.glsl';
import { CsvDowload } from '../utils/dowloadCsv';

// all Enum keys have to be set
const inputModuleList: ModuleInOutPut = {
    [ModuleInOutPutTypes.ImageData]: 1,
    [ModuleInOutPutTypes.Scene]: 3,
    [ModuleInOutPutTypes.BaseObject]: 0,
};

// all Enum keys have to be set
const outputModuleList: ModuleInOutPut = {
    [ModuleInOutPutTypes.ImageData]: 0,
    [ModuleInOutPutTypes.Scene]: 0,
    [ModuleInOutPutTypes.BaseObject]: 0,
};

export abstract class Renderer extends Module {
    // specific Material type have to be set in child class
    protected material: THREE.ShaderMaterial | THREE.RawShaderMaterial | undefined;

    protected camera: Camera | undefined;
    protected canvas: HTMLCanvasElement | undefined;
    protected controller: RenderController | undefined;
    protected htmlInfo: HTMLElement | undefined;
    protected mesh: THREE.Mesh | undefined = new THREE.Mesh() // init mesh, because some functions check if this is undefined and errors would occur otherwise;
    protected texture: THREE.DataArrayTexture | THREE.Data3DTexture | undefined;

    private activeDot: HTMLSpanElement | undefined = document.createElement('span');
    private fsShaderFiltering: string | undefined;
    private vsShaderFiltering: string | undefined;
    private htmlFps: HTMLParagraphElement | undefined;
    private isCanvasActive: boolean | undefined;
    private renderer: THREE.WebGLRenderer | undefined;
    private scene: THREE.Scene | undefined;

    private bufferMaterial: THREE.ShaderMaterial | undefined;
    private finalMaterial: THREE.ShaderMaterial | undefined;

    /* description WebGLRenderTarget: https://threejs.org/docs/?q=renderer#api/en/renderers/WebGLRenderTarget
    ** needed as buffer where the video card draws pixels for a scene that is being rendered in the background*/
    private postprocessingBufferA: THREE.WebGLRenderTarget | undefined;
    private postprocessingBufferB: THREE.WebGLRenderTarget | undefined;

    private startDate: Date | undefined;
    private endDate: Date | undefined = new Date();
    private frames: number | undefined = 0;

    private showAndLogFpsEnabled: boolean | undefined = false;
    private elapsedTime: number | undefined = 0;
    // ms * sec * min
    private timeUntilLogging: number | undefined = 1000 * 60 * 0.5;
    // for logging
    private totalTimeElapsed: number | undefined = 0;
    // for logging
    private totalFrames: number | undefined = 0;
    private cvsProvided: boolean | undefined = false;
    private csvLog: string | undefined = 'Voxels, DataType, Modality, Centre, Width, FPS\n';

    constructor(moduleName: string) {
        super(inputModuleList, outputModuleList, 'renderer', moduleName);
        this.scene = new THREE.Scene();

        if (this.activeDot) {
            this.activeDot.classList.add('activeDot')
            this.html?.appendChild(this.activeDot);
        }
        this.isCanvasActive = false;
        this.initRenderer();
        this.onDblClickModule();

        this.fsShaderFiltering = fragmentShader2dConv;
        this.vsShaderFiltering = vertexShader2dConv;

        // buffer is always of the same type, because it is the displayed 2D rendering from the canvas. So there is no difference between 2D and 3D rendering.
        this.postprocessingBufferA = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
        this.postprocessingBufferB = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });

        /* set finaleMaterial and butterMaterial in the constructor, as they don't need to be updated when data is changed
        ** the same as for Buffer, because the 2D texture of the buffer is used */
        this.finalMaterial = new THREE.ShaderMaterial({
            uniforms: {
                bufferTexture: { value: null },
                kernel: { value: [0] },
                kSize: { value: 0 },
                size: { value: new THREE.Vector2(1, 2) },
            },
            defines: {
                kernelSize: 1
            },
            glslVersion: THREE.GLSL3,
            vertexShader: this.vsShaderFiltering,
            fragmentShader: this.fsShaderFiltering
        });

        this.bufferMaterial = new THREE.ShaderMaterial({
            uniforms: {
                bufferTexture: { value: null },
                kernel: { value: [0] },
                kSize: { value: 0 },
                size: { value: new THREE.Vector2(1, 2) },
            },
            defines: {
                kernelSize: 1
            },
            glslVersion: THREE.GLSL3,
            vertexShader: this.vsShaderFiltering,
            fragmentShader: this.fsShaderFiltering
        });
    }

    protected abstract animate(): void;
    protected abstract createCamera(): void;
    protected abstract createController(): void;
    protected abstract createMaterial(): void;
    protected abstract createMesh(): void;
    protected abstract createTexture(): void;
    protected abstract releaseInRenderChild(): void;

    protected onDialogSubmitCallback(value: any): void {
        throw new Error("Method not implemented.");
    }

    protected async onUpdateImageDataInput(): Promise<void> {

        // reset values to log again
        this.elapsedTime = 0;
        this.frames = 0;
        this.endDate = new Date();
        this.startDate = undefined;
        this.totalTimeElapsed = 0;
        this.totalFrames = 0;
        this.cvsProvided = false;

        this.clearRendering();
        if (this.imageDataInputs?.[0].data !== undefined && this.imageDataInputs?.[0].data.data != null && this.canvas && this.scene) {
            this.canvas.style.pointerEvents = 'all'
            this.createTexture();
            this.createMaterial();
            this.createMesh();
            this.addMeshToScene();
            this.addSceneInputToScene();
            if (!this.controller) {
                this.createController();
            } else {
                if (this.material) {
                    this.controller.updateController(this.material)
                } else {
                    throw Error('no material defined!')
                }

            }

            if (this.htmlInfo && document.body.contains(this.canvas)) {
                document.body.appendChild(this.htmlInfo);
            }
        } else {
            this.addSceneInputToScene();
        }
    }

    protected async onUpdateSceneInput(): Promise<void> {
        this.scene?.clear();

        this.addMeshToScene();
        this.addSceneInputToScene();
    }

    protected async onUpdateBaseObjectInput(): Promise<void> {
        throw Error('Method not implemented')
    }

    protected releaseInChild(): void {
        this.isCanvasActive = false;
        this.releaseGpuResources();
        this.htmlFps?.remove();
        this.htmlInfo?.remove();
        this.canvas?.remove();
        delete this.material;
        delete this.bufferMaterial;
        delete this.finalMaterial;
        delete this.camera;
        delete this.canvas;
        this.controller?.destroy();
        delete this.controller;
        delete this.htmlInfo;
        delete this.mesh;
        delete this.texture;
        delete this.renderer;
        delete this.scene;
        delete this.isCanvasActive;
        delete this.activeDot;
        delete this.htmlFps;
        delete this.fsShaderFiltering;
        delete this.vsShaderFiltering;
        delete this.postprocessingBufferA;
        delete this.postprocessingBufferB;
        delete this.showAndLogFpsEnabled;
        delete this.elapsedTime;
        delete this.startDate;
        delete this.endDate;
        delete this.frames;
        delete this.timeUntilLogging;
        delete this.totalTimeElapsed;
        delete this.totalFrames;
        delete this.cvsProvided;
        delete this.csvLog;
        this.releaseInRenderChild();
    }

    private initRenderer(): void {
        // Nullish coalescing operator, https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing, visited 14.03.2023
        if ((this.imageDataInputs?.length ?? 0) > 1 || inputModuleList[0] > 1) {
            throw Error('importing more than one image data element is not yet supported in the render module');
        }
        this.createCanvas();
        this.createCamera();
        this.createRenderInfo();
        if (this.canvas) {
            // renderer cannot be initialized before the canvas is created
            this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.renderer.setSize(this.canvas.width, this.canvas.height);

            this.onMouseMove();
            this.onWheel();
            this.onCameraChanged();
        }
    }

    // Idea to use RenderTarget and different textures with Buffer A and B to post-process the result of a rendering. In this case apply multiple shaders, see: https://gamedevelopment.tutsplus.com/tutorials/how-to-write-a-smoke-shader--cms-25587 and https://stackoverflow.com/questions/75565926/threejs-pingpong-approach-for-rendering-to-texture-no-errors-nothing-renderin, visited 05.04.23.
    private render(): void {
        if (this.scene && this.camera && this.mesh && this.renderer && this.isCanvasActive) {
            if (this.material && this.material instanceof THREE.ShaderMaterial && this.bufferMaterial) {
                // current camera position needed for the fragment shader of the 3D renderer
                if (this.material.uniforms.cameraPos) {
                    this.material.uniforms.cameraPos.value = this.camera.getCamera().position;
                }

                // reset material to default without kernel
                this.material.uniforms.kernel.value = [0]
                this.material.uniforms.kSize.value = 0;
                this.material.defines.kernelSize = 1;

                this.mesh.material = this.material;
                // if a kernel is set in imageDataInputs
                if (this.imageDataInputs?.[0]?.shader && this.imageDataInputs[0].shader.kernels.length > 0) {
                    const kernels = this.imageDataInputs[0].shader.kernels;

                    // if only one shader is set, apply it to the shader and render the scene
                    this.material.uniforms.kernel.value = kernels[0];
                    this.material.uniforms.kSize.value = kernels[0].length;
                    this.material.defines.kernelSize = kernels[0].length;

                    if (kernels.length > 1 && this.postprocessingBufferA && this.postprocessingBufferB) {

                        /* More than one kernel:
                        ** Take the first kernel and apply it separately to the data, because only the first kernel can modify the data with full 16-bit color depth.
                        ** This is caused by applying the next kernel to the buffer texture from the first rendering, and this one has an 8-bit color depth.
                        ** take scene buffer after first rendering and use result as texture.
                        ** buffers A and B must be swapped, otherwise an error occurs in the browser console: GL:INVALID_OPERATION: Feedback Loop*/
                        this.renderer.setRenderTarget(this.postprocessingBufferB);
                        this.renderer.render(this.scene, this.camera.getCamera());

                        this.bufferMaterial.uniforms.kernel.value = kernels[1];
                        this.bufferMaterial.uniforms.kSize.value = kernels[1].length;
                        this.bufferMaterial.defines.kernelSize = kernels[1].length;
                        this.mesh.material = this.bufferMaterial;

                        for (let index = 1; index < kernels.length; index++) {
                            // Swap buffer A and B
                            const temp: THREE.WebGLRenderTarget | THREE.WebGL3DRenderTarget = this.postprocessingBufferA;
                            this.postprocessingBufferA = this.postprocessingBufferB;
                            this.postprocessingBufferB = temp;

                            const kernel = kernels[index];

                            this.bufferMaterial.uniforms.bufferTexture.value = this.postprocessingBufferA.texture;
                            this.bufferMaterial.uniforms.kernel.value = kernel;
                            this.bufferMaterial.uniforms.kSize.value = kernel.length;
                            this.bufferMaterial.defines.kernelSize = kernel.length;
                            this.renderer.setRenderTarget(this.postprocessingBufferB);
                            this.renderer.render(this.scene, this.camera.getCamera());
                        }

                        if (this.finalMaterial) {
                            this.finalMaterial.uniforms.bufferTexture.value = this.postprocessingBufferB.texture;
                        }

                        // remove RenderTarget, as the canvas is set as the active render target again instead, see https://threejs.org/docs/?q=renderer#api/en/renderers/WebGLRenderer, visited 05.03.23
                        this.renderer.setRenderTarget(null);
                        if (this.finalMaterial) {
                            this.mesh.material = this.finalMaterial;
                        }
                    }

                }
            }
            this.renderer.render(this.scene, this.camera.getCamera());
        }
    }

    private addMeshToScene(): void {
        if (this.imageDataInputs?.[0].data !== undefined && this.imageDataInputs?.[0].data.data != null && this.mesh) {
            this.scene?.add(this.mesh);
        }
    }

    private addSceneInputToScene(): void {
        let isSceneInput: boolean = false
        this.sceneDataInputs?.forEach((sceneObject: SceneObject) => {
            if (sceneObject.data) {
                /* clone, as every object needs a patent object, see https://github.com/mrdoob/three.js/issues/1489, visited 15.04.23
                ** if the scene is set to two renderers, otherwise it will be in only one, as only one parent scene is possible */
                this.scene?.add(sceneObject.data?.clone());
                isSceneInput = true
            }
        })
        if (isSceneInput && this.canvas) {
            this.canvas.style.pointerEvents = 'all'

        } else {
            if (this.canvas && this.imageDataInputs?.[0].data?.data == null) {
                this.canvas.style.pointerEvents = 'none'
            }
        }
        if (!this.showAndLogFpsEnabled) {
            this.render();
        }
    }

    private releaseGpuResources(): void {
        this.renderer?.dispose();
        this.material?.dispose();
        this.bufferMaterial?.dispose();
        this.finalMaterial?.dispose();
        this.postprocessingBufferA?.dispose();
        this.postprocessingBufferB?.dispose();
        this.scene?.clear()
    }

    private clearRendering(): void {
        this.htmlInfo?.remove();
        if (this.htmlFps) {
            this.htmlFps.innerText = '';
        }
        // deleting the html info text is necessary if there are several renderer modules on the workstation, but only one is active. Only from the active renderer the html info is removed.
        this.controller?.clearHtmlInfoText();
        this.releaseGpuResources();
        this.clearScene();
    }

    private createCanvas(): void {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'renderCanvas';
        // disable contextmenu on canvas
        this.canvas.addEventListener("contextmenu", (event) => {
            event.preventDefault();
        });
        // stopPropagation from Module.ts moving Module on mousemove
        this.canvas.addEventListener('mousemove', event => {
            event.stopPropagation();
        });
    }

    private createRenderInfo(): void {
        this.htmlInfo = document.createElement('section');
        this.htmlInfo.id = 'infoRendering'
        this.htmlFps = document.createElement('p');
        this.htmlFps.id = 'fps';
        this.htmlInfo.appendChild(this.htmlFps);
    }

    private clearScene() {
        if (this.canvas && this.scene) {
            this.canvas.style.pointerEvents = 'none'
            this.scene.clear();

            if (!this.showAndLogFpsEnabled) {
                this.render();
            }
        }
    }

    private calcFps() {
        // check if this.canvas is included in dom, because render modules do not share a variable between instances. But if a renderer is active, its canvas is displayed
        if (this.canvas && document.contains(this.canvas) && this.frames != undefined) {
            if (this.imageDataInputs?.[0].data) {
                this.endDate = new Date();

                if (!this.startDate) {
                    // create new date, as otherwise only the reference from endDate is set to startDate
                    this.startDate = new Date(this.endDate.getTime());
                }

                this.frames++;
                this.elapsedTime = this.endDate.getTime() - this.startDate.getTime();

                // 1 second has elapsed
                if (this.elapsedTime > 1000) {
                    const fps = Math.round((this.frames * 1000) / this.elapsedTime);
                    if (this.htmlFps) {
                        this.htmlFps.innerText = `FPS: ${fps}`
                    }
                    if (this.totalTimeElapsed != undefined) {
                        this.totalTimeElapsed += this.elapsedTime;
                    }
                    // create new date, as otherwise only the reference from endDate is set to startDate
                    // update startDate
                    this.startDate = new Date(this.endDate.getTime());
                    if (this.totalFrames != undefined) {
                        this.totalFrames += this.frames;
                    }
                    // reset frames
                    this.frames = 0;
                }

                // animate scene until csv has not been delivered yet
                if (!this.cvsProvided) {
                    this.animate();
                }
                // save fps in csv after defined time is reached and csv has not been delivered yet
                if (this.totalTimeElapsed && this.timeUntilLogging && this.totalTimeElapsed >= this.timeUntilLogging && !this.cvsProvided) {

                    if (this.imageDataInputs?.[0].data?.data && this.totalFrames != undefined) {
                        const dataSize = this.imageDataInputs[0].data.data.length;
                        const dataType = this.imageDataInputs[0].data.dataType;
                        const modality = this.imageDataInputs[0].data.modality;
                        const averageFps = Math.round((this.totalFrames * 1000) / this.totalTimeElapsed);
                        this.csvLog = this.csvLog + `\n${dataSize}, ${dataType}, ${modality}, ${this.material?.uniforms.windowCenter.value}, ${this.material?.uniforms.windowWidth.value}, ${averageFps}`
                        CsvDowload(this.csvLog, `average-fps-${this.moduleName}`);
                        this.cvsProvided = true
                    }
                }
                this.render();
            }
            // bind this to the calcFps method, otherwise the variables are not available
            // see https://stackoverflow.com/a/49197757, visited 25.04.23
            requestAnimationFrame(this.calcFps.bind(this));
        }
    }

    private onCameraChanged(): void {
        this.camera?.cameraUpdatedEvent?.on('cameraUpdated', () => {
            /* if the canvas is resized, the camera must be updated first.
            ** An event is triggered by the camera after update, the renderer listens and then this.renderer.size is updated and this.render() is executed. */
            if (this.isCanvasActive) {
                if (this.canvas) {
                    this.canvas.height = this.canvas.clientHeight;
                    this.canvas.width = this.canvas.clientWidth;
                    this.renderer?.setSize(this.canvas.width, this.canvas.height)

                    this.canvas.height = this.canvas.clientHeight;
                    this.canvas.width = this.canvas.clientWidth;
                    this.renderer?.setSize(this.canvas.width, this.canvas.height)
                    this.render()
                }
            }
        });
    }

    private onDblClickModule(): void {
        this.html?.addEventListener('dblclick', () => {
            if (this.canvas) {
                // if this renderCanvas is already displayed, remove it
                if (this.isCanvasActive && document.getElementById('renderCanvas') === this.canvas) {
                    this.canvas.remove();
                    this.htmlInfo?.remove();
                    this.html?.removeAttribute('id');
                    this.isCanvasActive = false;
                } else {
                    // if canvas of another renderCanvas is active, remove it. Also remove from id from current active renderer module as this shows with css that renderer is active
                    if (document.getElementById('renderCanvas') !== null) {
                        document.getElementById('renderCanvas')?.remove();
                        document.getElementById('activeRenderer')?.removeAttribute('id');
                    }
                    document.body.appendChild(this.canvas)
                    this.canvas.height = this.canvas.clientHeight;
                    this.canvas.width = this.canvas.clientWidth;
                    this.renderer?.setSize(this.canvas.width, this.canvas.height)

                    // set id to this module html. This indicates that the module is active
                    this.html?.setAttribute('id', 'activeRenderer')

                    // if info of another renderer is active, remove it
                    if (document.getElementById('infoRendering') !== null) {
                        document.getElementById('infoRendering')?.remove();
                    }
                    // add info only if data set, as info from old data may still exist in html element 
                    if (this.htmlInfo && this.imageDataInputs?.[0].data) {
                        document.body.appendChild(this.htmlInfo)
                    }
                    this.isCanvasActive = true;

                    // start logging fps and render
                    if (this.showAndLogFpsEnabled) {
                        this.calcFps();
                    }
                }
            }
        })
    }
    private onMouseMove(): void {
        if (!this.showAndLogFpsEnabled) {
            // passing an arrow function to addEventListener method to ensure that 'this' keyword inside the onWindowsResize refers to the class instance
            this.canvas?.addEventListener('mousemove', (event) => {
                if (this.imageDataInputs?.[0].data && (event.buttons == 2 || (this.camera instanceof PerspectiveCamera && event.buttons == 1))) {
                    this.render();
                }
            });
        }
    }

    private onWheel(): void {
        if (!this.showAndLogFpsEnabled) {
            // passing an arrow function to addEventListener method to ensure that 'this' keyword inside the onWindowsResize refers to the class instance
            this.canvas?.addEventListener('wheel', () => {
                if (this.imageDataInputs?.[0].data) {
                    this.render();
                }
            });
        }
    }

}
