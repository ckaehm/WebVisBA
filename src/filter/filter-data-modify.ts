import { IDialog } from "../dialog/i-dialog";
import { CsvDowload } from "../utils/dowloadCsv";
import { Filter } from "./filter";

export abstract class FilterDataModify extends Filter {

    private logRows: string | undefined = 'Voxels, DataType, Modality, KernelSize, Execution Time(ms)}\n';

    private loaderSection: HTMLElement | undefined = document.createElement('section');
    private loader: HTMLElement | undefined = document.createElement('div');

    private isLoggingEnabled: boolean | undefined = false;

    constructor(moduleName: string, kernel: number[], dialog: IDialog | undefined = undefined) {
        super(moduleName, kernel, dialog)
        this.loaderSection?.classList.add('loaderSection');
        this.loader?.classList.add('loader');
        if (this.loader) {
            this.loaderSection?.appendChild(this.loader);
        }
    }

    protected async onUpdateImageDataInput(): Promise<void> {
        if (this.imageDataOutputs) {
            if (this.imageDataOutputs?.length <= 1) {
                this.setImageDataProperties();
                // shader is not set by default in setImageDataProperties() because a shader filter changes it
                if (this.imageDataOutputs[0].shader && this.imageDataInputs?.[0].shader?.kernels) {
                    this.imageDataOutputs[0].shader.kernels = this.imageDataInputs?.[0].shader?.kernels;
                }

                if (this.imageDataOutputs[0].data) {
                    // if image data from other module is not null
                    if (this.imageDataInputs?.[0].data?.data) {
                        await this.setFilteredOutput();
                    } else {
                        this.imageDataOutputs[0].data.data = null;
                    }
                }
            } else {
                throw Error('Filter with more than one output not possible!')
            }
        }
    }

    protected async setFilteredOutput(): Promise<void> {
        if (this.imageDataInputs?.[0].data?.data && this.imageDataOutputs?.[0].data) {
            // add load animation to html
            if (this.loaderSection) {
                document.body.appendChild(this.loaderSection);
            }

            // short timeout to give the browser time to render and display the loader
            await new Promise(resolve => setTimeout(resolve, 50));

            // save filter execution time in csv
            if (this.isLoggingEnabled) {
                const kernelSize = this.kernel?.length;
                const loops = 5;
                let sumExecution = 0;
                for (let index = 0; index < loops; index++) {
                    const startDate = new Date();

                    this.imageDataOutputs[0].data.data = this.filterImageData();

                    const endDate = new Date();
                    const executionTime = endDate.getTime() - startDate.getTime();
                    sumExecution += executionTime;

                }
                if (this.logRows) {
                    // use dataSize from the output as a filter that reduces the size of the data
                    const dataSize = this.imageDataOutputs[0].data.data ? this.imageDataOutputs[0].data.data.length : 0;
                    const dataType = this.imageDataInputs[0].data.dataType;
                    const modality = this.imageDataInputs[0].data.modality;
                    const averageExecution = sumExecution / loops;
                    this.logRows = this.logRows + `\n${dataSize}, ${dataType}, ${modality}, ${kernelSize}, ${averageExecution}`
                    CsvDowload(this.logRows, `filter-execution-time-${this.moduleName}`);
                }
            }
            // no logging
            else {
                this.imageDataOutputs[0].data.data = this.filterImageData();
            }

            this.loaderSection?.remove();
        }
    }

    protected releaseFilterChild(): void {
        delete this.logRows;
        delete this.loaderSection;
        delete this.loader;
        delete this.isLoggingEnabled;
    }

    private filterImageData(): Uint8Array | Uint16Array | null {
        if (this.imageDataOutputs) {
            if (this.imageDataInputs?.[0].data?.data && this.kernel) {
                const imageData: Uint8Array | Uint16Array = this.imageDataInputs[0].data.data;
                const kernelDim = Math.sqrt(this.kernel.length);
                // check if used kernel is quadratic and has a center value
                // kernel have to be quadratic, so center x and y are the same
                if (kernelDim !== Math.floor(kernelDim) && kernelDim % 2 == 1) {
                    throw new Error('Invalid kernel');
                }
                // round off because the mean kernel index is needed [-mean, mean]
                const mean = Math.floor(kernelDim / 2);
                if (this.imageDataOutputs?.length <= 1) {
                    const width: number = this.imageDataInputs[0].data.width
                    const height: number = this.imageDataInputs[0].data.height
                    const depth: number = this.imageDataInputs[0].data.depth
                    const newWidth: number = width - 2 * mean;
                    const newHeight: number = height - 2 * mean;
                    const newImageSize: number = newWidth * newHeight * depth;

                    const outputData: Uint8Array | Uint16Array = imageData instanceof Uint16Array ? new Uint16Array(newImageSize) : new Uint8Array(newImageSize);

                    // loop over each pixel
                    let pixelIndex = 0;
                    for (let z = 0; z < depth; z++) {
                        const currentSlice: number = z * height * width;
                        for (let y = mean; y < height - mean; y++) {
                            const currentRow: number = y * width;
                            for (let x = mean; x < width - mean; x++) {
                                let sum: number = 0;
                                const currentImageIndex: number = currentSlice + currentRow + x;
                                let kernelIndex: number = 0;

                                // apply kernel on each pixel
                                for (let ky = -mean; ky <= mean; ky++) {
                                    const currentRowKernel = ky * width;
                                    for (let kx = -mean; kx <= mean; kx++) {
                                        const kernelValue: number = this.kernel[kernelIndex];
                                        const imageIndex: number = currentImageIndex + currentRowKernel + kx;

                                        sum += imageData[imageIndex] * kernelValue;
                                        kernelIndex += 1;
                                    }
                                }

                                const pixelValue: number = sum > 0 ? sum : 0;
                                outputData[pixelIndex] = pixelValue;
                                pixelIndex += 1;
                            }
                        }
                    }
                    // set new with and height
                    if (this.imageDataOutputs[0].data) {
                        this.imageDataOutputs[0].data.width = newWidth;
                        this.imageDataOutputs[0].data.height = newHeight;
                    }
                    return outputData;

                } else {
                    throw Error('Filter with more than one output not possible!')
                }
            }
        }
        return null;
    };
}