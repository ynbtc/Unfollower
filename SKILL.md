---
name: unfollower
description: "Twitter/X 批量取关工具 - 支持非蓝勾用户筛选、活跃度检查、智能延迟。Use when user mentions: twitter unfollow, bulk unfollow, remove followers, clean following list, 取关, 批量取消关注. 关键词：twitter取关, 批量取关, 清理关注, unfollow, 取消关注, 蓝勾筛选."
version: "1.0.0"
author: "ynbtc"
license: "MIT"
homepage: "https://github.com/ynbtc/Unfollower"
repository: "https://github.com/ynbtc/Unfollower"
keywords:
  - twitter
  - unfollow
  - automation
  - social-media
  - 取关
  - 批量取消关注
---

# Unfollower Skill

Twitter/X 批量取关工具，用于自动化清理关注列表。

## 适用场景

- 批量取关非活跃用户
- 清理不感兴趣的账号
- 筛选取关非认证用户
- 按活跃度批量管理关注

## 核心功能

| 功能 | 说明 |
|------|------|
| 批量取关 | 自动处理大量关注者 |
| 蓝勾筛选 | 自动跳过认证用户 |
| 活跃度检查 | 支持按天数筛选不活跃用户 |
| 智能延迟 | 随机延迟避免封号 |
| 进度显示 | 实时显示处理进度 |

## 使用方法

### 方式1：浏览器控制台（推荐）

```javascript
// 1. 打开 https://twitter.com/following
// 2. 按 F12 打开 Console
// 3. 粘贴 scripts/unfollower.js 内容
// 4. 按回车运行
```

### 方式2：OpenClaw Agent 调用

```yaml
# 在 OpenClaw 中调用
skill: unfollower
action: bulk_unfollow
parameters:
  max_unfollow: 100
  inactive_days: 60
  skip_blue_check: true
```

## 配置参数

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

## 安全提示

⚠️ **使用限制**
- 批量操作可能触发 Twitter/X 风控
- 建议控制取关速度（已内置随机延迟）
- 每天取关数量建议不超过 100 人
- 使用本脚本产生的后果由用户自行承担

## 暂停与停止

### 如何暂停脚本

| 方法 | 操作 | 效果 |
|------|------|------|
| **刷新页面** | 按 `F5` | ⭐ 立即停止，推荐 |
| **关闭标签页** | 点击 `X` | ✅ 彻底结束 |
| **切换页面** | 访问其他网站 | ⚠️ 后台暂停 |

### 重要提示
- ✅ 刷新页面后，已取关的用户不会恢复
- ✅ 可以随时重新开始运行脚本
- ⚠️ 不要直接关闭浏览器（脚本可能继续运行）

## 技术细节

- **运行环境**: 浏览器 Console
- **依赖**: 无（纯 JavaScript）
- **权限**: 无需 API Key
- **兼容性**: Chrome, Firefox, Edge, Safari

## 文件说明

| 文件 | 用途 |
|------|------|
| `scripts/unfollower.js` | 主脚本文件 |
| `README.md` | 项目文档 |
| `SKILL.md` | OpenClaw Skill 定义 |

## 更新日志

### v1.0.0 (2026-03-29)
- ✨ 初始版本发布
- ✅ 支持批量取关
- ✅ 支持蓝勾筛选
- ✅ 支持活跃度检查
- ✅ 智能延迟机制

## 支持与反馈

- GitHub Issues: https://github.com/ynbtc/Unfollower/issues
- 作者: @ynbtc

---

**注意**: 本 Skill 仅供学习研究使用，请遵守 Twitter/X 平台规则。
