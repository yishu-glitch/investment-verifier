# 证研 · 投资命题验证工作台

把投资命题拆成可验证子问题，调用真实财务与披露材料，组织支持 / 反对 / 无法验证证据，形成可追溯结论，并说明哪些新信息会改变判断。

## 目标用户

初级投研人员：需要把「盈利改善来自主营」「现金流与利润匹配」等判断，变成可核查的研究记录，而不是一次性聊天结论。

## 产品设计

- 主界面是研究工作台；对话在右侧辅助面板，不喧宾夺主。
- 顶部选择标的与比较年度；左侧保留任务与结论版本；主区域展示命题、执行过程、结论、证据、指标与改判条件。
- 修订命题或期间会生成新版本，旧证据与结论保留为只读快照。
- 渐进披露真实执行步骤；不展示模型内部思维链。

## AI 角色

单主 Agent 负责：澄清命题 → 拆解子问题 → 选择工具 → 收集证据 → 生成结论 → 引用校验。

确定性代码负责：单位与期间校验、指标计算、工具预算、版本隔离与持久化。结论必须引用已有证据 ID，禁止虚构来源。

## 数据来源

| 来源 | 用途 |
| --- | --- |
| 扶摇 REST | A 股财务报表与指标 |
| iFinD MCP | 公告检索、片段与原文定位 |
| OpenAI Responses | 命题拆解、工具编排、结论与追问 |

浏览器只访问同源 `/api/*`，密钥留在服务端（`.dev.vars` / 托管 Secrets）。

## 本地启动

需要 Node.js `>=22.13`。

```bash
npm install          # 或 npm run install:ci
# 配置 .dev.vars：OPENAI_API_KEY、OPENAI_MODEL、FUYAO_API_KEY、IFIND_AUTH_TOKEN
npm run dev          # http://127.0.0.1:5173
```

主链路：创建研究 → SSE 执行验证 → 查看证据/结论 → 侧边追问 → 修订后生成新版本。  
演示可点「载入贵州茅台真实研究案例」（`POST /api/example`），写入已真实联调的存档。

若本地 D1 表未建立，先 `npm run build`，再执行：

```bash
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_early_luminals.sql
```

## 边界与合规

- 首版聚焦 A 股**年度盈利质量**类命题；超出范围会提示改写。
- 缺失值不补零；累计与单季、净利润与归母净利润分开。
- 工具调用有预算；耗尽后保留已有证据，不假装验证完成。
- 不输出买卖建议或收益承诺；结果需结合原始材料核查。
- 接口说明链接不等于年报原文；无原文定位时明确标注。

## 尚未完成 / 已知限制

- 正式托管 Web URL 与评委访问验收（进行中）
- 演示视频、AI 使用与验证记录、完整测试说明的提交包整理
- 更广命题类型（估值、产业链外溢等）未纳入首版
- 托管环境对 iFinD 端口/协议的兼容性需以实际部署结果为准

## 技术栈

TypeScript、React / Vinext、Cloudflare D1、OpenAI Responses API、扶摇、iFinD。
