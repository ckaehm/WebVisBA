import { ConnectSignal } from "../../utils/enum-connect-signal";
import { CssShape } from "../../utils/enum-css-shape";
import { CallbackToModule, BaseObject } from "../../utils/own-types";
import { Input } from "../input";

export class BaseObjectInput extends Input {
    protected data: BaseObject | undefined;
    constructor(callback: CallbackToModule, baseObject: BaseObject, htmlModule: HTMLElement) {
        super(callback, htmlModule, ConnectSignal.baseObject)
        
        // set data reference from module
        this.data = baseObject;
    }

    public setData(data: BaseObject): void {
        if(this.data) {
            this.data.data = data.data;
            this.update();
        }
    }

    protected releaseInChild(): void {
    }

    protected removeData(): void {
        if(this.data) {
            this.data.data = undefined;
        }
    }

    protected setCssShape(): void {
        this.html?.classList.add(CssShape.baseObject)
    }
}