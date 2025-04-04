import { IInput } from "../input/i-input";

export interface IOutput{
    addConInput(inp: IInput): void;
    destroy(): void
    notifyConInputs(): void;
    updateStartLine(x: number, y: number): void
}