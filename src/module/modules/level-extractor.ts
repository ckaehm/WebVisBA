import { Module } from "../module";
import { ModuleInOutPutTypes } from "../../utils/enum-input-output-module";
import { MP4Demuxer } from "../../renderer/render-controller/mp4-demuxer";
import { VideoDecoderController } from "../../renderer/render-controller/decoder";
import { VideoRenderer } from "../../renderer/render-controller/video-renderer";
import { OCRModule } from "../../utils/ocr-service";
import { VideoSplitter } from "../../utils/video-splitter";


declare var EncodedVideoChunk: any;
declare var VideoFrame: any;

export default class LevelExtractor extends Module {
    private demuxer: MP4Demuxer;
    private ocrModule!: OCRModule;
    private videoRenderer!: VideoRenderer;
    private decoderController!: VideoDecoderController;

    private canvasProcessed!: HTMLCanvasElement;
    private lastWorldString: string | null = null;
    private videoProcessed: boolean = false;

    private worldChangeTimestamps: {relativeTime: number; world: string}[] = [];

    constructor(){
        super(
            {
                [ModuleInOutPutTypes.ImageData]: 1,
                [ModuleInOutPutTypes.Scene]: 0,
                [ModuleInOutPutTypes.BaseObject]: 0
            },
            {
                [ModuleInOutPutTypes.ImageData]: 1,
                [ModuleInOutPutTypes.Scene]: 0,
                [ModuleInOutPutTypes.BaseObject]: 0
            },
            "levelSegmenter",
            "Level Segmenter"
        );
        this.demuxer = new MP4Demuxer();
    }

    protected async onUpdateImageDataInput(): Promise<void> {
        const input = this.imageDataInputs?.[0];
        const videoData = input?.data?.data as Uint8Array;

        if(this.imageDataOutputs?.[0]){
            this.imageDataOutputs[0].data!.data = videoData;
            this.notifyOutputs();
        }
        if(videoData && !this.videoProcessed){
            this.videoProcessed = true;
            await this.processVideo(videoData);
        }
    }

    private async processVideo(mp4Bytes: Uint8Array): Promise<void>{
        const { videoTrack, samples } = await this.demuxer.demux(mp4Bytes);
        const duration = (videoTrack.movie_duration / videoTrack.movie_timescale) * 1000;

        this.decoderController = new VideoDecoderController(
            videoTrack.codec,
            videoTrack.description?.config?.description,
            (frame: typeof VideoFrame) => {
                this.processFrame(frame);
            }
        );
        await this.feedDecoder(samples, videoTrack);
        await VideoSplitter.split(mp4Bytes, this.worldChangeTimestamps, duration);
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

    private async processFrame(frame: typeof VideoFrame): Promise<void> {
        if(!this.videoRenderer){
            this.setupOCR(frame.codedWidth, frame.codedHeight);
        }
        this.videoRenderer.enqueueFrame(frame);
    }

    private setupOCR(width: number, height: number): void{
        this.videoRenderer = new VideoRenderer(this.canvasProcessed, true);
        this.videoRenderer.startRendering();

        this.ocrModule = new OCRModule(this.canvasProcessed);
        this.ocrModule.onResult = (text: string) => {
            const match = text.match(/WORLD\s*(\d+)-(\d+)/i);
            if(match){
                const worldString = `${match[1]}-${match[2]}`;
                if(this.lastWorldString !== worldString){
                    const now = performance.now();
                    const relativeTime = now - this.videoRenderer.getStartTime();
                    this.worldChangeTimestamps.push({relativeTime, world: worldString});
                    console.log(`World changed to ${worldString} at ${relativeTime.toFixed(0)}ms`);
                    this.lastWorldString = worldString;
                }
            }
        }
        
    }

    protected releaseInChild(): void {
        this.canvasProcessed.remove();
        this.canvasProcessed = undefined!;
        this.worldChangeTimestamps = [];
        this.lastWorldString = null;
    }

    protected setInnerModule(): void {
        const renderWidth = 768;
        const renderHeight = 432;

        if(!document.querySelector("#processedCanvas")){
            this.canvasProcessed = document.createElement("canvas");
            this.canvasProcessed.width = renderWidth;
            this.canvasProcessed.height = renderHeight;
            this.canvasProcessed.classList.add("video-player-canvas");
            this.canvasProcessed.id = "processedCanvas";

            if(!document.querySelector(".video-player-container")){
                const container = document.createElement("div");
                container.classList.add("video-player-container");
                container.appendChild(this.canvasProcessed);
                document.body.appendChild(container);
            } else if(document.querySelector(".video-player-container")) {
                document.querySelector(".video-player-container")?.appendChild(this.canvasProcessed);
            }

            this.resizeCanvas();
            window.addEventListener("resize", () => this.resizeCanvas());
        }
    }

    private resizeCanvas(): void {
        const aspectRatio = 16 / 9;
        let width = window.innerWidth;
        let height = width / aspectRatio;
        if(height > window.innerHeight){
            height = window.innerHeight;
            width = height * aspectRatio;
        }
        this.canvasProcessed.style.width = `${width}px`;
        this.canvasProcessed.style.height = `${height}px`;
    }


    protected onUpdateSceneInput(): Promise<void> {return Promise.resolve();}
    protected onUpdateBaseObjectInput(): Promise<void> {return Promise.resolve();}
    protected onDialogSubmitCallback(value: any): void {}
}