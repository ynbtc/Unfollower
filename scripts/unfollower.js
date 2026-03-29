// X (Twitter) 批量取关脚本 - 调试修复版
// 修复了页面加载和选择器问题

(async function() {
    'use strict';
    
    console.log('=== X 批量取关脚本启动（调试版）===');
    console.log('⚠️ 请确保您在 https://twitter.com/following');
    console.log('');

    // 配置参数
    const CONFIG = {
        maxUnfollow: 100,           // 最大取关数量（先调低测试）
        inactiveDays: 60,           // 多少天未发推算不活跃
        delayMin: 3000,             // 最小延迟（增加到3秒）
        delayMax: 5000,             // 最大延迟（增加到5秒）
        scrollDelay: 2000,          // 滚动延迟（增加到2秒）
        maxScrolls: 10              // 最大滚动次数
    };

    let stats = {
        unfollowed: 0,
        skippedBlue: 0,
        skippedActive: 0,
        failed: 0,
        total: 0,
        noButton: 0
    };

    // 随机延迟
    function randomDelay(min, max) {
        const delay = Math.floor(Math.random() * (max - min + 1)) + min;
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    // 滚动加载更多（修复版）
    async function scrollToLoadMore() {
        console.log('📜 滚动加载更多用户...');
        
        // 记录当前用户数量
        const beforeCount = document.querySelectorAll('[data-testid="UserCell"]').length;
        
        // 多种滚动方式
        window.scrollTo(0, document.body.scrollHeight);
        await randomDelay(CONFIG.scrollDelay, CONFIG.scrollDelay + 1000);
        
        // 再次滚动确保加载
        window.scrollBy(0, 500);
        await randomDelay(1000, 1500);
        
        const afterCount = document.querySelectorAll('[data-testid="UserCell"]').length;
        console.log(`   滚动前: ${beforeCount} 人, 滚动后: ${afterCount} 人`);
        
        return afterCount > beforeCount;
    }

    // 检查蓝勾（多种方式）
    function hasVerifiedBadge(userCell) {
        // 方式1: data-testid
        if (userCell.querySelector('[data-testid="icon-verified"]')) return true;
        
        // 方式2: aria-label 包含 Verified
        const verifiedSvg = userCell.querySelector('svg[aria-label*="Verified"]');
        if (verifiedSvg) return true;
        
        // 方式3: 检查蓝色勾选图标的路径
        const svgs = userCell.querySelectorAll('svg');
        for (let svg of svgs) {
            const path = svg.querySelector('path');
            if (path && path.getAttribute('d') && path.getAttribute('d').includes('M22.25')) {
                return true;
            }
        }
        
        return false;
    }

    // 获取用户名（修复版）
    function getUsername(userCell) {
        // 方式1: 从链接获取
        const link = userCell.querySelector('a[href^="/"]');
        if (link) {
            const href = link.getAttribute('href');
            const match = href.match(/\/([^\/]+)/);
            if (match) return match[1];
        }
        
        // 方式2: 从文本获取
        const textElement = userCell.querySelector('[dir="ltr"]');
        if (textElement) {
            const text = textElement.textContent.trim();
            if (text.startsWith('@')) return text.substring(1);
            return text;
        }
        
        return 'unknown';
    }

    // 检查活跃度（修复版）
    async function checkActivity(userCell, username) {
        try {
            // 查找时间元素
            const timeElement = userCell.querySelector('time');
            if (timeElement) {
                const datetime = timeElement.getAttribute('datetime');
                if (datetime) {
                    const tweetDate = new Date(datetime);
                    const now = new Date();
                    const daysDiff = Math.floor((now - tweetDate) / (1000 * 60 * 60 * 24));
                    
                    return {
                        hasTweet: true,
                        days: daysDiff,
                        inactive: daysDiff > CONFIG.inactiveDays
                    };
                }
            }
            
            // 没有时间元素 = 从未发推或无法获取
            return {
                hasTweet: false,
                days: null,
                inactive: true  // 保守策略：视为不活跃
            };
            
        } catch (e) {
            console.log(`⚠️ 检查 @${username} 失败: ${e.message}`);
            return { hasTweet: false, days: null, inactive: false, error: true };
        }
    }

    // 查找取关按钮（修复版 - 多种选择器）
    function findUnfollowButton(userCell) {
        // 方式1: data-testid
        let btn = userCell.querySelector('[data-testid="unfollow"]');
        if (btn) return btn;
        
        // 方式2: 包含 "Following" 文本的按钮
        const buttons = userCell.querySelectorAll('div[role="button"]');
        for (let button of buttons) {
            const text = button.textContent || '';
            if (text.includes('Following') || text.includes('正在关注')) {
                return button;
            }
        }
        
        // 方式3: 检查 aria-label
        const allButtons = userCell.querySelectorAll('[role="button"]');
        for (let btn of allButtons) {
            const label = btn.getAttribute('aria-label') || '';
            if (label.includes('Following') || label.includes('Unfollow')) {
                return btn;
            }
        }
        
        return null;
    }

    // 执行取关（修复版）
    async function unfollowUser(button, username, days) {
        try {
            // 点击取关按钮
            button.click();
            await randomDelay(800, 1200);
            
            // 查找确认按钮（多种方式）
            let confirmBtn = document.querySelector('[data-testid="confirmationSheetConfirm"]') ||
                            document.querySelector('[data-testid="unfollowConfirm"]') ||
                            document.querySelector('div[role="button"][data-testid*="confirm"]');
            
            // 如果找不到特定按钮，找包含 "Unfollow" 文本的按钮
            if (!confirmBtn) {
                const buttons = document.querySelectorAll('div[role="button"]');
                for (let btn of buttons) {
                    const text = btn.textContent || '';
                    if (text.includes('Unfollow') || text.includes('取消关注')) {
                        confirmBtn = btn;
                        break;
                    }
                }
            }
            
            if (confirmBtn) {
                confirmBtn.click();
                stats.unfollowed++;
                const daysText = days !== null ? `(${days}天未发推)` : '(从未发推)';
                console.log(`✅ 已取关 #${stats.unfollowed}: @${username} ${daysText}`);
                return true;
            } else {
                console.log(`⚠️ 未找到确认按钮: @${username}`);
                stats.failed++;
                return false;
            }
            
        } catch (e) {
            console.error(`❌ 取关失败 @${username}: ${e.message}`);
            stats.failed++;
            return false;
        }
    }

    // 显示进度
    function showProgress() {
        console.log(`\n📈 进度: 处理${stats.total} | 取关${stats.unfollowed} | 蓝勾${stats.skippedBlue} | 活跃${stats.skippedActive} | 无按钮${stats.noButton} | 失败${stats.failed}`);
    }

    // 主程序
    async function start() {
        console.log(`🎯 配置: 最大${CONFIG.maxUnfollow}人 | ${CONFIG.inactiveDays}天未发推 | 延迟${CONFIG.delayMin}-${CONFIG.delayMax}ms\n`);
        
        // 先滚动几次加载用户
        console.log('📜 预加载用户...');
        for (let i = 0; i < 3; i++) {
            await scrollToLoadMore();
        }
        
        let scrollCount = 0;
        let lastUserCount = 0;
        let noNewUserCount = 0;
        
        while (stats.unfollowed < CONFIG.maxUnfollow && scrollCount < CONFIG.maxScrolls) {
            // 获取当前所有用户卡片
            const userCells = Array.from(document.querySelectorAll('[data-testid="UserCell"]'));
            console.log(`\n📊 当前页面有 ${userCells.length} 个用户`);
            
            if (userCells.length === 0) {
                console.log('❌ 未找到用户卡片，请确认在 https://twitter.com/following');
                break;
            }
            
            // 检查是否有新用户
            if (userCells.length === lastUserCount) {
                noNewUserCount++;
                if (noNewUserCount >= 2) {
                    console.log('📜 尝试滚动加载更多...');
                    const hasMore = await scrollToLoadMore();
                    if (!hasMore) {
                        console.log('✅ 已加载全部用户');
                        break;
                    }
                    noNewUserCount = 0;
                }
            } else {
                noNewUserCount = 0;
            }
            lastUserCount = userCells.length;
            
            // 处理每个用户
            let processedInThisBatch = 0;
            
            for (let cell of userCells) {
                if (stats.unfollowed >= CONFIG.maxUnfollow) break;
                if (cell.dataset.processed) continue;
                
                cell.dataset.processed = 'true';
                stats.total++;
                processedInThisBatch++;
                
                const username = getUsername(cell);
                console.log(`\n[${stats.total}] @${username}`);
                
                // 1. 检查蓝勾
                if (hasVerifiedBadge(cell)) {
                    stats.skippedBlue++;
                    console.log('   ⏭️ 跳过：蓝勾用户');
                    continue;
                }
                
                // 2. 检查活跃度
                const activity = await checkActivity(cell, username);
                if (!activity.inactive && !activity.error) {
                    stats.skippedActive++;
                    console.log(`   ⏭️ 跳过：活跃用户 (${activity.days}天前发推)`);
                    continue;
                }
                
                // 3. 查找取关按钮
                const btn = findUnfollowButton(cell);
                if (!btn) {
                    stats.noButton++;
                    console.log('   ⚠️ 未找到取关按钮');
                    continue;
                }
                
                // 4. 执行取关
                await unfollowUser(btn, username, activity.days);
                
                // 延迟
                await randomDelay(CONFIG.delayMin, CONFIG.delayMax);
                
                // 显示进度
                if (stats.total % 5 === 0) {
                    showProgress();
                }
            }
            
            console.log(`\n📜 本批次处理了 ${processedInThisBatch} 人`);
            scrollCount++;
            
            // 滚动加载更多
            if (stats.unfollowed < CONFIG.maxUnfollow) {
                await scrollToLoadMore();
            }
        }
        
        // 完成总结
        console.log('\n' + '='.repeat(50));
        console.log('✅ 批量取关完成！');
        console.log('='.repeat(50));
        console.log(`📊 统计：`);
        console.log(`   取关成功: ${stats.unfollowed} 人`);
        console.log(`   跳过蓝勾: ${stats.skippedBlue} 人`);
        console.log(`   跳过活跃: ${stats.skippedActive} 人`);
        console.log(`   无取关按钮: ${stats.noButton} 人`);
        console.log(`   失败: ${stats.failed} 次`);
        console.log(`   总计处理: ${stats.total} 人`);
        console.log('='.repeat(50));
    }

    // 启动
    await start();
})();
