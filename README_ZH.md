<div align="center">

# CodeBox

### Claude Code、Codex、Gemini CLI、OpenCode 和 OpenClaw 的全方位管理工具

[![Version](https://img.shields.io/github/v/release/Sdkwork-Cloud/sdkwork-codebox?display_name=tag)](https://github.com/Sdkwork-Cloud/sdkwork-codebox/releases/latest)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)](https://github.com/Sdkwork-Cloud/sdkwork-codebox/releases/latest)
[![Built with Tauri](https://img.shields.io/badge/built%20with-Tauri%202-orange.svg)](https://tauri.app/)
[![Downloads](https://img.shields.io/github/downloads/Sdkwork-Cloud/sdkwork-codebox/total?logo=github)](https://github.com/Sdkwork-Cloud/sdkwork-codebox/releases/latest)

[English](README.md) | 中文 | [日本語](README_JA.md) | [更新日志](CHANGELOG.md)

</div>

## ❤️赞助商

<details open>
<summary>点击折叠</summary>

[![MiniMax](assets/partners/banners/minimax-zh.jpeg)](https://platform.minimaxi.com/subscribe/coding-plan?code=7kYF2VoaCn&source=link)

MiniMax M2.5 在编程、工具调用与搜索、办公等核心生产力场景均达到或刷新行业 SOTA，拥有架构师级代码能力与高效任务拆解能力，推理速度较上一代提升 37%、token 消耗更优；100 token/s 连续工作一小时仅需 1 美金，让复杂 Agent 规模化部署经济可行，已在企业多职能场景深度落地，加速全民 Agent 时代到来。

[点击](https://platform.minimaxi.com/subscribe/coding-plan?code=7kYF2VoaCn&source=link)即可领取 MiniMax Coding Plan 专属 88 折优惠！

---

<table>
<tr>
<td width="180"><a href="https://www.packyapi.com/register?aff=codebox"><img src="assets/partners/logos/packycode.png" alt="PackyCode" width="150"></a></td>
<td>感谢 PackyCode 赞助了本项目！PackyCode 是一家稳定、高效的API中转服务商，提供 Claude Code、Codex、Gemini 等多种中转服务。PackyCode 为本软件的用户提供了特别优惠，使用<a href="https://www.packyapi.com/register?aff=codebox">此链接</a>注册并在充值时填写"codebox"优惠码，首次充值可以享受9折优惠！</td>
</tr>

<tr>
<td width="180"><a href="https://cloud.siliconflow.cn/i/drGuwc9k"><img src="assets/partners/logos/silicon_zh.jpg" alt="SiliconFlow" width="150"></a></td>
<td>感谢硅基流动赞助了本项目！硅基流动是一个高性能 AI 基础设施与模型 API 平台，一站式提供语言、语音、图像、视频等多模态模型的快速、可靠访问。平台支持按量计费、丰富的多模态模型选择、高速推理和企业级稳定性，帮助开发者和团队更高效地构建和扩展 AI 应用。通过<a href="https://cloud.siliconflow.cn/i/drGuwc9k">此链接</a>注册并完成实名认证，即可获得 ¥20 奖励金，可在平台内跨模型使用。硅基流动现已兼容 OpenClaw，用户可接入硅基流动 API Key 免费调用主流 AI 模型。</td>
</tr>

<tr>
<td width="180"><a href="https://aigocode.com/invite/CODEBOX"><img src="assets/partners/logos/aigocode.png" alt="AIGoCode" width="150"></a></td>
<td>感谢 AIGoCode 赞助了本项目！AIGoCode 是一个集成了 Claude Code、Codex 以及 Gemini 最新模型的一站式平台，为你提供稳定、高效且高性价比的AI编程服务。本站提供灵活的订阅计划，零封号风险，国内直连，无需魔法，极速响应。AIGoCode 为 CodeBox 的用户提供了特别福利，通过<a href="https://aigocode.com/invite/CODEBOX">此链接</a>注册的用户首次充值可以获得额外10%奖励额度！</td>
</tr>

<tr>
<td width="180"><a href="https://www.aicodemirror.com/register?invitecode=9915W3"><img src="assets/partners/logos/aicodemirror.jpg" alt="AICodeMirror" width="150"></a></td>
<td>感谢 AICodeMirror 赞助了本项目！AICodeMirror 提供 Claude Code / Codex / Gemini CLI 官方高稳定中转服务，支持企业级高并发、极速开票、7×24 专属技术支持。
Claude Code / Codex / Gemini 官方渠道低至 3.8 / 0.2 / 0.9 折，充值更有折上折！AICodeMirror 为 CodeBox 的用户提供了特别福利，通过<a href="https://www.aicodemirror.com/register?invitecode=9915W3">此链接</a>注册的用户，可享受首充8折，企业客户最高可享 7.5 折！</td>
</tr>

<tr>
<td width="180"><a href="https://cubence.com/signup?code=CODEBOX&source=codebox"><img src="assets/partners/logos/cubence.png" alt="Cubence" width="150"></a></td>
<td>感谢 Cubence 赞助本项目！Cubence 是一家可靠高效的 API 中继服务提供商，提供对 Claude Code、Codex、Gemini 等模型的中继服务，并提供按量、包月等灵活的计费方式。Cubence 为 CodeBox 的用户提供了特别优惠：使用 <a href="https://cubence.com/signup?code=CODEBOX&source=codebox">此链接</a> 注册，并在充值时输入 "CODEBOX" 优惠码，每次充值均可享受九折优惠！</td>
</tr>

<tr>
<td width="180"><a href="https://www.dmxapi.cn/register?aff=bUHu"><img src="assets/partners/logos/dmx-zh.jpeg" alt="DMXAPI" width="150"></a></td>
<td>感谢 DMXAPI（大模型API）赞助了本项目！ DMXAPI，一个Key用全球大模型。
为200多家企业用户提供全球大模型API服务。· 充值即开票 ·当天开票 ·并发不限制  ·1元起充 ·  7x24 在线技术辅导，GPT/Claude/Gemini全部6.8折，国内模型5~8折，Claude Code 专属模型3.4折进行中！<a href="https://www.dmxapi.cn/register?aff=bUHu">点击这里注册</a></td>
</tr>

<tr>
<td width="180"><a href="https://www.compshare.cn/coding-plan?ytag=GPU_YY_YX_git_codebox"><img src="assets/partners/logos/ucloud.png" alt="优云智算" width="150"></a></td>
<td>感谢优云智算赞助了本项目！优云智算是UCloud旗下AI云平台，提供稳定、全面的国内外模型API，仅一个key即可调用。主打包月、按量的高性价比 Coding Plan 套餐，基于官方2~5折优惠。支持接入 Claude Code、Codex 及 API 调用。支持企业高并发、7*24技术支持、自助开票。通过<a href="https://www.compshare.cn/coding-plan?ytag=GPU_YY_YX_git_codebox">此链接</a>注册的用户，可得免费5元平台体验金！</td>
</tr>

<tr>
<td width="180"><a href="https://www.right.codes/register?aff=CODEBOX"><img src="assets/partners/logos/rightcode.jpg" alt="RightCode" width="150"></a></td>
<td>感谢 Right Code 赞助了本项目！Right Code 稳定提供 Claude Code、Codex、Gemini 等模型的中转服务。主打<strong>极高性价比</strong>的Codex包月套餐，<strong>提供额度转结，套餐当天用不完的额度，第二天还能接着用！</strong>充值即可开票，企业、团队用户一对一对接。同时为 CodeBox 的用户提供了特别优惠：通过<a href="https://www.right.codes/register?aff=CODEBOX">此链接</a>注册，每次充值均可获得实付金额25%的按量额度！</td>
</tr>

<tr>
<td width="180"><a href="https://aicoding.sh/i/CODEBOX"><img src="assets/partners/logos/aicoding.jpg" alt="AICoding" width="150"></a></td>
<td>感谢 AICoding.sh 赞助了本项目！AICoding.sh —— 全球大模型 API 超值中转服务！Claude Code 1.9 折，GPT 0.1 折，已为数百家企业提供高性价比 AI 服务。支持 Claude Code、GPT、Gemini 及国内主流模型，企业级高并发、极速开票、7×24 专属技术支持，通过<a href="https://aicoding.sh/i/CODEBOX">此链接</a> 注册的 CodeBox 用户，首充可享受九折优惠！</td>
</tr>

<tr>
<td width="180"><a href="https://crazyrouter.com/register?aff=OZcm&ref=codebox"><img src="assets/partners/logos/crazyrouter.jpg" alt="Crazyrouter" width="150"></a></td>
<td>感谢 Crazyrouter 赞助了本项目！Crazyrouter 是一个高性能 AI API 聚合平台——一个 API Key 即可访问 300+ 模型，包括 Claude Code、Codex、Gemini CLI 等。全部模型低至官方定价的 55%，支持自动故障转移、智能路由和无限并发。Crazyrouter 为 CodeBox 用户提供了专属优惠：通过<a href="https://crazyrouter.com/register?aff=OZcm&ref=codebox">此链接</a>注册即可获得 <strong>$2 免费额度</strong>，首次充值时输入优惠码 `CODEBOX` 还可获得额外 <strong>30% 奖励额度</strong>！</td>
</tr>

<tr>
<td width="180"><a href="https://www.sssaicode.com/register?ref=DCP0SM"><img src="assets/partners/logos/sssaicode.png" alt="SSSAiCode" width="150"></a></td>
<td>感谢 SSSAiCode 赞助了本项目！SSSAiCode 是一家稳定可靠的API中转站，致力于提供稳定、可靠、平价的Claude、CodeX模型服务，<strong>提供高性价比折合0.5￥/$的官方Claude服务</strong>，支持包月、Paygo多种计费方式、支持当日快速开票，SSSAiCode为本软件的用户提供特别优惠，使用<a href="https://www.sssaicode.com/register?ref=DCP0SM">此链接</a>注册每次充值均可享受10$的额外奖励！</td>
</tr>

<tr>
<td width="180"><a href="https://www.openclaudecode.cn/register?aff=aOYQ"><img src="assets/partners/logos/mikubanner.svg" alt="Micu" width="150"></a></td>
<td>感谢 米醋API 赞助了本项目！米醋API 是一家致力于提供极致性价比与高稳定性的全球大模型中转服务商。米醋API 背后有实体企业做核心保障，杜绝跑路风险，支持极速正规开票！我们主打“试错零成本”：1 元起充低门槛，0 手续费随时退款！米醋API 为本软件的用户提供了特别优惠，使用<a href="https://www.openclaudecode.cn/register?aff=aOYQ">此链接</a>注册并在充值时填写"codebox"优惠码可享九折优惠！</td>
</tr>

<tr>
<td width="180"><a href="https://x-code.cc/register?aff=IbPp"><img src="assets/partners/logos/xcodeapi.png" alt="XCodeAPI" width="150"></a></td>
<td>感谢 XCodeAPI 赞助了本项目！XCodeAPI 为本软件的用户提供特别福利，使用<a href="https://x-code.cc/register?aff=IbPp">此链接</a>注册后首单加赠10%的额度!(联系站长领取)</td>
</tr>

<tr>
<td width="180"><a href="https://ctok.ai"><img src="assets/partners/logos/ctok.png" alt="CTok" width="150"></a></td>
<td>感谢 CTok.ai 赞助了本项目！CTok.ai 致力于打造一站式 AI 编程工具服务平台。我们提供 Claude Code 专业套餐及技术社群服务，同时支持 Google Gemini 和 OpenAI Codex。通过精心设计的套餐方案和专业的技术社群，为开发者提供稳定的服务保障和持续的技术支持，让 AI 辅助编程真正成为开发者的生产力工具。点击<a href="https://ctok.ai">这里</a>注册！</td>
</tr>

</table>

</details>

## 为什么选择 CodeBox？

CodeBox 现在已经从单纯的“供应商切换器”，演进为一个面向 AI 编程 CLI
的完整桌面控制台。当前版本的产品信息架构是明确分层的：

- 左侧产品列表负责在 Claude Code、Codex、Gemini CLI、OpenCode、OpenClaw 之间切换
- 顶部上下文 Tabs 会跟随不同产品动态变化，并记住每个产品上一次有效的视图
- 设置中心拥有独立的左侧垂直导航，不再和产品配置混在一起
- 供应商新增与编辑采用 Drawer 工作台，尽量保留原始页面上下文并减少长表单滚动
- OpenClaw 的 Workspace 使用左侧文件浏览器 + 右侧编辑器 + 顶部文件 Tabs 的方式组织
- Runtime 控制台统一承载 Proxy、Takeover、Failover、Usage、Diagnostics

这解决了多 CLI 时代最常见的问题：配置分散、目录不统一、视图切换混乱、工作区文件缺少专用编辑体验，以及跨产品扩展能力难以维护。

## 界面预览

| 产品总览                                          | 设置中心                                           |
| ------------------------------------------------- | -------------------------------------------------- |
| ![产品总览](assets/screenshots/product-shell.svg) | ![设置中心](assets/screenshots/control-center.svg) |

| Workspace 编辑器                                             | 供应商工作台                                               |
| ------------------------------------------------------------ | ---------------------------------------------------------- |
| ![Workspace 编辑器](assets/screenshots/workspace-editor.svg) | ![供应商工作台](assets/screenshots/provider-workbench.svg) |

## 核心能力

[完整更新日志](CHANGELOG.md) | [发布说明](docs/release-notes/v3.12.1-zh.md)

- **统一产品壳层**：左侧产品列表 + 顶部产品 Tabs 的信息架构，按产品提供不同的配置视图。
- **供应商工作台**：新增和编辑流程统一进入 Drawer，支持应用专属与统一供应商两种入口。
- **OpenClaw 专属视图**：供应商、Workspace、环境变量、工具权限、Agents 配置、会话管理按产品能力精确展示。
- **Workspace 文件体验**：文件浏览器、Daily Memory 搜索、文件打开 Tabs、右侧编辑器集中工作。
- **Runtime 控制台**：Proxy、接管、故障转移、用量、诊断聚合到同一工作流。
- **设置中心**：外观、通用、数据与同步、目录、高级、关于使用独立左侧垂直导航。
- **Deep Link 导入**：支持 `codebox://` 导入供应商、MCP、提示词、技能；未锁定目标产品时可多选导入。
- **统一配置目录**：所有平台统一到 `~/.sdkwork/codebox`，Windows 展开为 `%USERPROFILE%\\.sdkwork\\codebox`。

## 常见问题

<details>
<summary><strong>CodeBox 支持哪些 AI CLI 工具？</strong></summary>

CodeBox 支持五个工具：**Claude Code**、**Codex**、**Gemini CLI**、**OpenCode** 和 **OpenClaw**。每个工具都有专属的供应商预设和配置管理。

</details>

<details>
<summary><strong>切换供应商后需要重启终端吗？</strong></summary>

大多数工具需要重启终端或 CLI 工具才能使更改生效。例外的是 **Claude Code**，它目前支持供应商数据的热切换，无需重启。

</details>

<details>
<summary><strong>切换供应商之后我的插件配置怎么不见了？</strong></summary>

CodeBox 使用“通用配置片段”功能，在不同的供应商之间传递 Key 和请求地址之外的通用数据，您可以在“编辑供应商”菜单的“通用配置面板”里，点击“从当前供应商提取”，把所有的通用数据提取到通用配置中，之后在新建“供应商”的时候，只要勾选“写入通用配置”（默认勾选），就会把插件等数据写入到新的供应商配置中。您的所有配置项都会保存在运行本软件的时候，第一次导入的默认供应商里面，不会丢失。

</details>

<details>
<summary><strong>macOS 提示"未知开发者"警告 — 如何解决？</strong></summary>

这是由于作者没有苹果开发者账号（正在注册中）。关闭警告后，前往**系统设置 → 隐私与安全性 → 仍要打开**。之后应用即可正常打开。

</details>

<details>
<summary><strong>为什么总有一个正在激活中的供应商无法删除？</strong></summary>

本软件的设计原则是“最小侵入性”，即使卸载本软件，也不会影响应用的正常使用。

所以系统总会保留一个正在激活中的配置，因为如果将所有配置全部删除，该应用将无法正常使用。如果你不经常使用某个对应的应用，可以在设置中关掉该应用的显示。如果你想切换回官方登录，可以参考下条。

</details>

<details>
<summary><strong>如何切换回官方登录？</strong></summary>

可以在预设供应商里面添加一个官方供应商。切换过去之后，执行一遍 Log out / Log in 流程，之后便可以在官方供应商和第三方供应商之间随意切换。CodeX 可以在不同官方供应商之间进行切换，方便多个 Plus 或者 Team 账号之间切换。

</details>

<details>
<summary><strong>我的数据存储在哪里？</strong></summary>

- **默认本地目录**：所有平台统一为 `~/.sdkwork/codebox/`，Windows 实际展开为 `%USERPROFILE%\\.sdkwork\\codebox\\`
- **数据库**：`<app-config-dir>/codebox.db`（SQLite — 供应商、MCP、提示词、技能）
- **本地设置**：`<default-local-config-dir>/settings.json`（设备级 UI 偏好设置，始终保存在本机）
- **备份**：`<app-config-dir>/backups/`（自动轮换，保留最近 10 个）
- **SKILLS**：`<app-config-dir>/skills/`（默认通过软链接连接到对应应用）
- **说明**：`<app-config-dir>` 表示当前生效的 CodeBox 数据目录，可在设置中覆盖到云同步目录。

</details>

## 文档

- [用户手册](docs/user-manual/zh/README.md)
- [架构标准](ARCHITECT.md)
- [发布指南](docs/releasing.md)
- [更新日志](CHANGELOG.md)

## 快速开始

1. 从 [GitHub Releases](https://github.com/Sdkwork-Cloud/sdkwork-codebox/releases/latest) 下载对应平台安装包。
2. 打开应用后，在左侧产品列表中选择要管理的 CLI 产品。
3. 在 `Providers` 视图中新增或导入供应商；如需跨产品导入，可使用 `codebox://` Deep Link。
4. 在 `Runtime` 中配置 Proxy、Takeover、Failover、Usage、Diagnostics。
5. 如果使用 OpenClaw，可在 `Workspace` 中直接管理 `AGENTS.md`、`SOUL.md`、`TOOLS.md` 等文件。
6. 在 `Settings` 中调整外观、数据同步、目录覆盖和高级偏好。

## 下载安装

### 系统要求

- Windows 10 及以上
- macOS 10.15 及以上
- Ubuntu 22.04+ / Debian 11+ / Fedora 34+ 等主流 Linux 发行版

### 下载渠道

- Windows：`MSI` 安装包与便携版 `ZIP`
- macOS：`ZIP` 安装包
- Linux：`AppImage`、`.deb`、`.rpm`

统一下载地址：

```text
https://github.com/Sdkwork-Cloud/sdkwork-codebox/releases/latest
```

> macOS 首次打开如果出现“未知开发者”提示，请前往“系统设置 → 隐私与安全性”选择“仍要打开”。

## 架构与开发

### 架构原则

- 根层 `src/` 只负责应用壳层、启动和组合，不承载可复用业务逻辑。
- 共享能力通过 `packages/sdkwork-codebox-*` 按模块拆分。
- 依赖方向遵循 `types -> i18n / commons -> core -> business packages -> app shell`。
- 原生边界集中在 `src-tauri/`，统一处理文件系统、目录解析、备份、Deep Link、更新等能力。

### 当前工作区结构

```text
├── src/                               # 应用壳层、导航、顶层组合
├── src-tauri/                         # Rust 原生宿主与系统能力
├── packages/sdkwork-codebox-types     # 共享类型
├── packages/sdkwork-codebox-i18n      # 国际化资源
├── packages/sdkwork-codebox-commons   # 通用 UI / hooks / utils
├── packages/sdkwork-codebox-core      # API、查询、平台服务
├── packages/sdkwork-codebox-provider  # 供应商管理
├── packages/sdkwork-codebox-settings  # 设置中心
├── packages/sdkwork-codebox-proxy     # Proxy / Failover / Takeover
├── packages/sdkwork-codebox-usage     # 用量与日志
├── packages/sdkwork-codebox-workspace # Workspace / Sessions
├── packages/sdkwork-codebox-integration # MCP / Prompts / Skills / Deep Link
├── tests/                             # 单元与集成测试
└── assets/                            # 截图与合作资源
```

### 开发环境

- Node.js 20+
- `pnpm`
- Rust toolchain
- Tauri 2 构建依赖

### 常用命令

```bash
pnpm install
pnpm dev
pnpm dev:renderer
pnpm typecheck
pnpm typecheck:packages
pnpm test:unit
pnpm build:packages
pnpm build
```

### 技术栈

- 前端：React 18、TypeScript、Vite、TailwindCSS、TanStack Query、react-hook-form、zod、framer-motion
- 桌面宿主：Tauri 2、Rust
- 测试：Vitest、Testing Library、MSW

## 贡献

欢迎提交 Issue 反馈问题和建议！

提交 PR 前请确保：

- 通过类型检查：`pnpm typecheck`
- 通过格式检查：`pnpm format:check`
- 通过单元测试：`pnpm test:unit`

新功能开发前，欢迎先开 Issue 讨论实现方案，不适合项目的功能性 PR 有可能会被关闭。

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=Sdkwork-Cloud/sdkwork-codebox&type=Date)](https://www.star-history.com/#Sdkwork-Cloud/sdkwork-codebox&Date)

## License

MIT © Jason Young
