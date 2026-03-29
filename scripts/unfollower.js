// X (Twitter) 批量取关非蓝勾且60天未发推用户脚本
// 只取关没有认证标记且60天未发推的用户

(async function() {
    'use strict';
    
    console.log('=== X 批量取关脚本启动 ===');
    console.log('⚠️ 请确保您在 "正在关注" 页面');
    console.log('ℹ️ 本脚本只会取关：非蓝勾 + 60天未发推 的用户\n');

    // 配置参数
    const CONFIG = {
        maxUnfollow: 800,           // 最大取关数量
        inactiveDays: 60,           // 多少天未发推算不活跃
        delayMin: 2000,             // 最小延迟时间（毫秒）
        delayMax: 4000,             // 最大延迟时间（毫秒）
        scrollDelay: 1500,          // 滚动延迟时间
        checkInterval: 100          // 检查间隔
    };

    let stats = {
        unfollowed: 0,              // 已取关
        skippedBlue: 0,             // 跳过蓝勾
        skippedActive: 0,           // 跳过活跃用户
        failed: 0,                  // 失败
        total: 0                    // 总计处理
    };

    // 随机延迟函数
    function randomDelay(min, max) {
        const delay = Math.floor(Math.random() * (max - min + 1)) + min;
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    // 滚动到页面底部加载更多
    async function scrollToLoadMore() {
        window.scrollTo(0, document.body.scrollHeight);
        await randomDelay(CONFIG.scrollDelay, CONFIG.scrollDelay + 500);
    }

    // 检查用户是否有蓝勾认证
    function hasVerifiedBadge(userCell) {
        // 查找认证图标（多种选择器兼容）
        const verifiedIcon = userCell.querySelector('[data-testid="icon-verified"]') || 
                             userCell.querySelector('svg[aria-label*="Verified"]') || 
                             userCell.querySelector('[aria-label*="已认证"]') ||
                             userCell.querySelector('svg[aria-label*="认证"]');
        return verifiedIcon !== null;
    }

    // 获取用户名
    function getUsername(userCell) {
        const usernameElement = userCell.querySelector('a[href^="/"]') || 
                               userCell.querySelector('[dir="ltr"]');
        if (usernameElement) {
            const text = usernameElement.textContent || '';
            return text.replace('@', '').trim();
        }
        return '未知用户';
    }

    // 获取用户最后发推时间（通过访问用户主页）
    async function getLastTweetDate(username) {
        try {
            // 创建临时 iframe 或打开新标签获取（简化版：通过 API 或页面元素）
            // 实际实现：这里需要通过 fetch 或其他方式获取
            // 简化方案：检查用户卡片中是否有最近推文时间
            
            // 注意：由于跨域限制，这里使用模拟方式
            // 真实实现需要更复杂的逻辑
            
            return null; // 暂时返回 null，表示无法获取
        } catch (error) {
            return null;
        }
    }

    // 检查用户是否60天未发推（基于页面信息）
    async function isInactive(userCell, username) {
        try {
            // 方法1：查找推文时间元素
            const timeElement = userCell.querySelector('time');
            if (timeElement) {
                const dateStr = timeElement.getAttribute('datetime');
                if (dateStr) {
                    const tweetDate = new Date(dateStr);
                    const now = new Date();
                    const daysDiff = Math.floor((now - tweetDate) / (1000 * 60 * 60 * 24));
                    
                    if (daysDiff > CONFIG.inactiveDays) {
                        return { inactive: true, days: daysDiff };
                    } else {
                        return { inactive: false, days: daysDiff };
                    }
                }
            }
            
            // 方法2：如果没有时间元素，假设是活跃用户（保守策略）
            // 或者可以标记为需要进一步检查
            return { inactive: false, days: null, unknown: true };
            
        } catch (error) {
            console.log(`⚠️ 无法检查 @${username} 的活跃状态`);
            return { inactive: false, days: null, error: true };
        }
    }

    // 执行取关操作
    async function unfollowUser(button, username, days) {
        try {
            button.click();
            await randomDelay(500, 800);

            // 查找确认按钮
            const confirmButton = document.querySelector('[data-testid="confirmationSheetConfirm"]') ||
                                  document.querySelector('[data-testid="unfollowConfirm"]');
            
            if (confirmButton) {
                confirmButton.click();
                stats.unfollowed++;
                const daysText = days ? `(${days}天未发推)` : '';
                console.log(`✅ 已取关 #${stats.unfollowed}: @${username} ${daysText}`);
                return true;
            } else {
                stats.failed++;
                console.log(`❌ 取关失败 @${username}: 未找到确认按钮`);
                return false;
            }
        } catch (error) {
            console.error(`❌ 取关失败 @${username}:`, error);
            stats.failed++;
            return false;
        }
    }

    // 查找所有用户卡片
    function findUserCells() {
        return Array.from(document.querySelectorAll('[data-testid="UserCell"]'));
    }

    // 显示进度
    function showProgress() {
        if (stats.total % 5 === 0) {
            console.log(`\n📈 进度：已处理 ${stats.total} 人 | 取关: ${stats.unfollowed} | 跳过蓝勾: ${stats.skippedBlue} | 跳过活跃: ${stats.skippedActive} | 失败: ${stats.failed}`);
        }
    }

    // 主执行流程
    async function startUnfollowing() {
        console.log(`🎯 开始处理，目标：最多取关 ${CONFIG.maxUnfollow} 个用户`);
        console.log(`📝 条件：非蓝勾 + ${CONFIG.inactiveDays}天未发推\n`);

        let consecutiveNoAction = 0;
        const maxConsecutiveNoAction = 5;

        while (stats.unfollowed < CONFIG.maxUnfollow && consecutiveNoAction < maxConsecutiveNoAction) {
            // 获取所有用户卡片
            const userCells = findUserCells();

            if (userCells.length === 0) {
                console.log('⚠️ 未找到用户卡片，滚动加载...');
                await scrollToLoadMore();
                consecutiveNoAction++;
                continue;
            }

            let actionTaken = false;

            for (let cell of userCells) {
                if (stats.unfollowed >= CONFIG.maxUnfollow) break;
                
                // 跳过已处理的
                if (cell.dataset.processed) continue;
                cell.dataset.processed = 'true';
                
                stats.total++;
                const username = getUsername(cell);

                // 1. 检查是否有蓝勾
                if (hasVerifiedBadge(cell)) {
                    stats.skippedBlue++;
                    console.log(`⏭️ 跳过蓝勾用户: @${username}`);
                    showProgress();
                    continue;
                }

                // 2. 检查是否60天未发推
                const inactiveCheck = await isInactive(cell, username);
                
                if (!inactiveCheck.inactive && !inactiveCheck.unknown) {
                    stats.skippedActive++;
                    console.log(`⏭️ 跳过活跃用户: @${username} (${inactiveCheck.days}天前发推)`);
                    showProgress();
                    continue;
                }

                // 如果无法确定活跃状态，可以选择跳过或继续
                if (inactiveCheck.unknown || inactiveCheck.error) {
                    console.log(`⚠️ 无法确定 @${username} 的活跃状态，跳过`);
                    showProgress();
                    continue;
                }

                // 3. 查找取关按钮
                const unfollowButton = cell.querySelector('[data-testid$="-unfollow"]') ||
                                      cell.querySelector('[data-testid="unfollow"]') ||
                                      cell.querySelector('div[role="button"][aria-label*="Following"]');

                if (unfollowButton) {
                    await unfollowUser(unfollowButton, username, inactiveCheck.days);
                    actionTaken = true;
                    showProgress();

                    // 随机延迟
                    await randomDelay(CONFIG.delayMin, CONFIG.delayMax);
                } else {
                    console.log(`⚠️ 未找到取关按钮: @${username}`);
                }
            }

            if (!actionTaken) {
                consecutiveNoAction++;
                console.log('📜 滚动加载更多用户...');
                await scrollToLoadMore();
            } else {
                consecutiveNoAction = 0;
            }
        }

        // 完成总结
        console.log('\n================================');
        console.log('✅ 批量取关完成！');
        console.log('================================');
        console.log(`📊 统计：`);
        console.log(`   取关成功: ${stats.unfollowed} 人`);
        console.log(`   跳过蓝勾: ${stats.skippedBlue} 人`);
        console.log(`   跳过活跃: ${stats.skippedActive} 人`);
        console.log(`   失败: ${stats.failed} 次`);
        console.log(`   总计处理: ${stats.total} 人`);
        console.log('================================');
    }

    // 启动脚本
    await startUnfollowing();
})();
