import { ConnectSignal } from "../../utils/enum-connect-signal";
import { CssShape } from "../../utils/enum-css-shape";
import { SceneObject } from "../../utils/own-types";
import { Output } from "../output";

export class SceneOutput extends Output {
    constructor(scene: SceneObject, htmlModule: HTMLElement) {
        super(scene, htmlModule, ConnectSignal.scene);
    }

    protected releaseInChild(): void {
    }

    protected setCssShape(): void {
        this.html?.classList.add(CssShape.scene)
    }

}