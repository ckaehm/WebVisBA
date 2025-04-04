import { VoxelSize } from "./own-types";

export class DataObject {
    data: Uint8Array | Uint16Array | null | undefined = null;
    dataType: string = '';
    modality: string = '';
    width: number = 0;
    height: number = 0;
    depth: number = 0;
    voxelSize: VoxelSize = {
        x: 1,
        y: 1,
        z: 1
    }
}