import { IDialog } from "../dialog/i-dialog";
import { Filter } from "./filter";

export abstract class FilterShader extends Filter {

    constructor(moduleName: string, kernel: number[], dialog: IDialog | undefined = undefined) {
        super(moduleName, kernel, dialog)
    }

    protected async onUpdateImageDataInput(): Promise<void> {
        if (this.imageDataOutputs && this.kernel) {
            const dim = Math.sqrt(this.kernel.length);
            // check if used kernel is quadratic and has a center value
            if (dim !== Math.floor(dim) && dim % 2 == 1) {
                throw new Error('Invalid kernel');
            }
            if (this.imageDataOutputs?.length <= 1) {
                this.setImageDataProperties();
                if (this.imageDataOutputs[0].data && this.imageDataOutputs[0].data) {
                    // image data object is not set by default in setImageDataProperties() because a data change filter changes it
                    if (this.imageDataInputs?.[0].data?.data || this.imageDataInputs?.[0].data?.data === null) {
                        this.imageDataOutputs[0].data.data = this.imageDataInputs?.[0].data?.data
                    }
                    
                    this.setFilteredOutput();
                }
            } else {
                throw Error('Filter with more than one output not possible!')
            }
        }
    }

    protected setFilteredOutput(): void {
        if (this.imageDataOutputs && this.kernel) {
            if ( this.imageDataInputs?.[0].shader && this.imageDataOutputs[0].shader ) {
                // copy shader to have different references in the input and output of the module, as with data
                this.imageDataOutputs[0].shader.kernels = this.imageDataInputs?.[0].shader.kernels.slice();
                this.imageDataOutputs[0].shader?.kernels?.push(this.kernel);
            }
        }
    }

    protected releaseFilterChild(): void {
    }
}