import { FilterShader } from "../../filter/filter-shader";

// kernel have to be defined outside the class, as it is used in super()
const kernel = [
    0, -1, 0,
    -1, 4, -1,
    0, -1, 0,
];

export default class LaplaceFilterShader extends FilterShader {
    constructor() {
        super('Laplace Filter Shader', kernel);
    }

    protected setInnerModule(): void {
    }

    protected updateKernel(value: any): void {
        throw Error('method not implemented')
    }
}