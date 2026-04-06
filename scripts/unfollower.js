// X (Twitter) 批量取关脚本 - 终极修复版
// 修复：选择器问题 + 添加互相关注保护

(async function() {
    'use strict';
    
    console.log('=== X 批量取关脚本（终极修复版）===');
    console.log('⚠️ 请确保您在 https://twitter.com/following');
    console.log('💡 本脚本会：跳过蓝勾 + 跳过互关 + 取关60天未发推用户\n');

    const CONFIG = {
        maxUnfollow: 50,            // 降低初始数量测试
        inactiveDays: 60,
        delayMin: 2000,
        delayMax: 4000,
        scrollDelay: 2000,
        maxScrolls: 50,             // 增大滚动次数上限
        maxEmptyScrolls: 3          // 连续多少次无新增用户时停止
    };

    let stats = {
        unfollowed: 0,
        skippedBlue: 0,
        skippedActive: 0,
        skippedMutual: 0,           // 新增：跳过互关
        noButton: 0,
        failed: 0,
        total: 0
    };

    function randomDelay(min, max) {
        return new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min));
    }

    // 检查是否是互相关注（对方也关注我）
    function isMutualFollow(userCell) {
        // 查找 "Follows you" 或 "关注了你" 文本
        const cellText = userCell.textContent || '';
        
        // 检查各种可能的文本
        if (cellText.includes('Follows you')) return true;
        if (cellText.includes('关注了你')) return true;
        if (cellText.includes('Follows')) return true;  // 简化检查
        
        // 检查是否有特定图标或标签表示互关
        const mutualIndicators = userCell.querySelectorAll('span');
        for (let span of mutualIndicators) {
            const text = span.textContent || '';
            if (text.includes('Follows you') || text.includes('关注了你')) {
                return true;
            }
        }
        
        return false;
    }

    // 检查蓝勾
    function hasVerifiedBadge(userCell) {
        const indicators = [
            '[data-testid="icon-verified"]',
            '[aria-label="Verified account"]',
            '[aria-label="认证账户"]',
            'svg[aria-label*="Verified"]',
            'svg[aria-label*="认证"]'
        ];
        
        for (let selector of indicators) {
            if (userCell.querySelector(selector)) return true;
        }
        
        return false;
    }

    // 获取用户名
    function getUsername(userCell) {
        // 方式1: 从链接 href
        const links = userCell.querySelectorAll('a');
        for (let link of links) {
            const href = link.getAttribute('href') || '';
            if (href.startsWith('/') && !href.includes('/status/')) {
                const parts = href.split('/');
                if (parts[1] && parts[1].length > 0) {
                    return parts[1];
                }
            }
        }
        
        // 方式2: 从 @username 文本
        const allText = userCell.textContent || '';
        const match = allText.match(/@([a-zA-Z0-9_]+)/);
        if (match) return match[1];
        
        return 'unknown';
    }

    // 检查活跃度
    async function checkActivity(userCell) {
        const timeEl = userCell.querySelector('time');
        if (timeEl) {
            const datetime = timeEl.getAttribute('datetime');
            if (datetime) {
                const days = Math.floor((new Date() - new Date(datetime)) / (1000 * 60 * 60 * 24));
                return { hasTweet: true, days, inactive: days > CONFIG.inactiveDays };
            }
        }
        return { hasTweet: false, days: null, inactive: true };
    }

    // 查找取关按钮（终极修复版）
    function findUnfollowButton(userCell) {
        console.log('   🔍 查找取关按钮...');
        
        // 方式1: 标准 data-testid（精确匹配或通配符匹配）
        let btn = userCell.querySelector('[data-testid="unfollow"]') ||
                  userCell.querySelector('[data-testid$="-unfollow"]') ||
                  userCell.querySelector('[data-testid*="unfollow"]');
        if (btn) {
            console.log('   ✅ 找到按钮（方式1: data-testid）');
            return btn;
        }
        
        // 方式2: aria-label 包含 "Following" 或 "Unfollow"
        const allButtons = userCell.querySelectorAll('[role="button"]');
        console.log(`   找到 ${allButtons.length} 个按钮`);
        
        for (let btn of allButtons) {
            const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
            if (ariaLabel.includes('following') || ariaLabel.includes('unfollow')) {
                console.log(`   ✅ 找到按钮（方式2: aria-label）- "${btn.getAttribute('aria-label')}"`);
                return btn;
            }
        }
        
        // 方式3: 文本内容匹配（"Following" / "正在关注"）
        for (let btn of allButtons) {
            const text = (btn.textContent || '').trim().toLowerCase();
            if (text === 'following' || text === '正在关注') {
                console.log(`   ✅ 找到按钮（方式3: 文本匹配）- "${btn.textContent?.trim()}"`);
                return btn;
            }
        }
        
        console.log('   ❌ 未找到取关按钮');
        return null;
    }

    // 等待确认弹窗出现（使用 MutationObserver）
    function waitForConfirmDialog(timeoutMs = 3000) {
        return new Promise((resolve) => {
            const findConfirmBtn = () => {
                // 优先检查 alertdialog 容器内的确认按钮
                const dialog = document.querySelector('[role="alertdialog"]') ||
                               document.querySelector('[data-testid="confirmationSheetDialog"]');
                if (dialog) {
                    const btn = dialog.querySelector('[data-testid="confirmationSheetConfirm"]') ||
                                dialog.querySelector('[data-testid="unfollowConfirm"]');
                    if (btn) return btn;
                }
                // 全局查找
                return document.querySelector('[data-testid="confirmationSheetConfirm"]') ||
                       document.querySelector('[data-testid="unfollowConfirm"]');
            };

            // 已存在直接返回
            const existing = findConfirmBtn();
            if (existing) { resolve(existing); return; }

            const timer = setTimeout(() => {
                observer.disconnect();
                resolve(null);
            }, timeoutMs);

            const observer = new MutationObserver(() => {
                const btn = findConfirmBtn();
                if (btn) {
                    clearTimeout(timer);
                    observer.disconnect();
                    resolve(btn);
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        });
    }

    // 执行取关
    async function unfollowUser(button, username, days) {
        try {
            console.log('   🖱️  点击取关按钮...');
            button.click();
            await randomDelay(800, 1200);
            
            // 等待确认弹窗（使用 MutationObserver，最多 3 秒）
            console.log('   🔍 等待确认弹窗...');
            let confirmBtn = await waitForConfirmDialog(3000);
            
            // 如果没找到，重试一次点击取关按钮
            if (!confirmBtn) {
                console.log('   🔄 未找到确认按钮，重试点击取关按钮...');
                button.click();
                await randomDelay(800, 1200);
                confirmBtn = await waitForConfirmDialog(3000);
            }
            
            // 降级：轮询查找包含 Unfollow/取消关注 文本的按钮
            if (!confirmBtn) {
                for (let i = 0; i < 5; i++) {
                    const btns = document.querySelectorAll('[role="button"]');
                    for (let btn of btns) {
                        const text = (btn.textContent || '').toLowerCase();
                        if (text.includes('unfollow') || text.includes('取消关注')) {
                            confirmBtn = btn;
                            break;
                        }
                    }
                    if (confirmBtn) break;
                    await randomDelay(400, 600);
                }
            }
            
            if (confirmBtn) {
                console.log('   🖱️  点击确认按钮...');
                confirmBtn.click();
                stats.unfollowed++;
                const daysText = days !== null ? `(${days}天)` : '(从未)';
                console.log(`   ✅ 成功取关 #${stats.unfollowed}: @${username} ${daysText}`);
                return true;
            } else {
                console.log('   ❌ 未找到确认按钮');
                stats.failed++;
                return false;
            }
            
        } catch (e) {
            console.error(`   ❌ 错误: ${e.message}`);
            stats.failed++;
            return false;
        }
    }

    // 滚动加载
    async function scrollToLoadMore() {
        console.log('📜 滚动加载...');
        const before = document.querySelectorAll('[data-testid="UserCell"]').length;
        
        window.scrollTo(0, document.body.scrollHeight);
        await randomDelay(CONFIG.scrollDelay, CONFIG.scrollDelay + 1000);
        
        const after = document.querySelectorAll('[data-testid="UserCell"]').length;
        console.log(`   ${before} → ${after} 人`);
        return after > before;
    }

    // 主程序
    async function start() {
        console.log(`\n🎯 配置: 最大${CONFIG.maxUnfollow}人 | ${CONFIG.inactiveDays}天未发推 | 跳过互关\n`);
        
        // 预加载
        console.log('📜 预加载用户...');
        for (let i = 0; i < 3; i++) {
            await scrollToLoadMore();
        }
        
        let scrollCount = 0;
        let emptyScrollCount = 0;
        
        while (stats.unfollowed < CONFIG.maxUnfollow && scrollCount < CONFIG.maxScrolls) {
            const userCells = Array.from(document.querySelectorAll('[data-testid="UserCell"]'));
            console.log(`\n📊 当前页面: ${userCells.length} 人`);
            
            if (userCells.length === 0) {
                console.log('❌ 未找到用户，请确认在 https://twitter.com/following');
                break;
            }
            
            let processed = 0;
            
            for (let cell of userCells) {
                if (stats.unfollowed >= CONFIG.maxUnfollow) break;
                if (cell.dataset.processed) continue;
                
                cell.dataset.processed = 'true';
                stats.total++;
                processed++;
                
                const username = getUsername(cell);
                console.log(`\n[${stats.total}] @${username}`);
                
                // 1. 检查互关
                if (isMutualFollow(cell)) {
                    stats.skippedMutual++;
                    console.log('   💚 跳过：互相关注（关注我的用户）');
                    continue;
                }
                
                // 2. 检查蓝勾
                if (hasVerifiedBadge(cell)) {
                    stats.skippedBlue++;
                    console.log('   ✅ 跳过：蓝勾用户');
                    continue;
                }
                
                // 3. 检查活跃度
                const activity = await checkActivity(cell);
                if (!activity.inactive) {
                    stats.skippedActive++;
                    console.log(`   ⏭️ 跳过：活跃用户 (${activity.days}天前)`);
                    continue;
                }
                
                // 4. 查找并点击取关按钮
                const btn = findUnfollowButton(cell);
                if (!btn) {
                    stats.noButton++;
                    console.log('   ❌ 无取关按钮');
                    continue;
                }
                
                await unfollowUser(btn, username, activity.days);
                await randomDelay(CONFIG.delayMin, CONFIG.delayMax);
                
                // 显示进度
                if (stats.total % 3 === 0) {
                    console.log(`\n📈 进度: 处理${stats.total} | 取关${stats.unfollowed} | 互关${stats.skippedMutual} | 蓝勾${stats.skippedBlue} | 活跃${stats.skippedActive} | 无按钮${stats.noButton}`);
                }
            }
            
            console.log(`\n📜 本批处理: ${processed} 人`);
            scrollCount++;
            
            if (stats.unfollowed < CONFIG.maxUnfollow) {
                const hasMore = await scrollToLoadMore();
                if (!hasMore) {
                    emptyScrollCount++;
                    console.log(`   ⚠️ 无新增用户（连续 ${emptyScrollCount} 次）`);
                    if (emptyScrollCount >= CONFIG.maxEmptyScrolls) {
                        console.log('✅ 已加载全部用户（智能停止）');
                        break;
                    }
                } else {
                    emptyScrollCount = 0;
                }
            }
        }
        
        // 总结
        console.log('\n' + '='.repeat(60));
        console.log('✅ 完成！');
        console.log('='.repeat(60));
        console.log(`📊 统计：`);
        console.log(`   取关成功: ${stats.unfollowed} 人 ⭐`);
        console.log(`   跳过互关: ${stats.skippedMutual} 人 💚`);
        console.log(`   跳过蓝勾: ${stats.skippedBlue} 人`);
        console.log(`   跳过活跃: ${stats.skippedActive} 人`);
        console.log(`   无取关按钮: ${stats.noButton} 人`);
        console.log(`   失败: ${stats.failed} 次`);
        console.log(`   总计处理: ${stats.total} 人`);
        console.log('='.repeat(60));
    }

    await start();
})();
