import { Module } from "../module";
import { ModuleInOutPutTypes } from "../../utils/enum-input-output-module";
import { VideoPreprocessor } from "../../utils/video-preprocessor";
import { DataObject } from "../../utils/data-object";

export default class VideoLoader extends Module {
    private fileInput!: HTMLInputElement;

    constructor(){
        super(
            {
                [ModuleInOutPutTypes.ImageData]: 0,
                [ModuleInOutPutTypes.Scene]: 0,
                [ModuleInOutPutTypes.BaseObject]: 0
            },
            {
                [ModuleInOutPutTypes.ImageData]: 1,
                [ModuleInOutPutTypes.Scene]: 0,
                [ModuleInOutPutTypes.BaseObject]: 0
            },
            "videoLoader",
            "Video Loader"
        );
    }

    protected releaseInChild(): void {
        this.fileInput = undefined!;
    }

    protected setInnerModule(): void {
        this.fileInput = document.createElement("input");
        this.fileInput.classList.add("video-loader-input");
        this.fileInput.type = "file";
        this.fileInput.accept = "video/*";

        const button = document.createElement("button");
        button.classList.add("upload-button");
        button.innerText = "Video hochladen";

        button.onclick = () => this.onLoadVideo();

        const container = document.createElement("div");
        container.appendChild(this.fileInput);
        container.appendChild(button);

        this.html?.appendChild(container);
    }

    private async onLoadVideo(): Promise<void> {
        if(!this.fileInput.files || this.fileInput.files.length === 0){
            console.error("Video-Loader: No video found!");
            return;
        };

        const file = this.fileInput.files[0];

        let processedVideo: Uint8Array;

        if(!this.isMP4(file)){
            console.log("File is not MP4. Running preprocessing...");
            const preprocessor = new VideoPreprocessor();
            processedVideo = await preprocessor.preprocess(file);
        } else {
            console.log("File is already MP4. Skipping preprocessing.");
            const arrayBuffer = await file.arrayBuffer();
            processedVideo = new Uint8Array(arrayBuffer);
        }


        const dataObject = new DataObject();
        dataObject.data = processedVideo;
        dataObject.dataType = "Video";

        if(this.imageDataOutputs?.[0]){
            this.imageDataOutputs[0].data!.data = processedVideo;
            this.notifyOutputs();
        }
    }

    private isMP4(file: File): boolean {
        return file.type === "video/mp4" || file.name.toLowerCase().endsWith(".mp4");
    }
    
    protected onUpdateImageDataInput(): Promise<void> {return Promise.resolve();}
    protected onUpdateSceneInput(): Promise<void> {return Promise.resolve();}
    protected onUpdateBaseObjectInput(): Promise<void> {return Promise.resolve();}
    protected onDialogSubmitCallback(value: any): void {}

}