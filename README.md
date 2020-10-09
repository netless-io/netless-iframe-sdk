# netless-iframe-sdk

> `netless-iframe-sdk` 是为了方便用户使用, 封装了跟白板交互而设计的, 可以让用户不直接操作 `postMessage` 简化操作



## 安装

```
# npm
npm install netless-iframe-sdk

# yarn
yarn add netless-iframe-sdk
```



## 初始化 SDK

```typescript
import { createNetlessIframeSDK, NetlessIframeSDK, Events } from "netless-iframe-sdk"

const netlessIframeSDK = await createNetlessIframeSDK("http://localhost:3000") // 当前 iframe 的父级域名

netlessIframeSDK.attributes // attributes 是在所有白板中同步的状态
netlessIframeSDK.setAttributes({ count: 1 }) // setAttributes 设置状态
```

## 翻页

```typescript
netlessIframeSDK.nextPage() // 翻到下一页
netlessIframeSDK.prevPage() // 翻到上一页
```



## 监听系统事件

```typescript
netlessIframeSDK.on(Events.AttributesUpdate, attributes => {
   // attributes 更新
})

netlessIframeSDK.on(Events.RoomStateChanged, state => {
   // 白板状态更新
})
```



## 自定义事件

```typescript
netlessIframeSDK.addMagixEventListener("NextPage", payload => {
   // 来自白板的自定义翻页事件
})

netlessIframeSDK.addMagixEventListener("PrevPage", payload => {
   // 来自白板的自定义翻页事件
})

netlessIframeSDK.removeMagixEventListener("NextPage", payload => {
  // 移除翻页事件监听
})
```



## 移除所有事件监听

```typescript
netlessIframeSDK.destroy() // 移除对 window 的 message 事件监听, 移除所有自定义事件的监听
```
