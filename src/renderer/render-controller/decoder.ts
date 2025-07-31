declare var VideoDecoder: any;
declare var EncodedVideoChunk: any;
declare var VideoFrame: any;

const hardcodedDescription = new Uint8Array([
	0x01, 0x42, 0xC0, 0x1F, 0xFF, 0xE1, 0x00, 0x16,
	0x67, 0x42, 0xC0, 0x1F, 0xDA, 0x01, 0x40, 0x16,
	0xEC, 0x04, 0x4B, 0xCB, 0x0C, 0x0C, 0x0F, 0x10,
	0x00, 0x00, 0x03, 0x00, 0x04, 0x00, 0x00, 0x03,
	0x00, 0xCA, 0x3C, 0x58, 0xBA, 0x80, 0x01, 0x00,
	0x04, 0x68, 0xCE, 0x3C, 0x80
]).buffer;

export type FrameCallback = (frame: typeof VideoFrame) => void;


export class VideoDecoderController {
    private decoder: typeof VideoDecoder;

    constructor(codec: string, description: ArrayBuffer, onFrame: FrameCallback) {
        this.decoder = new VideoDecoder({
            output: (frame : typeof VideoFrame) => {
                onFrame(frame);
            },
            error: (e:any) => console.error("Decoder error: ", e)
        });

        if(!description)
            description = hardcodedDescription;

        this.decoder.configure({
            codec: codec,
            description: description,
            optimizeForLatency: true
        });
    }

    decodeChunk(chunk: typeof EncodedVideoChunk): void {
        this.decoder.decode(chunk);
    }

    flush(): Promise<void> {
        return this.decoder.flush();
    }
}