import { DataObject } from "../../utils/data-object";
import { ConnectSignal } from "../../utils/enum-connect-signal";
import { CssShape } from "../../utils/enum-css-shape";
import { ImageDataObject, CallbackToModule } from "../../utils/own-types";
import { ShaderObject } from "../../utils/shader-object";
import { Input } from "../input";

export class ImageDataInput extends Input {
    protected data: ImageDataObject | undefined;
    constructor(callback: CallbackToModule, imageData: ImageDataObject, htmlModule: HTMLElement) {
        super(callback, htmlModule, ConnectSignal.imageData);
        
        // set data reference from module
        this.data = imageData;
    }

    public setData(data: ImageDataObject): void {
        if(this.data) {
            this.data.data = data.data;
            this.data.shader = data.shader;

            this.update();
        }
    }
    
    protected releaseInChild(): void {
    }

    protected removeData(): void {
        if(this.data) {
            this.data.data = new DataObject();
            this.data.shader = new ShaderObject();
        }
    }

    protected setCssShape(): void {
        this.html?.classList.add(CssShape.imageData)
    }
}