# Unfollower - Twitter/X 批量取关工具

Twitter/X 批量取关 Skill，支持筛选非蓝勾用户、活跃度检查、智能延迟等功能。

## 功能特性

- ✅ **批量取关** - 自动处理大量关注者
- ✅ **蓝勾筛选** - 自动跳过认证用户
- ✅ **活跃度检查** - 支持按天数筛选不活跃用户
- ✅ **智能延迟** - 随机延迟避免封号
- ✅ **进度显示** - 实时显示处理进度
- ✅ **安全可靠** - 浏览器控制台运行，无需 API
- ✅ **油猴脚本** - 支持 Tampermonkey，无需手动粘贴代码

## 安装

### 方法1：通过 OpenClaw 安装

```bash
npx skills add ynbtc/unfollower
```

### 方法2：手动安装

1. 克隆仓库
```bash
git clone https://github.com/ynbtc/Unfollower.git
cd Unfollower
```

2. 复制脚本到浏览器使用

## 使用方法

### ⭐ 推荐：Tampermonkey 油猴脚本（无需手动粘贴代码）

#### 步骤一：安装 Tampermonkey 扩展

- **Chrome**: [Chrome Web Store - Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
- **Firefox**: [Firefox Add-ons - Tampermonkey](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
- **Edge**: [Edge Add-ons - Tampermonkey](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)

#### 步骤二：安装油猴脚本

点击下方链接，Tampermonkey 将自动弹出安装界面，点击「安装」即可：

> **[📦 点击安装油猴脚本](https://raw.githubusercontent.com/ynbtc/Unfollower/main/scripts/unfollower.user.js)**

或者手动安装：
1. 打开 Tampermonkey 扩展 → 管理面板 → 新建脚本
2. 将 `scripts/unfollower.user.js` 的内容复制粘贴进去，保存

#### 步骤三：使用

1. 打开 `https://twitter.com/你的用户名/following` 或 `https://x.com/你的用户名/following`
2. 页面右下角会出现浮动控制面板
3. 在面板中调整配置（最大取关数、不活跃天数等）
4. 点击「▶ 开始取关」按钮
5. 实时查看统计数据和操作日志
6. 随时点击「⏹ 停止」按钮暂停

> 也可通过浏览器右上角的 Tampermonkey 图标 → 点击「开始批量取关」菜单命令启动。

---

### 备选：浏览器控制台运行

1. 打开 Twitter/X，进入 `https://twitter.com/following`
2. 按 `F12` 打开开发者工具
3. 切换到 `Console` 标签
4. 复制 `scripts/unfollower.js` 的内容
5. 粘贴到 Console 并按回车

### 配置参数

```javascript
const CONFIG = {
    maxUnfollow: 800,      // 最大取关数量
    inactiveDays: 60,      // 多少天未发推算不活跃
    delayMin: 2000,        // 最小延迟（毫秒）
    delayMax: 4000,        // 最大延迟（毫秒）
    scrollDelay: 1500,     // 滚动延迟
    skipBlueCheck: true    // 是否跳过蓝勾用户
};
```

## 运行示例

```
🐦 Twitter 批量取关工具启动
================================
🎯 开始处理，目标：最多取关 800 个用户
📝 条件：非蓝勾 + 60天未发推

[1/100] @user1... ⏭️ 跳过蓝勾用户
[2/100] @user2... ⏭️ 跳过活跃用户 (2天前发推)
[3/100] @user3... ✅ 已取关 #1: @user3 (65天未发推)
[4/100] @user4... ✅ 已取关 #2: @user4 (从未发推)

📈 进度：已处理 20 人 | 取关: 3 | 跳过蓝勾: 8 | 跳过活跃: 9 | 失败: 0

================================
✅ 批量取关完成！
================================
📊 统计：
   取关成功: 25 人
   跳过蓝勾: 45 人
   跳过活跃: 30 人
   失败: 0 次
   总计处理: 100 人
================================
```

## 注意事项

⚠️ **风险提示**
- 批量操作可能触发 Twitter/X 的风控机制
- 建议控制取关速度，每次间隔 2-4 秒
- 每天取关数量建议不超过 100 人
- 使用本脚本产生的任何后果由用户自行承担

## ⏸️ 如何暂停/停止

### 方法1：刷新页面（推荐）
```
按 F5 或 Ctrl+R
```
- ✅ 立即停止脚本
- ✅ 已取关的不会恢复
- ✅ 最简单有效

### 方法2：关闭标签页
```
点击浏览器标签页的 X
```
- ✅ 彻底结束脚本
- ✅ 立即停止所有操作

### 方法3：切换页面
```
点击浏览器地址栏，访问其他网站
```
- ✅ 脚本会在后台暂停
- ⚠️ 返回页面后可能继续运行

### ⚠️ 注意
- 不要直接关闭浏览器（可能继续运行）
- 不要最小化窗口（脚本继续运行）
- 建议用 **刷新页面** 方式暂停

## 技术原理

- 使用浏览器原生 JavaScript
- 通过 DOM 操作模拟用户点击
- 基于 Twitter/X 网页版界面
- 无需 API Key，完全免费

## 文件结构

```
Unfollower/
├── README.md                  # 项目说明
├── package.json               # 包信息
├── SKILL.md                   # OpenClaw Skill 文档
├── LICENSE                    # 许可证
├── scripts/
│   ├── unfollower.js          # 控制台版脚本
│   └── unfollower.user.js     # Tampermonkey 油猴脚本
└── docs/
    └── USAGE.md               # 详细使用文档
```

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 作者

- **ynbtc** - [GitHub](https://github.com/ynbtc)

## 致谢

感谢 OpenClaw 社区提供的 Skill 开发框架
