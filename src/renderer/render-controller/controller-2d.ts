import { ImageDataObject } from "../../utils/own-types";
import { RenderController } from "./render-controller";

export class Controller2D extends RenderController {
    private slice: number | undefined
    private sliceHtml: HTMLParagraphElement | undefined;
    constructor(data: ImageDataObject | undefined, material: THREE.ShaderMaterial, canvas: HTMLCanvasElement, htmlInfo: HTMLElement) {
        super(data, material, canvas, htmlInfo);
        this.slice = material.uniforms['slice'].value;

    }

    protected appendHtmlInfoChild(): void {
        this.sliceHtml = document.createElement('p');
        this.htmlInfo?.appendChild(this.sliceHtml)

        // slice have to be set here, as the function is call in parent class and at this time this.slice is not set in constructor
        this.slice = this.material?.uniforms['slice'].value;
        this.updateHtmlSlice()
    }

    protected clearHtmlInfoTextChild(): void {
        if (this.sliceHtml) {
            this.sliceHtml.innerText = '';
        }
    }

    protected releaseInChild(): void {
        delete this.slice;
        delete this.sliceHtml
    }

    protected onWheel(): void {
        this.canvas?.addEventListener('wheel', (event) => {
            // Prevent scrolling website
            event.preventDefault();
            // mouse wheel delta
            let delta = event.deltaY;

            if (this.slice != undefined) {
                if (this.imageDataObject && this.imageDataObject.data && this.imageDataObject.data.depth && !event.ctrlKey) {
                    if (delta > 0 && this.slice > 0) {
                        this.slice -= 1
                    }
                    else if (delta < 0 && this.slice < this.imageDataObject.data.depth - 1) {
                        this.slice += 1
                    }
                    if (this.material) {
                        this.material.uniforms['slice'].value = this.slice
                    }
                    this.updateHtmlSlice();
                }
            } else {
                throw Error('Variables that have to be set are not defined!')
            }
        })
    }

    protected updateControllerChild(): void {
        this.slice = this.material?.uniforms['slice'].value;
        if (this.imageDataObject?.data) {
            this.updateHtmlSlice();
        }

    }

    private updateHtmlSlice(): void {
        if (this.sliceHtml) {
            if (this.imageDataObject && this.imageDataObject.data) {
                this.sliceHtml.innerText = 'Slice: ' + (this.slice)
            }
            else {
                this.sliceHtml.innerText = '';
            }
        } else {
            throw Error('Variables that have to be set are not defined!')
        }
    }
}
