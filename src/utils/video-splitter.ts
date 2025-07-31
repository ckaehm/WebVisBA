import { FFmpeg } from "@ffmpeg/ffmpeg";
import * as JSZip from "jszip";

export class VideoSplitter {
    
    public static async split(mp4Bytes:Uint8Array, splits:{ relativeTime:number; world:string}[], totalDuration: number){
        const ffmpeg = new FFmpeg();
        await ffmpeg.load();

        await ffmpeg.writeFile('input.mp4', mp4Bytes);

        for(let i = 0; i < splits.length; i++){
            const start = splits[i].relativeTime / 1000;
            const end = (i + 1 < splits.length) ? splits[i + 1].relativeTime / 1000 : null;
            const duration = end !== null ? (end - start) : (totalDuration - start);

            const outputName = `${i}_${splits[i].world}.mp4`;

            const args = ["-i", "input.mp4", "-ss", `${start}`];
            if(duration){
                args.push("-t", `${duration}`);
            }
            args.push("-c", "copy", outputName);

            console.log(`Creating clip: ${outputName} from ${start} for ${duration}s`);
            await ffmpeg.exec(args);
        }

        for(let i = 0; i < splits.length; i++){
            const videosToDownload: {name: string; url: string}[] = [];

            for(let i = 0; i < splits.length; i++){
                const outputName = `${i}_${splits[i].world}.mp4`
                const data = await ffmpeg.readFile(outputName);
                if(typeof data === "string") throw new Error("Unexpected string output!");
                const blob = new Blob([data], {type: "video/mp4"});
                const url = URL.createObjectURL(blob);
                videosToDownload.push({name: outputName, url});            
            }

            if(!document.querySelector(".download-overlay")){
                VideoSplitter.showDownloadDialog(videosToDownload);
            }
        }
    }
    public static showDownloadDialog(videos: {name: string; url: string}[]): void {
        const overlay = document.createElement("div");
        overlay.classList.add("download-overlay");

        const dialog = document.createElement("div");
        dialog.classList.add("download-dialog");
        dialog.innerHTML = "<p>Möchten Sie die Videos herunterladen?</p>";

        const downloadButton = document.createElement("button");
        downloadButton.id = "download-button";
        downloadButton.innerText = "Herunterladen";
        downloadButton.onclick = () => {
            downloadAsZip(videos);
            document.body.removeChild(overlay);
        }

        const cancelButton = document.createElement("button");
        cancelButton.id = "cancel-button";
        cancelButton.innerText = "Abbrechen";
        cancelButton.onclick = () => {
            videos.forEach(v => URL.revokeObjectURL(v.url));
            document.body.removeChild(overlay);
        };

        dialog.appendChild(downloadButton);
        dialog.appendChild(cancelButton);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        const downloadAsZip = async(videos: {name: string; url:string}[]) => {
            const zip = new JSZip();
            for(const video of videos){
                const response = await fetch(video.url);
                const blob = await response.blob();
                zip.file(video.name, blob);
            }
            const content = await zip.generateAsync({type: "blob"});
            const a = document.createElement("a");
            a.href = URL.createObjectURL(content);
            a.download = "video_segments.zip";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    }


}