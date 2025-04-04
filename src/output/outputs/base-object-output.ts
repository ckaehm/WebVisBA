import { ConnectSignal } from "../../utils/enum-connect-signal";
import { CssShape } from "../../utils/enum-css-shape";
import { BaseObject } from "../../utils/own-types";
import { Output } from "../output";

export class BaseObjectOutput extends Output {
    constructor(baseObject: BaseObject, htmlModule: HTMLElement) {
        super(baseObject, htmlModule, ConnectSignal.baseObject)
    }

    protected releaseInChild(): void {
    }

    protected setCssShape(): void {
        this.html?.classList.add(CssShape.baseObject)
    }

}