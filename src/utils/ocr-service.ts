import { createWorker, Worker as TesseractWorker } from "tesseract.js";

export class OCRModule {
    private worker!: TesseractWorker;
    private isRunning = false;

    constructor(private canvas: HTMLCanvasElement, private interval: number = 500){
        this.init();
    }

    private async init() {
        this.worker = await createWorker();
        this.worker.reinitialize("eng");
        setInterval(() => this.runOCR(), this.interval);
    }

    public onResult: (text: string) => void = () => {};

    private async runOCR() {
        if(this.isRunning) return;
        this.isRunning = true;

        try{
            const dataURL = this.canvas.toDataURL();
            const result = await this.worker.recognize(dataURL);
            this.onResult(result.data.text);
        } catch (err) {
            console.error("OCR error: ", err);
        } finally {
            this.isRunning = false;
        }
    }

    public async destroy(){
        if(this.worker){
            await this.worker.terminate();
        }
    }
}