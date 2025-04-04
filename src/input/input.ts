import { IInput } from "./i-input";
import ConnectService from '../utils/connect-service';
import { CallbackToModule, BaseObject, SceneObject, ImageDataObject, ConOutPRemoveCallback } from "../utils/own-types";

export abstract class Input implements IInput {
    protected data: ImageDataObject | SceneObject | BaseObject | undefined;
    protected html: HTMLElement | undefined;

    private connectLine: SVGLineElement | undefined;
    private connectService: any | undefined = ConnectService;
    private emittedConnectorSignal: string | undefined;
    private updateCallbackToModule: CallbackToModule | undefined;
    private handleClickRemover: EventListener | undefined = () => {
        this.removeConOutP();
        this.html?.classList.remove('connected');
    }
    private conOutputCallback: ConOutPRemoveCallback | undefined;

    constructor(callback: CallbackToModule, htmlModule: HTMLElement, emittedConnectorSignal: string) {
        this.updateCallbackToModule = callback;

        this.emittedConnectorSignal = emittedConnectorSignal;
        this.html = document.createElement('span');
        this.html.classList.add('input');
        this.setCssShape();
        this.onConnecting();
        htmlModule.appendChild(this.html);
    }
    public abstract setData(data: ImageDataObject | SceneObject | BaseObject): void;
    protected abstract releaseInChild(): void;
    protected abstract removeData(): void;
    protected abstract setCssShape(): void;

    public setCallbackToConOutP(callback: ConOutPRemoveCallback): void {
        this.conOutputCallback = callback;
    }
    public destroy(): void {
        this.removeConOutP();
        this.releaseResources();
        this.releaseInChild();
    }
    public onConnected(): void {
        if (this.handleClickRemover) {
            this.html?.classList.add('connected');
            this.html?.addEventListener('click', this.handleClickRemover);
        } else {
            throw Error('no handleClickRemover');
        }
    }
    public removeConOutP(): void {
        this.removeData();

        // remove this observer from observable
        this.conOutputCallback?.(this);
        this.conOutputCallback = undefined;

        // update to make callback on module because data was changed
        this.update();

        // remove connectLine here, as Observable do not know what line is connected to this observer
        if(this.connectLine) {
            this.connectLine.remove();
            this.connectLine = undefined;
        }

        // remove click-event listener
        if (this.handleClickRemover) {
            this.html?.removeEventListener('click', this.handleClickRemover);
        } else {
            throw Error('no handleClickRemover');
        }
    }
    public setConnectLine(line: SVGLineElement): void {
        this.connectLine = line;
    }
    public update(): void {
        this.updateCallbackToModule?.();
    }
    public updateEndLine(x: number, y: number): void {
        // if input is connected and this.connectLine is set
        if(this.connectLine) {
            const currentX2 = this.connectLine.getAttribute('x2');
            const currentY2 = this.connectLine.getAttribute('y2');
            if (currentX2 && currentY2) {
                const newX2 = parseFloat(currentX2) + x;
                const newY2 = parseFloat(currentY2) + y;
                this.connectLine.setAttribute('x2', newX2 + '');
                this.connectLine.setAttribute('y2', newY2 + '');
            }
        }
    }

    private emitConnectSignal(): void {
        if(this.emittedConnectorSignal) {
            this.connectService.emit(this.emittedConnectorSignal, this)
        }
    }

    private onConnecting(): void {
        this.html?.addEventListener('mouseover', event => {
            // stopPropagation from Module.ts -> moving Module on mousemove
            event.stopPropagation();
            if (event.buttons === 1) {
                // if another input already provides data
                // handle data instance of ImageDataObject separately because data object has a nested object. So this.data?.data would be true even if no data is set
                if(!(this.data instanceof ImageDataObject) && this.data?.data) {
                    this.removeConOutP();
                }
                else if (this.data instanceof ImageDataObject && this.data.data?.data) {
                    this.removeConOutP();
                }
                this.emitConnectSignal();
            }
        })
    }

    private releaseResources(): void {
        delete this.emittedConnectorSignal;
        delete this.connectService;
        delete this.html;
        delete this.data;
        delete this.connectLine;
        delete this.updateCallbackToModule;
        delete this.handleClickRemover;
    }
}