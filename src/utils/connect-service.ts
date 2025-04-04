import { EventEmitter } from 'events';
import { IInput } from '../input/i-input';
import { ConnectServiceCallback } from './own-types';

class ConnectService {
    private static INSTANCE: ConnectService;
    private event: EventEmitter;

    constructor() {
        this.event = new EventEmitter();
    }

    public static getInstance(): ConnectService {
        if (!ConnectService.INSTANCE) {
            ConnectService.INSTANCE = new ConnectService();
        }
        return ConnectService.INSTANCE;
    }

    public emit(signal: string, input: IInput): void {
        this.event.emit(signal, input)
    }

    public listenOnce(signal: string, callback: ConnectServiceCallback): void {
        this.event.once(signal, callback);
    }

    public removeAllListeners(): void {
        this.event.removeAllListeners();
    }
}

export default ConnectService.getInstance();