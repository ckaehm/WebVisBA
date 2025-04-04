import { ConnectSignal } from "../../utils/enum-connect-signal";
import { CssShape } from "../../utils/enum-css-shape";
import { CallbackToModule, SceneObject } from "../../utils/own-types";
import { Input } from "../input";

export class SceneInput extends Input {
    protected data: SceneObject | undefined;
    constructor(callback: CallbackToModule, scene: SceneObject, htmlModule: HTMLElement) {
        super(callback, htmlModule, ConnectSignal.scene)
        
        // set data reference from module
        this.data = scene;
    }

    public setData(data: SceneObject): void {
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
        this.html?.classList.add(CssShape.scene)
    }
}