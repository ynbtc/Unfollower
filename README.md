# Unfollower - Twitter/X 批量取关工具

Twitter/X 批量取关 Skill，支持筛选非蓝勾用户、活跃度检查、智能延迟等功能。

## 功能特性

- ✅ **批量取关** - 自动处理大量关注者
- ✅ **蓝勾筛选** - 自动跳过认证用户
- ✅ **活跃度检查** - 支持按天数筛选不活跃用户
- ✅ **智能延迟** - 随机延迟避免封号
- ✅ **进度显示** - 实时显示处理进度
- ✅ **安全可靠** - 浏览器控制台运行，无需 API

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

### 浏览器控制台运行

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

## 技术原理

- 使用浏览器原生 JavaScript
- 通过 DOM 操作模拟用户点击
- 基于 Twitter/X 网页版界面
- 无需 API Key，完全免费

## 文件结构

```
Unfollower/
├── README.md           # 项目说明
├── package.json        # 包信息
├── SKILL.md            # OpenClaw Skill 文档
├── LICENSE             # 许可证
├── scripts/
│   └── unfollower.js   # 主脚本
└── docs/
    └── USAGE.md        # 详细使用文档
```

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 作者

- **ynbtc** - [GitHub](https://github.com/ynbtc)

## 致谢

感谢 OpenClaw 社区提供的 Skill 开发框架
