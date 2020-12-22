import { NetlessIframeSDK } from "./NetlessIframeSDK";

const Init = "Init";
const SDKCreate = "SDKCreate";
const InitTimeout = 500;

export const createNetlessIframeSDK = (targetOrigin: string): Promise<NetlessIframeSDK> => {
    parent.postMessage({ kind: SDKCreate }, targetOrigin);
    return new Promise((resolve, reject) => {
        const listener = (event: MessageEvent) => {
            const data = event.data;
            if (data.kind === Init) {
                const { attributes, roomState } = data.payload;
                const sdk = new NetlessIframeSDK(targetOrigin, attributes, roomState);
                window.removeEventListener("message", listener);
                clearTimeout(timer);
                resolve(sdk);
            }
        };
        const timer = setTimeout(() => {
            window.removeEventListener("message", listener);
            reject("SDK did not receive init event, initializtion failed.");
        }, InitTimeout);
        window.addEventListener("message", listener);
    });
};

export * from "./NetlessIframeSDK";
