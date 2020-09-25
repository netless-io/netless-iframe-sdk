import { EventEmitter2 } from "eventemitter2";
import get from "lodash.get";

const PARENT_ORIGN = "*";

enum BrigeEvent {
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

type BrigeData = {
    kind: string;
    payload: any;
};

export interface ListenerFn {
    (...values: any[]): void;
}

export class NetlessIframeSDK {
    private emitter: EventEmitter2 = new EventEmitter2();
    private magixEmitter: EventEmitter2 = new EventEmitter2();
    private _attributes: any = {};
    private _systemState: any = {};

    public constructor() {
        window.addEventListener("message", this.messageListener.bind(this));
        window.addEventListener("unload", () => {
            this.emitter.removeAllListeners();
            this.magixEmitter.removeAllListeners();
            this.postMessage(BrigeEvent.removeAllMagixEvent, true);
        });
    }

    private messageListener(event: MessageEvent): void {
        const data: BrigeData = event.data;
        switch (data.kind) {
            case BrigeEvent.initAttributes:
                this._attributes = Object.assign(this._attributes, data.payload);
                this.emitter.emit(BrigeEvent.initAttributes, data.payload);
                break;
            case BrigeEvent.attributesUpdate:
                this._attributes = Object.assign(this._attributes, data.payload);
                this.emitter.emit(BrigeEvent.attributesUpdate, data.payload);
                break;
            case BrigeEvent.MagixEvent:
                const payload = data.payload;
                this.magixEmitter.emit(payload.event, payload.payload);
                break;
            case BrigeEvent.onRoomStateChanged:
                this._systemState = Object.assign(this._systemState, data.payload);
                this.emitter.emit(BrigeEvent.onRoomStateChanged, data.payload);
        }
    }

    public get attributes(): any {
        return this._attributes;
    }

    public setAttributes(payload: any): void {
        this.postMessage(BrigeEvent.setAttributes, payload);
    }

    public get systemState(): any {
        return this._systemState;
    }

    public get isFollower(): boolean {
        return get(this._systemState, "broadcastState.mode") === "follower";
    }

    private postMessage(kind: string, payload: any): void {
        const allowFollwerEvents: string[] = [BrigeEvent.registerMagixEvent, BrigeEvent.removeAllMagixEvent];
        const isAllowEvent = allowFollwerEvents.find(event => event === kind);
        if (this.isFollower && !isAllowEvent) {
            return;
        }
        parent.postMessage({ kind, payload }, PARENT_ORIGN);
    }

    public on(event: string, listener: ListenerFn): void {
        this.emitter.addListener(event, listener);
    }

    public addMagixEventListener(event: string, listener: ListenerFn): void {
        this.magixEmitter.on(event, listener);
        this.postMessage(BrigeEvent.registerMagixEvent, event);
    }

    public dispatchMagixEvent(event: string, payload: any): void {
        this.postMessage(BrigeEvent.MagixEvent, { event, payload });
    }

    public removeMagixEventListener(event: string, listener: ListenerFn): void {
        this.magixEmitter.removeListener(event, listener);
        this.postMessage(BrigeEvent.removeMagixEvent, event);
    }

    public nextPage(): void {
        if (this.attributes.currentPage >= this.attributes.totalPage) {
            return;
        }
        this.postMessage(BrigeEvent.nextPage, true);
    }

    public prevPage(): void {
        if (this.attributes.currentPage <= 1) {
            return;
        }
        this.postMessage(BrigeEvent.prevPage, true);
    }

    public destroy(): void {
        window.removeEventListener("message", this.messageListener);
        this.emitter.removeAllListeners();
        this.magixEmitter.removeAllListeners();
    }
}
