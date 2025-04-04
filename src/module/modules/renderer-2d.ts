import vertexShader2d from '../../renderer/shader/2d/vertex-shader-2d.glsl';
import fragmentShader2d from '../../renderer/shader/2d/fragment-shader-2d.glsl'

import * as THREE from 'three';
import { OrthographicCamera } from "../../renderer/camera/orthographic-camera";
import { ToHalfFloat } from "../../utils/to-half-float";
import { Renderer } from '../../renderer/renderer';
import { Controller2D } from '../../renderer/render-controller/controller-2d';


export default class Renderer2d extends Renderer {

    protected material: THREE.ShaderMaterial | undefined;
    private sliceStep: number | undefined;

    constructor() {
        super('Renderer 2D');
    }

    protected animate(): void {
        if (this.material && this.imageDataInputs?.[0].data) {
            let imageDepth = this.imageDataInputs[0].data?.depth;
            let currentSlice = this.material.uniforms.slice.value;
            // infinite loop from front to back and backwards
            if (currentSlice < imageDepth || currentSlice > 0) {
                // loop from front to back
                if (currentSlice == 0) {
                    this.sliceStep = 1;
                }
                // loop from back to front
                if (currentSlice == imageDepth) {
                    this.sliceStep = -1;
                }
            }
            this.material.uniforms.slice.value += this.sliceStep;
        }
    }

    protected createCamera(): void {
        if (this.canvas) {
            this.camera = new OrthographicCamera(this.canvas)
        }
    }

    protected createController(): void {
        if (this.canvas && this.htmlInfo && this.material) {
            this.controller = new Controller2D(this.imageDataInputs?.[0], this.material, this.canvas, this.htmlInfo);
        }
    }

    protected createMaterial(): void {
        let centerStart: number;
        let widthStart: number;

        if (this.imageDataInputs?.[0].data && this.imageDataInputs[0].data.data instanceof Uint8Array) {
            centerStart = 40.0 / 255.0;
            widthStart = 160.0 / 255.0;

        } else if (this.imageDataInputs?.[0].data && this.imageDataInputs[0].data.data instanceof Uint16Array) {
            centerStart = 640.0;
            widthStart = 2560.0;
        } else {
            throw Error('data type not supported!');
        }

        // kernel must be an array with at least one element and kernelSize must be at least 1, otherwise an error occurs in the shader
        // idea to use defines, see: https://discourse.threejs.org/t/pass-a-specified-length-of-array-to-uniform/7315/6
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                volumeTexture: { value: this.texture },
                slice: { value: 0 },
                windowCenter: { value: centerStart },
                windowWidth: { value: widthStart },
                kernel: { value: [0] },
                kSize: { value: 0 }
            },
            defines: {
                kernelSize: 1
            },
            glslVersion: THREE.GLSL3,
            vertexShader: vertexShader2d,
            fragmentShader: fragmentShader2d,
            transparent: true,
            depthWrite: false,
            depthTest: true
        });
    }

    protected createMesh(): void {
        this.mesh = new THREE.Mesh(
            new THREE.PlaneGeometry(1, 1),
            this.material
        );
    }

    protected createTexture(): void {
        // if data are Uint8
        if (this.imageDataInputs?.[0].data && this.imageDataInputs[0].data.data instanceof Uint8Array) {
            this.texture = new THREE.DataArrayTexture(this.imageDataInputs[0].data.data, this.imageDataInputs[0].data.width, this.imageDataInputs[0].data.height, this.imageDataInputs[0].data.depth);

        }
        // if data are Uint16
        else if (this.imageDataInputs?.[0].data && this.imageDataInputs[0].data.data instanceof Uint16Array) {
            let textureData = new Uint16Array(this.imageDataInputs[0].data.data.length);

            for (let i = 0; i < this.imageDataInputs[0].data.data.length; i++) {

                textureData[i] = ToHalfFloat(this.imageDataInputs[0].data.data[i]);

            }

            this.texture = new THREE.DataArrayTexture(textureData, this.imageDataInputs[0].data.width, this.imageDataInputs[0].data.height, this.imageDataInputs[0].data.depth);

            this.texture.type = THREE.HalfFloatType;
        } else {
            // create with empty data
            this.texture = new THREE.DataArrayTexture()
        }

        this.texture.format = THREE.RedFormat;
        this.texture.minFilter = THREE.LinearFilter;
        this.texture.magFilter = THREE.LinearFilter;
        this.texture.needsUpdate = true;

    }

    protected releaseInRenderChild(): void {
        this.sliceStep;
    }

    protected setInnerModule(): void {
    }
}


