import { FFmpeg } from "@ffmpeg/ffmpeg";

export class VideoPreprocessor {
    private ffmpeg = new FFmpeg();

    constructor(){};

    public async preprocess(file: File): Promise<Uint8Array> {
        await this.ffmpeg.load();

        const inputName = file.name;
        const outputName = 'output.mp4';

        const buffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(buffer);
        await this.ffmpeg.writeFile(inputName, uint8Array);

        
        await this.ffmpeg.exec([
            "-i", inputName,
            "-c:v", "libx264",
            "-profile:v", "baseline",
            "-preset", "ultrafast",
            "-level", "3.0",
            "-b:a", "128k",
            "-tune", "zerolatency",
            "-c:a", "aac",
            "-movflags", "faststart",
            "-pix_fmt", "yuv420p",
            "-an",
            outputName
        ])
        
        const data = await this.ffmpeg.readFile(outputName);

        if(typeof data === "string")
            throw new Error("Unexpected input!");
        return data;
    }
}
