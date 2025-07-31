import { Module } from "../module";
import { ModuleInOutPutTypes } from "../../utils/enum-input-output-module";
import { MP4Demuxer } from '../../renderer/render-controller/mp4-demuxer';
import { VideoDecoderController } from '../../renderer/render-controller/decoder';
import { VideoRenderer } from '../../renderer/render-controller/video-renderer';

declare var EncodedVideoChunk: any;
declare var VideoFrame: any;

export default class VideoPlayer extends Module{
    private canvasOriginal!: HTMLCanvasElement;
    private demuxer: MP4Demuxer;
    private decoderController!: VideoDecoderController;
    private videoRenderer!: VideoRenderer;
    private videoProcessed: boolean = false;

    constructor(){
        super(
            {
                [ModuleInOutPutTypes.ImageData]: 1,
                [ModuleInOutPutTypes.Scene]: 0,
                [ModuleInOutPutTypes.BaseObject]: 0,
            },
            {
                [ModuleInOutPutTypes.ImageData]: 0,
                [ModuleInOutPutTypes.Scene]: 0,
                [ModuleInOutPutTypes.BaseObject]: 0,
            },
            "videoplayer",
            "VideoPlayer"
        );

        this.demuxer = new MP4Demuxer();
    }
    

    protected async onUpdateImageDataInput(): Promise<void> {
        const input = this.imageDataInputs?.[0];
        const videoData = input?.data?.data as Uint8Array;
        if(videoData && !this.videoProcessed){
            this.videoProcessed = true;
            await this.processVideo(videoData);
        }
    }

    private async processVideo(mp4Bytes: Uint8Array): Promise<void> {
        const { videoTrack, samples } = await this.demuxer.demux(mp4Bytes);
        this.videoRenderer = new VideoRenderer(this.canvasOriginal, false);

        this.decoderController = new VideoDecoderController(
            videoTrack.codec,
            videoTrack.description?.config?.description,
            
            (frame: typeof VideoFrame) => {
                this.videoRenderer.enqueueFrame(frame);
            }
        );
        
        this.videoRenderer.startRendering();
        await this.feedDecoder(samples, videoTrack);
    }

    private async feedDecoder(samples: any[], track: any): Promise<void> {
        for(const sample of samples){
            const chunk = new EncodedVideoChunk({
                type: sample.is_sync ? 'key' : 'delta',
                timestamp: sample.dts / track.timescale * 1_000_000,
                data: new Uint8Array(sample.data)
            });
            this.decoderController.decodeChunk(chunk);
        }
        await this.decoderController.flush();
        this.videoRenderer.stopRendering();
    }

    protected releaseInChild(): void {
        this.canvasOriginal.remove();
        this.canvasOriginal = undefined!;
    }
    
    protected setInnerModule(): void {
        const renderWidth = 768;
        const renderHeight = 432;

        if(!document.querySelector("#originalCanvas")){
            this.canvasOriginal = document.createElement("canvas");

            this.canvasOriginal.width = renderWidth;
            this.canvasOriginal.height = renderHeight;
            this.canvasOriginal.classList.add("video-player-canvas");
            this.canvasOriginal.id = "originalCanvas";

            if(!document.querySelector(".video-player-container")){
                const container = document.createElement("div");
                container.classList.add("video-player-container");
                container.appendChild(this.canvasOriginal);
                document.body.appendChild(container);
            } else if(document.querySelector(".video-player-container")) {
                document.querySelector(".video-player-container")?.appendChild(this.canvasOriginal);
            }

            this.resizeCanvasElements();

            window.addEventListener("resize", () => this.resizeCanvasElements());
        }
    }

    private resizeCanvasElements(): void {
        const aspectRatio = 16 / 9;
        const gap = 10; 
        const numberOfCanvas = 2;

        const totalGap = gap * (numberOfCanvas - 1);
        const maxCanvasHeight = (window.innerHeight - totalGap) / numberOfCanvas;

        const widthByHeight = maxCanvasHeight * aspectRatio;

        let finalWidth = widthByHeight;
        let finalHeight = maxCanvasHeight;

        if (finalWidth > window.innerWidth) {
            finalWidth = window.innerWidth;
            finalHeight = finalWidth / aspectRatio;
        }

        this.canvasOriginal.style.width = `${finalWidth}px`;
        this.canvasOriginal.style.height = `${finalHeight}px`;
    }

    protected onUpdateSceneInput(): Promise<void> {return Promise.resolve();}
    protected onUpdateBaseObjectInput(): Promise<void> {return Promise.resolve();}
    protected onDialogSubmitCallback(value: any): void {}
}


