import { NetlessIframeSDK } from "./NetlessIframeSDK";

const Init = "Init";
const InitTimeout = 500;

export const createNetlessIframeSDK = (targetOrigin: string): Promise<NetlessIframeSDK> => {
    return new Promise((resolve, reject) => {
        const listener = (event: MessageEvent) => {
            const data = event.data;
            if (data.kind === Init) {
                const { attributes, roomState } = data.payload;
                const sdk = new NetlessIframeSDK(targetOrigin, attributes, roomState);
                window.removeEventListener("message", listener);
                resolve(sdk);
            }
            setTimeout(() => {
                reject("SDK did not receive init event, initializtion failed.");
            }, InitTimeout);
        };
        window.addEventListener("message", listener);
    });
};

export * from "./NetlessIframeSDK";
