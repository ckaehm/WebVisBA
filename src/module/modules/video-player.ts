import { DataLoader } from "../../data-loader/data-loader";

export default class VideoPlayer extends DataLoader{
    protected loadFile(): Promise<Blob | undefined> {
        throw new Error("Method not implemented.");
    }
    protected releaseInDataLoadChild(): void {
        throw new Error("Method not implemented.");
    }
    protected setDataProperties(): void {
        throw new Error("Method not implemented.");
    }
    protected setInnerModule(): void {
        throw new Error("Method not implemented.");
    }
}