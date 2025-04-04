import { DialogDefaultSubmitCallback } from "../utils/own-types";
import { IDialog } from "./i-dialog";

export abstract class Dialog implements IDialog {
    protected dialog: HTMLElement | undefined = document.createElement('div');
    protected submitCallback: DialogDefaultSubmitCallback | undefined;

    protected checkbox: HTMLInputElement | undefined = document.createElement('input');

    private backdrop: HTMLElement | undefined = document.createElement('div');
    private cancelButton: HTMLButtonElement | undefined = document.createElement('button');
    private updateButton: HTMLButtonElement | undefined = document.createElement('button');

    constructor(submitCallback: DialogDefaultSubmitCallback) {
        this.dialog?.classList.add('dialog');
        this.backdrop?.classList.add('dialog-backdrop')
        this.submitCallback = submitCallback;
        this.createDialog();

        this.onSubmit();
        this.onCancel();
    }

    protected abstract callback(): void;
    protected abstract submit(): void;
    protected abstract cancel(): void;
    protected abstract createDialogSettings(): void;
    protected abstract releaseInChild(): void;

    public openDialog(): void {
        if (this.dialog && this.backdrop) {
            document.getElementById('workspace')?.appendChild(this.dialog);
            document.getElementById('workspace')?.appendChild(this.backdrop)
        }
    }

    public destroy(): void {
        this.releaseResources();
        this.releaseInChild();
    }

    private onSubmit(): void {
        this.updateButton?.addEventListener(('click'), (event) => {
            event.preventDefault();
            this.submit();
            this.callback();
            this.closeDialog();
        })
    }

    private onCancel(): void {
        this.cancelButton?.addEventListener('click', (event) => {
            event.preventDefault();
            this.cancel();
            this.closeDialog();
        })
    }

    private closeDialog(): void {
        this.dialog?.remove();
        this.backdrop?.remove();
    }

    private createDialog(): void {
        if (this.cancelButton) {
            this.cancelButton.classList.add('cancel');
            this.cancelButton.innerHTML = '<p>x</p>';
            this.cancelButton.value = 'cancel';
            this.cancelButton.formMethod = 'dialog';

            this.dialog?.appendChild(this.cancelButton);
        }

        this.createDialogSettings();

        const divUpdate: HTMLElement = document.createElement('div');
        divUpdate.classList.add('grid');
        this.dialog?.appendChild(divUpdate);

        if (this.checkbox) {
            const autoUpdate = document.createElement('div');
            autoUpdate.classList.add('autoUpdate');
            this.checkbox.type = 'checkbox';
            this.checkbox.classList.add('checkbox');
            this.checkbox.checked = false;
            autoUpdate.appendChild(this.checkbox);
            const spanText = document.createElement('span');
            spanText.innerHTML = '<p>Auto update</p>'
            autoUpdate.appendChild(spanText);
            divUpdate.appendChild(autoUpdate);
        }

        if (this.updateButton) {
            this.updateButton.classList.add('update');
            this.updateButton.innerHTML = '<p>Update</p>'
            this.updateButton.value = 'default';

            divUpdate.appendChild(this.updateButton);
        }
    }

    private releaseResources(): void {
        delete this.submitCallback;
        delete this.dialog;
        delete this.checkbox;
        delete this.cancelButton;
        delete this.updateButton;

    }
}