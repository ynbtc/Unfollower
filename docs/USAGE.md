# 详细使用指南

## 浏览器控制台运行步骤

### 1. 准备工作
- 确保已登录 Twitter/X 账号
- 使用 Chrome/Firefox/Edge 浏览器

### 2. 进入关注列表
- 访问 https://twitter.com/following
- 等待页面完全加载

### 3. 打开开发者工具
```
Windows/Linux: F12 或 Ctrl+Shift+J
Mac: Cmd+Option+J
```

### 4. 切换到 Console 标签
- 点击顶部的 "Console" 标签
- 清除现有内容（按 Ctrl+L）

### 5. 粘贴并运行
- 复制 `scripts/unfollower.js` 的全部内容
- 粘贴到 Console
- 按回车键

### 6. 观察执行
脚本会自动：
1. 滚动加载关注列表
2. 检查每个用户的蓝勾状态
3. 检查最后发推时间
4. 自动取关符合条件的用户
5. 显示实时进度

## 配置修改

编辑脚本开头的 CONFIG 对象：

```javascript
const CONFIG = {
    maxUnfollow: 800,      // 修改最大取关数
    inactiveDays: 60,      // 修改不活跃天数
    delayMin: 2000,        // 修改最小延迟
    delayMax: 4000,        // 修改最大延迟
};
```

## 常见问题

**Q: 脚本停止运行？**
A: 可能是触发了 Twitter 限流，等待几分钟后刷新页面重试

**Q: 取关失败？**
A: 检查网络连接，或该用户已被取关

**Q: 如何中途停止？**
A: 关闭浏览器标签页或按 Ctrl+C

## 安全建议

1. 首次使用先测试小批量（10-20人）
2. 观察几天账号状态再大批量使用
3. 不要在重要账号上直接使用
4. 建议每天取关不超过 100 人
