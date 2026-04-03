---
title: API Reference
description: Complete API documentation for all public methods.
order: 0
---

## `init(options)`

Initialize the application with the given configuration.

```typescript
function init(options: InitOptions): App
```

### Parameters

| Parameter | Type      | Required | Description                 |
| --------- | --------- | -------- | --------------------------- |
| `name`    | `string`  | Yes      | Application name            |
| `debug`   | `boolean` | No       | Enable debug logging        |
| `port`    | `number`  | No       | Server port (default: 3000) |

### Returns

Returns an `App` instance.

### Example

```typescript
import { init } from 'my-package'

const app = init({
  name: 'my-app',
  debug: process.env.NODE_ENV !== 'production',
  port: 8080,
})
```

## `app.start()`

Start the application server.

```typescript
async function start(): Promise<void>
```

:::note
This method is asynchronous. Make sure to `await` it or handle the promise.
:::

### Example

```typescript
await app.start()
console.log('Server is running')
```

## `app.stop()`

Gracefully shut down the application.

```typescript
async function stop(): Promise<void>
```

### Example

```typescript
process.on('SIGTERM', async () => {
  await app.stop()
  process.exit(0)
})
```

## `app.use(plugin)`

Register a plugin with the application.

```typescript
function use(plugin: Plugin): App
```

### Parameters

| Parameter | Type     | Description       |
| --------- | -------- | ----------------- |
| `plugin`  | `Plugin` | A plugin instance |

### Example

```typescript
import { analyticsPlugin } from 'my-package/plugins'

app.use(
  analyticsPlugin({
    trackingId: 'UA-XXXXX-X',
  })
)
```

:::caution
Plugins must be registered before calling `app.start()`. Registering plugins after the server has started will throw an error.
:::
