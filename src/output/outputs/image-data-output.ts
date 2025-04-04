import { ConnectSignal } from "../../utils/enum-connect-signal";
import { CssShape } from "../../utils/enum-css-shape";
import { ImageDataObject } from "../../utils/own-types";
import { Output } from "../output";

export class ImageDataOutput extends Output {
    constructor(imageData: ImageDataObject, htmlModule: HTMLElement) {
        super(imageData, htmlModule, ConnectSignal.imageData);
    }
    protected releaseInChild(): void {
    }

    protected setCssShape(): void {
        this.html?.classList.add(CssShape.imageData)
    }

}