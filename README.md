# 谁是卧底出题器 · Who Is Undercover

带社交系统的派对游戏平台：主持人 + 裁判 + 记分员 + 气氛组，全流程派对主持系统。

## 技术栈

- 前端：React 18 + Vite + TypeScript + Tailwind CSS + React Router
- 后端：Supabase（Auth + Postgres + Realtime + Storage + RPC 函数）
- 部署：Cloudflare Workers（静态资源）+ Wrangler

## 部署到 Cloudflare Workers

项目已内置 `wrangler.jsonc`（静态资源直传 + SPA 回退，`dist` 为输出目录），两种方式任选：

**方式一：命令行一键部署（推荐）**

```bash
npm install
npx wrangler login      # 首次需登录授权
npm run deploy          # = npm run build && npx wrangler deploy
```

部署成功后 Wrangler 会输出 `https://who-is-undercover.<你的子域>.workers.dev`。

**方式二：控制台手动上传**

1. 先本地构建：`npm install && npm run build`，得到 `dist/` 目录
2. Cloudflare 控制台 → Workers & Pages → 创建 Worker → 上传静态资源，把 `dist/` 整个目录上传
3. 绑定自定义域名后，记得把该域名加入 Supabase 的 Redirect URLs（见下方 Microsoft 配置）

> 路由为 BrowserRouter，SPA 深链（如 `/settings`）依赖 `wrangler.jsonc` 的
> `not_found_handling: single-page-application` 回退到 `index.html`；`public/_redirects`
> 也已内置，若改用 Cloudflare Pages 同样可直接使用。

## 快速开始

```bash
npm install
npm run dev
```

Supabase 凭据已内置在 `src/lib/supabase.ts`（也可用 `.env.local` 覆盖）：

```
VITE_SUPABASE_URL=https://tihxvnelkhttjtlolgaf.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

## 数据库初始化

1. 打开 Supabase 控制台 → SQL Editor
2. 整段执行 [`supabase/schema.sql`](supabase/schema.sql)
   - 14+1 张表（含 votes 投票表）+ 全部 RLS 策略
   - 19 个 RPC 函数（交友 / 房间 / 游戏 / 词库 / 通知）
   - 新用户资料触发器、成就与系统词库种子数据、avatars 存储桶
3. Authentication → URL Configuration：Site URL 填部署域名，Redirect URLs 加上部署域名 + `/reset-password`
4. 如需邮箱验证登录：Authentication → Providers → Email 开启 Confirm email
5. 若修改过 `handle_new_user()`（用于导入 Microsoft 昵称/头像），重新执行该函数段即可，无需重建整库

## Microsoft 登录配置

前端已内置「使用 Microsoft 登录」按钮（登录页 / 注册页），走 Supabase 的 Azure Provider（OAuth 2.0 + PKCE）。

### 1. Azure 门户（应用注册）

在「身份验证 → 平台配置 → 添加平台 → Web」中，**重定向 URI** 填：

```
https://tihxvnelkhttjtlolgaf.supabase.co/auth/v1/callback
```

- 该地址是 **Supabase** 的回调地址，不是本站地址；本站地址在后面 Supabase 的 Redirect URLs 里配置。
- 客户端凭据：新建客户端密码后**立即复制**（只显示一次）。
- 支持账户类型：`所有 Microsoft 帐户用户` 对应多租户，下方租户用 `common` 即可覆盖个人 + 工作/学校账户。

### 2. Supabase 控制台

Authentication → Providers → **Azure**：

| 字段 | 取值 |
| --- | --- |
| Enable | 打开 |
| Application (client) ID | `af6a2cd5-9a4c-4b09-83de-4f737c86dba2` |
| Secret Value | Azure 里新建的客户端密码 |
| Azure Tenant URL | `https://login.microsoftonline.com/common` |

Authentication → URL Configuration → **Redirect URLs** 追加：

```
http://localhost:5173/auth/callback
https://<你的部署域名>/auth/callback
```

> ⚠️ 千万不要把客户端密码写进 `.env.local` 或任何前端代码——它只应填在 Supabase 后台。
> 由于该密码已在聊天中明文出现，请在 Azure「证书和密码」中**删除并重建**一个新的密码后再填入 Supabase。

### 3. 首登行为

- 首次用 Microsoft 登录时，触发器会用 Microsoft 返回的姓名（`full_name` / `name`）作为昵称，并导入头像（`picture`）。
- 若头像缺失，可在「个人中心 → 编辑资料」里上传图片或一键选择预设派对头像。

## 头像支持

- 资料编辑弹窗内置头像选择器：**上传图片**（JPG/PNG/GIF，≤2MB，客户端即时校验并预览）、**预设派对头像**（12 款内置 emoji 渐变头像）、**恢复默认**（昵称首字母渐变头像）。
- 上传走 Supabase Storage `avatars` 桶（公开读、仅本人可写改删），保存在 `profiles.avatar_url`。
- 头像在首页、房间大厅、游戏中、结算页、排行榜、好友、词库作者等位置统一展示。

## 页面结构

| 路由 | 页面 | 核心 UI 组件 |
| --- | --- | --- |
| `/` | 首屏 Landing | 铅笔动画、涂鸦按钮、昼夜开关、Emoji 栏 |
| `/login` `/register` `/forgot-password` `/reset-password` `/auth/callback` | 认证五件套（含 Microsoft OAuth 回调） | 浮动/逐字/新粗野输入、飞机起飞、光斑/矩阵加载 |
| `/home` | 主页 | 卡片组、Emoji 栏、矩阵加载、奢华卡 |
| `/friends` `/friends/search` `/friends/requests` | 好友系统 | 卡片组、WiFi 加载、玻璃/描边复选框、Material 开关 |
| `/rooms` `/rooms/create` `/rooms/join` `/rooms/:code` | 房间系统 | 3D 文件夹卡、时钟选择器、Emoji 栏、飞机起飞（准备） |
| `/rooms/:code/game` | 游戏进行 | 3D 盒子加载（发牌）、时钟计时、描边复选框（投票）、Dash Spin |
| `/rooms/:code/result` | 结算复盘 | 奢华卡、3D 文件夹卡（逐轮投票）、卡片组、Emoji 栏 |
| `/word-packs` `/word-packs/:id` `/word-packs/create` | 词库 | 新粗野搜索、逐字命名、矩阵加载、飞机起飞（同步） |
| <br />                                     | <br />| <br />                 |

23 个 UI 组件源码全部保留于 `src/components/ui/`（每个 `.tsx` 对应同名 `.css`），
多实例冲突的选择器已按作用域隔离（`.takeoff-scope`、`.doodle-scope`、`.matrix-scope` 等），视觉与原版一致。

## 游戏流程

1. 房主创建房间（6 位房号、密码房、角色配置、人数/限时时钟选择）
2. 成员进房准备（飞机起飞按钮：起飞=准备，已发送=已准备）
3. 房主开始游戏 → `start_game()` 自动分配角色与词（平民/卧底/白板/侦探/双面人…）
4. 发牌动画 → 按住查看自己的词 → 按顺序发言（时钟倒计时）→ 投票（每人一票）→
   `settle_round()` 淘汰最高票（平票加时）→ 自动判定胜负
5. `finish_game()` 写入战绩、更新等级经验、解锁成就，结算页可复盘每一轮投票
