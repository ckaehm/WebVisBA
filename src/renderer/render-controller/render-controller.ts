import { ImageDataObject } from "../../utils/own-types";

export abstract class RenderController {
    protected imageDataObject: ImageDataObject | undefined;
    protected material: THREE.ShaderMaterial | undefined;

    protected canvas: HTMLCanvasElement | undefined;
    protected htmlInfo: HTMLElement | undefined;
    private lutHtml: HTMLParagraphElement | undefined;

    private minCenter: number | undefined;
    private maxCenter: number | undefined;
    private minWidth: number | undefined;
    private maxWidth: number | undefined;
    private multiplier: number | undefined
    private center: number | undefined;
    private width: number | undefined;

    constructor(data: ImageDataObject | undefined, material: THREE.ShaderMaterial, canvas: HTMLCanvasElement, htmlInfo: HTMLElement) {
        this.canvas = canvas;
        this.htmlInfo = htmlInfo;

        this.imageDataObject = data;
        this.material = material;
        this.center = material.uniforms['windowCenter'].value;
        this.width = material.uniforms['windowWidth'].value;
        [this.minCenter, this.maxCenter] = this.getMinMaxData();
        [this.minWidth, this.maxWidth] = this.getMinMaxData();
        this.multiplier = 4;
        // if a filter change values, update material window to a possible value
        this.setMaterialMaxValue();
        this.updateMultiplier()
        if (this.imageDataObject) {
            this.appendHtmlInfo();
            this.onMouseMove();
            this.onWheel();
        }
    }

    protected abstract appendHtmlInfoChild(): void;
    protected abstract clearHtmlInfoTextChild(): void;
    protected abstract releaseInChild(): void;
    protected abstract onWheel(): void;
    protected abstract updateControllerChild(): void;

    public updateController(material: THREE.ShaderMaterial): void {
        this.material = material;
        this.center = this.material.uniforms['windowCenter'].value;
        this.width = this.material.uniforms['windowWidth'].value;
        [this.minCenter, this.maxCenter] = this.getMinMaxData();
        [this.minWidth, this.maxWidth] = this.getMinMaxData();

        // if a filter change values, update material window to a possible value
        this.setMaterialMaxValue()
        if (this.imageDataObject?.data) {
            this.updateHtmlLut();
        }

        this.updateMultiplier();
        this.updateControllerChild();
    }

    public clearHtmlInfoText(): void {
        if (this.lutHtml) {
            this.lutHtml.innerText = '';
        }
        this.clearHtmlInfoTextChild();
    }

    public destroy(): void {
        this.releaseResources()
        this.releaseInChild();
    }

    private appendHtmlInfo(): void {
        this.lutHtml = document.createElement('p');
        this.htmlInfo?.appendChild(this.lutHtml)
        this.updateHtmlLut();

        this.appendHtmlInfoChild();
    }

    private releaseResources(): void {
        delete this.canvas;
        delete this.htmlInfo;
        delete this.lutHtml;
        delete this.minCenter;
        delete this.maxCenter;
        delete this.minWidth;
        delete this.maxWidth;
        delete this.multiplier;
        delete this.center;
        delete this.width;
        delete this.imageDataObject;
        delete this.material;
    }

    private getMinMaxData(): [number, number] {
        let minValue = 0;
        let maxValue = 0;
        if (this.imageDataObject && this.imageDataObject.data && this.imageDataObject.data.data) {
            // set start values from data
            minValue = this.imageDataObject.data.data[0];
            maxValue = this.imageDataObject.data.data[0];

            for (let i = 1; i < this.imageDataObject.data.data.length; i++) {
                if (this.imageDataObject.data.data[i] < minValue) {
                    minValue = this.imageDataObject.data.data[i];
                }
                if (this.imageDataObject.data.data[i] > maxValue) {
                    maxValue = this.imageDataObject.data.data[i];
                }
            }
        }
        if (this.imageDataObject?.data?.data instanceof Uint8Array) {
            // divide by 255 as in the shade the values are in the range of [0,1]
            return [minValue / 255.0, maxValue / 255.0]
        } else {
            return [minValue, maxValue]
        }
    }

    private onMouseMove(): void {
        // Add an event listener for the mousemove event
        this.canvas?.addEventListener("mousemove", (event) => {
            // left mouse button down and cmd key is not press, as the camera is controlled with cmd key
            if (event.buttons & 2 && !event.ctrlKey) {
                let lastMovementX = 0;
                let lastMovementY = 0;
                if (this.multiplier) {
                    lastMovementX = event.movementX * this.multiplier;
                    lastMovementY = event.movementY * this.multiplier;
                }

                if (this.material && this.minCenter != undefined && this.minWidth != undefined && this.maxCenter != undefined && this.maxWidth != undefined) {
                    // Update the center value based on the Y coordinate change, ensuring it stays within data values
                    this.center = Math.min(Math.max(this.material?.uniforms['windowCenter'].value + lastMovementY, this.minCenter), this.maxCenter);
                    this.material.uniforms['windowCenter'].value = this.center

                    // Update the width value based on the X coordinate change, ensuring it stays within data values
                    this.width = Math.min(Math.max(this.material.uniforms['windowWidth'].value + lastMovementX, this.minWidth), this.maxWidth);
                    this.material.uniforms['windowWidth'].value = this.width
                    this.updateHtmlLut();
                } else {
                    throw Error('Variables that have to be set are not defined!')
                }
            }
        })
    }

    private updateHtmlLut(): void {
        if (this.lutHtml && this.center != undefined) {
            if (this.imageDataObject && this.imageDataObject.data && this.width != undefined) {
                // the ct values of 16 bit data are given in HU. However, the measured value does not represent this
                if (this.imageDataObject.data.modality == 'ct' && this.imageDataObject.data.data instanceof Uint16Array) {
                    this.lutHtml.innerText = 'LUT C/W: ' + (this.center - 1024) + ' / ' + this.width
                } else if (this.imageDataObject.data.data instanceof Uint8Array) {
                    this.lutHtml.innerText = 'LUT C/W: ' + Math.round(this.center * 255.0) + ' / ' + Math.round(this.width * 255.0)
                } else {
                    this.lutHtml.innerText = 'LUT C/W: ' + this.center + ' / ' + this.width
                }
            } else {
                this.lutHtml.innerText = '';
            }
        } else {
            throw Error('Variables that have to be set are not defined!')
        }
    }

    private updateMultiplier(): void {
        if (this.imageDataObject && this.imageDataObject.data?.data instanceof Uint8Array) {
            // reduced rate of change of the value with the mouse, since data range is smaller and in range [0; 255]
            this.multiplier = 1.0 / 255.0;
        } else {
            this.multiplier = 4;
        }
    }

    private setMaterialMaxValue(): void {
        if (this.center && this.maxCenter && this.center > this.maxCenter && this.material) {
            this.center = this.maxCenter;
            this.material.uniforms['windowCenter'].value = this.center;
        }
        if (this.width && this.maxWidth && this.width > this.maxWidth && this.material) {
            this.width = this.maxWidth;
            this.material.uniforms['windowWidth'].value = this.width;
        }
    }
}