var MP4Box = require('mp4box');

export interface DemuxResult {
    videoTrack: any;
    samples: any[];
}

export class MP4Demuxer {
    public async demux(mp4Bytes: Uint8Array): Promise<DemuxResult> {
        return new Promise((resolve) => {
            const mp4boxFile = MP4Box.createFile();
                        
            const arrayBuffer = mp4Bytes.buffer.slice(mp4Bytes.byteOffset, mp4Bytes.byteOffset + mp4Bytes.byteLength) as any;
            arrayBuffer.fileStart = 0;

            const samples: any[] = [];

            mp4boxFile.onReady = (info:any) => {
                const videoTrack = info.tracks.find((t:any) => t.codec.startsWith("avc") || t.type === "video");
            
                mp4boxFile.setExtractionOptions(videoTrack!.id);

                mp4boxFile.start();

                mp4boxFile.onSamples = (_id:any, _user:any, _samples:any) => {
                    samples.push(..._samples);

                    const entry = _samples?.[0]?.description;
                    const avcC = entry?.avcC;

                    if(avcC && avcC.SPS?.length && avcC.PPS?.length) {
                        const sps = avcC.SPS[0]?.data;
                        const pps = avcC.PPS[0]?.data;

                        if(sps instanceof Uint8Array && pps instanceof Uint8Array){
                            const description = buildAvcCBuffer(sps, pps);
                            videoTrack.description = {
                                config: {
                                    description: description
                                }
                            }
                        } else {
                            console.warn("SPS or PPS not an Uint8Array.")
                        }
                        
                    }

                    resolve({videoTrack, samples});
                };
            };
            mp4boxFile.appendBuffer(arrayBuffer);
            mp4boxFile.flush();
        });

        function buildAvcCBuffer(sps: Uint8Array, pps: Uint8Array): ArrayBuffer {
            const spsLength = sps.length;
            const ppsLength = pps.length;
            
            const totalLength = 7 + 2 + spsLength + 1 + 2 + ppsLength;
            const avcC = new Uint8Array(totalLength);

            let offset = 0;

            avcC[offset++] = 0x01;
            avcC[offset++] = sps[1];
            avcC[offset++] = sps[2];
            avcC[offset++] = sps[3];
            avcC[offset++] = 0xFF | 1;

            avcC[offset++] = 0xE1;
            avcC[offset++] = (spsLength >> 8) & 0xFF;
            avcC[offset++] = spsLength & 0xFF;
            avcC.set(sps, offset);
            offset += spsLength;

            avcC[offset++] = 0x01;
            avcC[offset++] = (ppsLength >> 8) & 0xFF;
            avcC[offset++] = ppsLength & 0xFF;
            avcC.set(pps, offset);
            offset += ppsLength;

            return avcC.buffer;
        }
    }


}