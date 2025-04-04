import { IInput } from '../input/i-input';
import { IOutput } from './i-output';
import ConnectService from '../utils/connect-service';
import { ImageDataObject, BaseObject, SceneObject } from '../utils/own-types';

export abstract class Output implements IOutput {
    protected html: HTMLElement | undefined;

    private data: ImageDataObject | SceneObject | BaseObject | undefined;
    
    private isConnecting: boolean | undefined = false;
    private connectService: any | undefined = ConnectService;
    private connectorSignal: string | undefined;
    private currentLine: SVGLineElement | undefined;
    private htmlPosition: DOMRect | undefined;
    private isConnected: boolean | undefined = false;
    private lines: Array<SVGLineElement> | undefined = [];
    private conInputs: Array<IInput> | undefined = [];
    private svgElement: SVGElement | undefined;  
    private mouseMoveListener: EventListener | undefined = (event: Event) => {
        if(this.isConnecting) {
            this.updateEndLine(event as MouseEvent);
        }
    };

    constructor(data: ImageDataObject | SceneObject | BaseObject, htmlModule: HTMLElement,  connectSignal: string) {
        this.data = data;
        this.html = document.createElement('span');
        this.html.classList.add('input');
        this.connectorSignal = connectSignal;
        this.setCssShape();
        this.conInputs = new Array();
        this.onConnectorSignal();
        this.stopConnecting();
        htmlModule.appendChild(this.html);

        const svgElement = document.getElementById('connectLines')
        if (svgElement instanceof SVGElement) {
            this.svgElement = svgElement
        } else {
            throw Error('no svg element in dom')
        }
    }

    protected abstract releaseInChild(): void
    protected abstract setCssShape(): void;

    public addConInput(inp: IInput): void {
        this.conInputs?.push(inp)
    }
    public notifyConInputs(): void {
        this.conInputs?.forEach((inp: IInput) => {
            inp.update();
        })
    }
    public destroy(): void {
        this.removeAllConInputs();
        this.releaseResources();
        this.releaseInChild();
    }
    public updateStartLine(x: number, y: number): void {
        this.lines?.forEach((line: SVGLineElement) => {
            const currentX1 = line.getAttribute('x1');
            const currentY1 = line.getAttribute('y1');
            if (currentX1 && currentY1) {
                const newX1 = parseFloat(currentX1) + x;
                const newY1 = parseFloat(currentY1) + y;
                line.setAttribute('x1', newX1 + '');
                line.setAttribute('y1', newY1 + '');
            }
        })
    }

    // create svg line see: https://stackoverflow.com/a/7549331, visited 23.02.23
    private createConnectLine(): void {
        this.currentLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');

        this.htmlPosition = this.html?.getBoundingClientRect();
        if(this.htmlPosition !== undefined) {
            this.currentLine.setAttribute('x1', this.htmlPosition.x + this.htmlPosition.width / 2 + 'px');
            this.currentLine.setAttribute('y1', this.htmlPosition.y + 'px');
            this.currentLine.setAttribute('x2', this.htmlPosition.x + this.htmlPosition.width / 2 + 'px');
            this.currentLine.setAttribute('y2', this.htmlPosition.y + 'px');
    
            this.currentLine.setAttribute('stroke', '#555');
            this.currentLine.setAttribute("stroke-width", "2");
            this.svgElement?.appendChild(this.currentLine);
        }
    }

    private listenToConnectorSignal(): void {
        if(this.connectorSignal) {
            this.connectService.listenOnce(this.connectorSignal, (inp: IInput): void => {
                // add only if input is not already connected
                if(!this.conInputs?.includes(inp)) {
                    this.addConInput(inp)

                    // setData which calls input.update()
                    inp.setData(this.data);
                    inp.setCallbackToConOutP((inp: IInput) => this.onConInputCallback(inp))
                    if(this.currentLine) {
                        inp.setConnectLine(this.currentLine);
                    } else {
                        throw Error('can not set connect line');
                    }
                    inp.onConnected();
                    this.isConnected = true;
                    this.isConnecting = false;
                }
            })
        }
    }

    private updateEndLine(event: MouseEvent): void {
        this.currentLine?.setAttribute('x2', event.x.toString());
        this.currentLine?.setAttribute('y2', event.y.toString());
    }
    
    private onConnectorSignal(): void {
        // stopPropagation from Module.ts moving Module on mousemove
        this.html?.addEventListener('mousemove', event => {
            event.stopPropagation();
        });
        this.html?.addEventListener('mousedown', (event) => {
            // stopPropagation from Module.ts -> moving Module on mousemove
            event.stopPropagation()
            if (event.buttons === 1) {
                this.isConnecting = true;
                this.listenToConnectorSignal();
                this.createConnectLine();
                this.onMouseMove();
            }
        })
    }

    private onMouseMove(): void {
        if(this.mouseMoveListener) {
            document.addEventListener('mousemove', this.mouseMoveListener);
        } else {
            throw Error('no mouseMoveListener');
        }
    }

    private onConInputCallback(inp: IInput): void {
        this.removeConInput(inp);
    };

    private releaseResources(): void {
        delete this.html;
        delete this.isConnecting;
        delete this.connectService;
        delete this.connectorSignal;
        delete this.currentLine;
        delete this.htmlPosition;
        delete this.isConnected;
        delete this.lines;
        delete this.conInputs;
        delete this.svgElement;
        delete this.mouseMoveListener;
    }

    private removeAllConInputs(): void {
        this.conInputs?.forEach((inp: IInput) => {
            /* Timeout is needed otherwise, for example, if there are several Renderer modules on the output and the module is deleted,
            ** Renderer would not be updated correctly with empty data. */
            setTimeout(() => {
                inp.removeConOutP();
            }, 100)
        })
        this.lines?.forEach(line => {
            line.remove();
        })
    }
    
    private removeConInput(inp: IInput): void {
        this.conInputs?.forEach((item, index) => {
            if (item === inp) this.conInputs?.splice(index, 1);
        });
    }

    private stopConnecting(): void {
        document.addEventListener('mouseup', event => {
            if ((this.isConnecting || this.isConnected) && this.currentLine ) {
                this.isConnecting = false;
                if(this.isConnected) {
                    this.lines?.push(this.currentLine);
                } else {
                    this.currentLine.remove();
                }
                this.stopListenConnectorSignal();
                if(this.mouseMoveListener) {
                    document.removeEventListener('mousemove', this.mouseMoveListener);
                } else {
                    throw Error('no mouseMoveListener');
                }
            }
        })
    }

    private stopListenConnectorSignal(): void {
        this.connectService.removeAllListeners();
        this.isConnected = false;
    }
}