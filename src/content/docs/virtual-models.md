---
title: "路由虚拟模型"
---

# 虚拟模型

虚拟模型是一种可供选择的模型，会针对每次请求挑选一个实际模型。你可以根据任务、成本或对话状态进行路由。例如，路由器可以将简单问题交给小模型，将复杂问题交给大模型，而用户始终只需选择一个模型。

通过[扩展](/extensions/)注册虚拟模型。它们与其他模型一样，会出现在 `/model`、`--model`、范围模型和设置中。虚拟模型可以列在任意 Provider 下，包括已有实际模型的 Provider，例如 `openai-codex/auto`。

<a id="selection-and-dispatch"></a>
## 选择与路由发送

虚拟模型会选择一个模型和思考等级。路由器针对每个请求，将这组选择映射到对应的实际模型和思考等级：

```
选择（虚拟模型、虚拟等级）  ->  路由发送（实际模型、实际等级）
jev/auto:low                  ->  anthropic/claude-sonnet-4-5:high
```

虚拟思考等级是路由器的输入，其含义由路由器决定，不一定对应具体的推理预算。

Pi 会分别记录这两组值：

| | 用户选择 | 实际路由 |
|---|---|---|
| 记录位置 | `model_change` 和 `thinking_level_change` 条目 | 每条助手消息中的 `provider`、`api`、`model`、`thinkingLevel` |
| 显示位置 | `ctx.model`、`ctx.thinkingLevel`、`PI_MODEL`、`PI_REASONING_LEVEL`、`/model` | 每条响应对应的助手消息 |

Provider 只会收到实际模型。助手消息会记录实际模型，因此即使跨不同实际模型重放对话，行为也与手动切换模型相同。恢复会话时，Pi 会从最近的 `model_change` 条目还原虚拟模型选择。如果该虚拟模型已不再注册，Pi 会回退到上次回复所使用的实际模型。

交互模式的页脚会在选择信息旁显示路由后的模型，例如 `auto • high → gpt-5.6-luna • medium`。`/session` 会列出每个实际模型产生的费用。

上下文用量采用最近一次回复所用实际模型的限制，即使该回复发生在切换到虚拟模型之前也是如此。如果尚无这样的回复，则使用虚拟模型声明的限制（如有）。压缩检查也会使用相同限制，并再次检查每个请求被路由到的模型。如果该模型的上下文窗口不足以容纳对话，Pi 会在发送请求前先压缩；路由器选择的模型不会因此改变。

<a id="register-a-virtual-model"></a>
## 注册虚拟模型

```typescript
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.registerVirtualModel({
    provider: "router",
    id: "auto",
    name: "Auto",
    thinkingLevels: ["low", "high"],
    route(request, ctx) {
      // 工具后续调用和重试保持使用处理该轮任务的模型。
      const sticky = request.failed ?? request.previous;
      if (request.reason !== "user" && sticky) {
        return { model: sticky.model, thinkingLevel: sticky.thinkingLevel ?? "medium" };
      }
      const id = request.thinkingLevel === "high" ? "claude-sonnet-4-5" : "claude-haiku-4-5";
      return { model: ctx.modelRegistry.find("anthropic", id)!, thinkingLevel: "medium" };
    },
  });
}
```

- `provider` 是此模型所列出的 Provider，可以是任意 Provider ID。一个 Provider 可以将多个虚拟模型与其实际模型一起列出。如果实际 Provider 已配置凭据，虚拟模型即可使用；如果使用没有任何 Provider 占用的 ID，则始终可用。
- `id` 不能与该 Provider 下某个实际模型的 ID 相同。如果之后目录刷新时加入了同 ID 的实际模型，虚拟模型会将它隐藏。
- `thinkingLevels` 列出用户可以选择的等级，默认值为 `["off"]`。
- `contextWindow` 和 `maxTokens` 会在首次响应前显示。未设置的限制视为未知。
- `input` 列出用户可选择的输入类型，默认支持文本和图片；不支持图片的实际模型会收到占位内容。

注册规则遵循 `pi.registerProvider()` 的排队和重新加载行为。再次注册相同 Provider 和 ID 会替换原有虚拟模型。`pi.unregisterVirtualModel(provider, id)` 可将其移除；`pi.unregisterProvider()` 不会移除虚拟模型。SDK 代码也可以不通过扩展注册虚拟模型：`modelRuntime.registerVirtualModel(definition)`。

<a id="route-requests"></a>
## 路由请求

每次使用虚拟模型发出请求前，都会调用 `route(request, ctx)`，并要求返回 `{ model, thinkingLevel }`。返回的模型可以是目录中任意一个凭据可用的实际模型；可通过 `ctx.modelRegistry` 查找。虚拟模型不能再路由到另一个虚拟模型。Pi 会将思考等级限制在返回模型支持的范围内。

| 字段 | 含义 |
|---|---|
| `model`、`thinkingLevel` | 用户选择的虚拟模型及思考等级 |
| `reason` | 发起请求的原因，见下表 |
| `previous` | `messages` 中最近一次成功响应所用的实际模型和思考等级 |
| `failed` | 对于 `retry`，表示失败请求所用的实际模型、思考等级和助手 `message`；该消息已不在 `messages` 中。消息包含 `stopReason` 和 `errorMessage`。如果路由本身失败，则没有此字段。 |
| `state` | 上次在此会话分支中返回的路由器状态，见下文 |
| `messages` | 本次请求的对话内容，包括系统消息 |
| `signal` | 本次请求的中止信号 |

| `reason` | 请求类型 |
|---|---|
| `user` | 用户发送消息后发出的第一个请求，包括引导消息和后续消息 |
| `continuation` | Agent 循环中的其他请求，例如工具结果或扩展消息之后的请求 |
| `retry` | 请求失败后的自动重试，包括上下文溢出后压缩完成的重试 |
| `direct` | Agent 循环之外的请求，例如压缩摘要请求或扩展调用 `ctx.modelRegistry.streamSimple()` |

对于 `continuation` 返回 `previous`，对于 `retry` 返回 `failed`，可以保持提示缓存和思考签名有效。在不同轮次之间切换模型是允许的，但会失去提示缓存。重试也可以改用其他模型，例如 `failed.message.errorMessage` 表示 Provider 过载或上下文溢出时。

如果 `route()` 抛出异常，或返回另一个虚拟模型或没有可用凭据的模型，请求会以错误响应结束。

<a id="keep-routing-state"></a>
## 保留路由状态

`route()` 可以在模型之外额外返回 `state`。Pi 会将它保存在会话分支中，并在后续请求的 `request.state` 中传回。可用它记录对话记录中没有的信息，例如分类器结果或路由阶段：

```typescript
pi.registerVirtualModel<{ phase: "plan" | "build" }>({
  provider: "router",
  id: "phased",
  name: "Phased",
  route(request, ctx) {
    const state = request.state ?? { phase: "plan" };
    const id = state.phase === "plan" ? "claude-opus-4-5" : "claude-haiku-4-5";
    return { model: ctx.modelRegistry.find("anthropic", id)!, thinkingLevel: "medium", state };
  },
});
```

- 状态必须可序列化为 JSON。返回 `undefined` 或 `request.state` 本身会保留当前状态。
- Pi 会将其他返回对象作为新状态保存，并在发送请求前完成保存，即使它与当前状态相同也不例外。只有状态发生变化时才应返回新对象。即使请求随后失败，该状态仍会保留。
- 状态会跟随会话树，因此分叉和 `/tree` 导航会使用对应分支的状态。压缩后状态也会保留。
- `direct` 请求没有状态，Pi 会忽略这类请求返回的状态。

对话记录已经包含模型选择以及每次实际分发的模型；`ctx.sessionManager.getBranch()` 可以同时读取两者。

路由器可以通过 `ctx.modelRegistry` 调用其他模型，例如使用 `ctx.modelRegistry.findOfType("classifier", provider, id)` 查找分类器模型，再调用 `ctx.modelRegistry.classify()`。这会增加首个 Token 返回前的延迟。

完整路由器示例请参阅 [`jev-router.ts`](../examples/extensions/jev-router.ts)。它会使用 Jev 分类器选择强大的 OpenAI Codex 模型进行规划，让该模型完成首次编辑，然后切换到更便宜的模型；虽然会损失一次提示缓存，但只发生一次。路由阶段会保存在路由器状态中。
