import { GaussDialog } from "../../dialog/dialogs/gauss-dialog";
import { FilterDataModify } from "../../filter/filter-data-modify";

// specify kernel dim, see L. Papula. Mathematische Formelsammlung: Für Ingenieure und Naturwissenschaftler. Springer Vieweg, 12. Auflage, p. 423
// https://campar.in.tum.de/Chair/HaukeHeibelGaussianDerivatives, visited 25.03.23
// definition kernel value calc and normalization, see: https://mevislabdownloads.mevis.de/docs/current/FMEstable/ReleaseMeVis/Documentation/Publish/ModuleReference/GaussSmoothing.html, visited 25.03.23
// function have to be outside the class, as it is used in super()
function createGaussianKernel(sigma: number): number[] {
    const kernel: number[] = [];

    // with a mean value of 2 * σ, 95% of the values below the Gaussian bell curve are contained in the resulting interval [(2 * σ) , (2 * σ)].
    const standardDeviation = 2 * sigma

    const mean = Math.floor(standardDeviation / 2);
    let sum = 0.0;

    for (let i = -standardDeviation; i <= standardDeviation; i++) {
        for (let j = -standardDeviation; j <= standardDeviation; j++) {
            const x = i - mean;
            const y = j - mean;
            const value = Math.exp(-(x * x + y * y) / (2 * sigma * sigma));
            kernel.push(value);
            // accumulate the kernel values
            sum += value;
        }
    }

    // normalize kernel
    for (let i = 0; i < kernel.length; i++) {
        kernel[i] /= sum;
    }
    return kernel;
}

export default class GaussSmoothingData extends FilterDataModify {
    constructor() {
        super('Gauss Smoothing Data', createGaussianKernel(1.0), new GaussDialog((gaussSigma: number) => this.onDialogSubmitCallback(gaussSigma), 1))
    }

    protected setInnerModule(): void {
    }

    protected updateKernel(value: number): void {
        this.kernel = createGaussianKernel(value);
    }
}