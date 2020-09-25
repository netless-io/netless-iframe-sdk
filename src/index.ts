import { EventEmitter2, ListenerFn } from "eventemitter2";

enum BridgeEvent {
    MagixEvent = "MagixEvent",
    initAttributes = "initAttributes",
    attributesUpdate = "attributesUpdate",
    setAttributes = "setAttributes",
    registerMagixEvent = "registerMagixEvent",
    removeMagixEvent = "removeMagixEvent",
    removeAllMagixEvent = "removeAllMagixEvent",
    onRoomStateChanged = "onRoomStateChanged",
    nextPage = "nextPage",
    prevPage = "prevPage",
}

export enum Events {
    initAttributes = "initAttributes",
    attributesUpdate = "attributesUpdate",
    onRoomStateChanged = "onRoomStateChanged",
}

type BridgeData = {
    kind: string;
    payload: any;
};

export class NetlessIframeSDK {
    public targetOrigin: string = "*";
    private emitter: EventEmitter2 = new EventEmitter2();
    private magixEmitter: EventEmitter2 = new EventEmitter2();
    private _attributes: any = {};
    private _systemState: any = {};

    public constructor(targetOrigin: string) {
        this.targetOrigin = targetOrigin;
        window.addEventListener("message", this.messageListener.bind(this));
        window.addEventListener("unload", () => {
            this.emitter.removeAllListeners();
            this.magixEmitter.removeAllListeners();
            this.postMessage(BridgeEvent.removeAllMagixEvent, true);
        });
    }

    private messageListener(event: MessageEvent): void {
        const data: BridgeData = event.data;
        switch (data.kind) {
            case BridgeEvent.initAttributes:
                this._attributes = Object.assign(this._attributes, data.payload);
                this.emitter.emit(BridgeEvent.initAttributes, data.payload);
                break;
            case BridgeEvent.attributesUpdate:
                this._attributes = Object.assign(this._attributes, data.payload);
                this.emitter.emit(BridgeEvent.attributesUpdate, data.payload);
                break;
            case BridgeEvent.MagixEvent:
                const payload = data.payload;
                this.magixEmitter.emit(payload.event, payload.payload);
                break;
            case BridgeEvent.onRoomStateChanged:
                this._systemState = Object.assign(this._systemState, data.payload);
                this.emitter.emit(BridgeEvent.onRoomStateChanged, data.payload);
        }
    }

    public get attributes(): any {
        return this._attributes;
    }

    public setAttributes(payload: any): void {
        this.postMessage(BridgeEvent.setAttributes, payload);
    }

    public get systemState(): any {
        return this._systemState;
    }

    public get isFollower(): boolean {
        return this._systemState?.broadcastState?.mode === "follower";
    }

    private postMessage(kind: string, payload: any): void {
        const allowFollwerEvents: string[] = [BridgeEvent.registerMagixEvent, BridgeEvent.removeAllMagixEvent];
        const isAllowEvent = allowFollwerEvents.find(event => event === kind);
        if (this.isFollower && !isAllowEvent) {
            return;
        }
        parent.postMessage({ kind, payload }, this.targetOrigin);
    }

    public on(event: string, listener: ListenerFn): void {
        this.emitter.addListener(event, listener);
    }

    public addMagixEventListener(event: string, listener: ListenerFn): void {
        this.magixEmitter.on(event, listener);
        this.postMessage(BridgeEvent.registerMagixEvent, event);
    }

    public dispatchMagixEvent(event: string, payload: any): void {
        this.postMessage(BridgeEvent.MagixEvent, { event, payload });
    }

    public removeMagixEventListener(event: string, listener: ListenerFn): void {
        this.magixEmitter.removeListener(event, listener);
        this.postMessage(BridgeEvent.removeMagixEvent, event);
    }

    public nextPage(): void {
        if (this.attributes.currentPage >= this.attributes.totalPage) {
            return;
        }
        this.postMessage(BridgeEvent.nextPage, true);
    }

    public prevPage(): void {
        if (this.attributes.currentPage <= 1) {
            return;
        }
        this.postMessage(BridgeEvent.prevPage, true);
    }

    public destroy(): void {
        window.removeEventListener("message", this.messageListener);
        this.emitter.removeAllListeners();
        this.magixEmitter.removeAllListeners();
    }
}
