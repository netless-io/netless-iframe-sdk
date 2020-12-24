import { EventEmitter2, ListenerFn } from "eventemitter2";
import { RoomState } from "white-web-sdk";

enum BridgeEvent {
    Init = "Init",
    AttributesUpdate = "AttributesUpdate",
    SetAttributes = "SetAttributes",
    DispatchMagixEvent = "DispatchMagixEvent",
    ReciveMagixEvent = "ReciveMagixEvent",
    RegisterMagixEvent = "RegisterMagixEvent",
    RemoveMagixEvent = "RemoveMagixEvent",
    RemoveAllMagixEvent = "RemoveAllMagixEvent",
    RoomStateChanged = "RoomStateChanged",
    NextPage = "NextPage",
    PrevPage = "PrevPage",
}

export enum Events {
    AttributesUpdate = "AttributesUpdate",
    RoomStateChanged = "RoomStateChanged",
}

type BridgeData = {
    readonly kind: BridgeEvent;
    readonly payload: any;
};

type Attributes = {[key: string]: any};

export class NetlessIframeSDK {
    public targetOrigin: string = "*";
    private emitter: EventEmitter2 = new EventEmitter2();
    private magixEmitter: EventEmitter2 = new EventEmitter2();
    private _attributes: Attributes;
    private _roomState: RoomState;
    private magixListenerMap: Map<string, number> = new Map();
    private didDestory: boolean;

    public constructor(targetOrigin: string, attributes: Attributes, roomState: RoomState) {
        const url = new URL(targetOrigin);
        this.targetOrigin = url.origin;
        this._attributes = attributes;
        this._roomState = roomState;
        window.addEventListener("message", this.messageListener.bind(this));
        window.addEventListener("unload", () => {
            this.emitter.removeAllListeners();
            this.magixEmitter.removeAllListeners();
            this.postMessage(BridgeEvent.RemoveAllMagixEvent, true);
        });
    }

    private messageListener(event: MessageEvent): void {
        if ((typeof event.data) !== "object" && event.data !== null) {
            console.warn("event data not object");
            return;
        }
        const data: BridgeData = event.data;
        switch (data.kind) {
            case BridgeEvent.AttributesUpdate: {
                this._attributes = data.payload;
                this.emitter.emit(Events.AttributesUpdate, data.payload);
                break;
            }
            case BridgeEvent.ReciveMagixEvent: {
                const payload = data.payload;
                this.magixEmitter.emit(payload.event, payload);
                break;
            }
            case BridgeEvent.RoomStateChanged: {
                this._roomState = data.payload;
                this.emitter.emit(Events.RoomStateChanged, data.payload);
                break;
            }
            default: {
                console.warn(`${data.kind} not allow event.`);
                break;
            }
        }
    }

    public get attributes(): Attributes {
        return this._attributes;
    }

    public setAttributes(payload: any): void {
        const newAttibutes = {...this.attributes};
        for (const key in payload) {
            const value = payload[key];
            if (value === undefined) {
                delete newAttibutes[key];
            } else {
                newAttibutes[key] = value;
            }
        }
        this._attributes = newAttibutes;
        this.postMessage(BridgeEvent.SetAttributes, payload);
    }

    public get roomState(): RoomState {
        return this._roomState;
    }

    public get currentIndex(): number {
        return this._roomState.sceneState.index;
    }

    public get currentPage(): number {
        return this.currentIndex + 1;
    }

    public get totalPages(): number {
        return this._roomState.sceneState.scenes.length;
    }

    private postMessage(kind: BridgeEvent, payload: any): void {
        parent.postMessage({ kind, payload }, this.targetOrigin);
    }

    public on(event: string, listener: ListenerFn): void {
        this.emitter.addListener(event, listener);
    }

    public off(event: string, listener: ListenerFn): void  {
        this.emitter.off(event, listener);
    }

    public addMagixEventListener(event: string, listener: ListenerFn): void {
        this.magixEmitter.on(event, listener);
        const count = this.magixListenerMap.get(event);
        this.magixListenerMap.set(event, (count || 0) + 1);
        if (count === undefined) {
            this.postMessage(BridgeEvent.RegisterMagixEvent, event);
        }
    }

    public dispatchMagixEvent(event: string, payload: any): void {
        this.postMessage(BridgeEvent.DispatchMagixEvent, { event, payload });
    }

    public removeMagixEventListener(event: string, listener: ListenerFn): void {
        const count = this.magixListenerMap.get(event);
        if (count === undefined) {
            throw new Error(`not listen ${event}`);
        }
        this.magixEmitter.removeListener(event, listener);
        if (count > 1) {
            this.magixListenerMap.set(event, count - 1);
        } else if (count === 1) {
            this.magixListenerMap.delete(event);
            this.postMessage(BridgeEvent.RemoveMagixEvent, event);
        }
    }

    public nextPage(): void {
        this.postMessage(BridgeEvent.NextPage, true);
    }

    public prevPage(): void {
        this.postMessage(BridgeEvent.PrevPage, true);
    }

    public destroy(): void {
        if (this.didDestory) {
            throw new Error("sdk already destroy");
        }
        window.removeEventListener("message", this.messageListener);
        this.emitter.removeAllListeners();
        this.magixEmitter.removeAllListeners();
        this.postMessage(BridgeEvent.RemoveAllMagixEvent, true);
        this.didDestory = true;
    }
}
