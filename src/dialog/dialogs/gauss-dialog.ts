import { DialogSubmitCallback } from "../../utils/own-types";
import { Dialog } from "../dialog";

export class GaussDialog extends Dialog {
    private label: HTMLLabelElement | undefined;
    private select: HTMLInputElement | undefined;
    private gaussSigma: number | undefined

    constructor(submitCallback: DialogSubmitCallback, gaussSigma: number) {
        super(submitCallback)
        this.gaussSigma = gaussSigma;

        this.onSelect();
    }

    protected callback(): void {
        this.submitCallback?.(this.gaussSigma ? this.gaussSigma : 0);
    }

    protected cancel(): void {
        if (this.select && this.dialog) {
            this.select.value = this.gaussSigma ? this.gaussSigma?.toString() : '0';
        }
    }

    protected createDialogSettings(): void {
        // create class variable in function, as it is called in the parent class and at this point the variable has not been created yet
        this.label = document.createElement('label');
        this.select = document.createElement('input');
        const divGaussSigma: HTMLElement = document.createElement('div');
        divGaussSigma.classList.add('grid');

        this.dialog?.appendChild(divGaussSigma);

        if (this.label) {
            this.label.textContent = 'Gauss sigma:';
            divGaussSigma.appendChild(this.label);
        }

        if (this.select) {
            this.select.type = 'number';
            this.select.min = '0.5';
            this.select.max = '5';
            this.select.step = '0.5';
            this.select.value = this.gaussSigma ? this.gaussSigma.toString() : '1';
            divGaussSigma.appendChild(this.select);
        }
    }

    protected submit(): void {
        if (this.dialog && this.select) {
            this.gaussSigma = parseFloat(this.select.value);
        }
    }

    protected releaseInChild(): void {
        delete this.label;
        delete this.select;
        delete this.gaussSigma;
    }

    private onSelect(): void {
        this.select?.addEventListener('change', () => {
            if (this.select) {
                // is auto update true
                if (this.checkbox?.checked && this.dialog) {
                    this.gaussSigma = parseFloat(this.select.value);
                    this.submitCallback?.(this.gaussSigma);
                }
            }
        });
    }
}