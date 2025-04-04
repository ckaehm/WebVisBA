import vertexShader3d from '../../renderer/shader/3d/vertex-shader-3d.glsl';
import fragmentShader3d from '../../renderer/shader/3d/fragment-shader-3d.glsl';

import { Renderer } from "../../renderer/renderer";
import { ToHalfFloat } from "../../utils/to-half-float";
import * as THREE from "three";
import { Controller3D } from '../../renderer/render-controller/controller-3d';
import { PerspectiveCamera } from '../../renderer/camera/perspective-camera';
import { VoxelSize } from '../../utils/own-types';
import { DataObject } from '../../utils/data-object';

export default class Renderer3d extends Renderer {

    protected material: THREE.ShaderMaterial | undefined;

    private voxelSizeZ: number | undefined;

    constructor() {
        super('Renderer 3D');
    }

    protected animate(): void {
        if (this.mesh) {
            this.mesh.rotation.y += 0.01;
        }
    }

    protected createCamera(): void {
        if (this.canvas) {
            this.camera = new PerspectiveCamera(this.canvas)
        }
    }

    protected createController(): void {
        if (this.canvas && this.htmlInfo && this.material) {
            this.controller = new Controller3D(this.imageDataInputs?.[0], this.material, this.canvas, this.htmlInfo);
            // add css class to set font color to black,because background
            this.htmlInfo.classList.add('threeDRendering')
        }
    }
    protected createMaterial(): void {
        if (this.imageDataInputs?.[0].data) {
            this.voxelSizeZ = this.calculateVoxelSizeZ(this.imageDataInputs[0].data);
        }

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
        this.material = new THREE.RawShaderMaterial({
            glslVersion: THREE.GLSL3,
            uniforms: {
                volumeTexture: { value: this.texture },
                cameraPos: { value: this.camera?.getCamera().position },
                stepSize: { value: 200 },
                windowCenter: { value: centerStart },
                windowWidth: { value: widthStart },
                kernel: { value: [0] },
                kSize: { value: 0 },

                voxelSizeZ: { value: this.voxelSizeZ }
            },
            defines: {
                kernelSize: 1
            },

            vertexShader: vertexShader3d,
            fragmentShader: fragmentShader3d,
            side: THREE.BackSide,
            transparent: true,
            depthWrite: false,
            depthTest: true
        });
    }
    protected createMesh(): void {
        const geometry = new THREE.BoxGeometry(1, 1, this.voxelSizeZ);
        this.mesh = new THREE.Mesh(
            geometry,
            this.material
        );
        // align data axial like in 2d renderer
        this.mesh.rotation.x = Math.PI;
    }
    protected createTexture(): void {
        // if data are Uint8
        if (this.imageDataInputs?.[0].data && this.imageDataInputs[0].data.data instanceof Uint8Array) {
            this.texture = new THREE.Data3DTexture(this.imageDataInputs[0].data.data, this.imageDataInputs[0].data.width, this.imageDataInputs[0].data.height, this.imageDataInputs[0].data.depth);

        }
        // if data are Uint16
        else if (this.imageDataInputs?.[0].data && this.imageDataInputs[0].data.data instanceof Uint16Array) {
            let textureData = new Uint16Array(this.imageDataInputs[0].data.data.length);

            for (let i = 0; i < this.imageDataInputs[0].data.data.length; i++) {
                textureData[i] = ToHalfFloat(this.imageDataInputs[0].data.data[i]);
            }

            this.texture = new THREE.Data3DTexture(textureData, this.imageDataInputs[0].data.width, this.imageDataInputs[0].data.height, this.imageDataInputs[0].data.depth);
            this.texture.type = THREE.HalfFloatType;
        } else {
            // create with empty data
            this.texture = new THREE.Data3DTexture(new Float32Array(), 0, 0, 0)
        }

        this.texture.format = THREE.RedFormat;
        this.texture.minFilter = THREE.LinearFilter;
        this.texture.magFilter = THREE.LinearFilter;
        this.texture.needsUpdate = true;
    }
    protected releaseInRenderChild(): void {
        delete this.voxelSizeZ;
    }
    protected setInnerModule(): void {
    }

    private calculateVoxelSizeZ(dataObject: DataObject): number {
        if (dataObject.voxelSize.x != dataObject.voxelSize.y) {
            throw Error('data with different x and y voxel size is currently not supported')

        }
        const voxelSize: VoxelSize = dataObject.voxelSize;

        return (dataObject.depth * voxelSize.z) / (dataObject.width * voxelSize.x)
    }

}