import { NetlessIframeSDK, Events } from "../dist/index"

const sdk = new NetlessIframeSDK();

sdk.on(Events.initAttributes, attrbutes => {
    console.log(attrbutes)
})

window.addEventListener("message", ev => {
    console.log(ev)
})