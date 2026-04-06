// ==UserScript==
// @name         Twitter/X Unfollower
// @namespace    https://github.com/ynbtc/Unfollower
// @version      1.1.0
// @description  Twitter/X 批量取关工具 - 自动取关非活跃/非蓝勾用户
// @author       ynbtc
// @match        https://twitter.com/*/following
// @match        https://x.com/*/following
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    // ===== 默认配置 =====
    const DEFAULT_CONFIG = {
        maxUnfollow: 50,
        inactiveDays: 60,
        delayMin: 2000,
        delayMax: 4000,
        scrollDelay: 2000,
        maxScrolls: 50,
        maxEmptyScrolls: 3
    };

    let config = Object.assign({}, DEFAULT_CONFIG);

    let stats = {
        unfollowed: 0,
        skippedBlue: 0,
        skippedActive: 0,
        skippedMutual: 0,
        noButton: 0,
        failed: 0,
        total: 0
    };

    let running = false;
    let stopRequested = false;
    let panelMinimized = false;

    // ===== 样式 =====
    GM_addStyle(`
        #uf-panel {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 320px;
            background: #15202b;
            color: #e7e9ea;
            border: 1px solid #38444d;
            border-radius: 12px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            font-size: 13px;
            z-index: 99999;
            box-shadow: 0 8px 32px rgba(0,0,0,0.5);
            user-select: none;
        }
        #uf-panel.minimized #uf-body { display: none; }
        #uf-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 14px;
            background: #1d9bf0;
            border-radius: 11px 11px 0 0;
            cursor: pointer;
            font-weight: 700;
            font-size: 14px;
        }
        #uf-panel.minimized #uf-header {
            border-radius: 11px;
        }
        #uf-minimize-btn {
            background: none;
            border: none;
            color: #fff;
            font-size: 16px;
            cursor: pointer;
            padding: 0 4px;
            line-height: 1;
        }
        #uf-body { padding: 12px 14px; }
        .uf-section { margin-bottom: 10px; }
        .uf-label {
            font-size: 11px;
            color: #8899a6;
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .uf-config-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 5px;
        }
        .uf-config-row label { font-size: 12px; color: #c4cfd6; }
        .uf-config-row input[type="number"] {
            width: 70px;
            background: #253341;
            border: 1px solid #38444d;
            border-radius: 6px;
            color: #e7e9ea;
            padding: 3px 6px;
            font-size: 12px;
            text-align: right;
        }
        .uf-stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 5px;
        }
        .uf-stat-item {
            background: #253341;
            border-radius: 6px;
            padding: 5px 8px;
            text-align: center;
        }
        .uf-stat-value {
            font-size: 18px;
            font-weight: 700;
            color: #1d9bf0;
            display: block;
        }
        .uf-stat-label {
            font-size: 10px;
            color: #8899a6;
        }
        .uf-stat-item.success .uf-stat-value { color: #00ba7c; }
        .uf-stat-item.warn .uf-stat-value { color: #ffad1f; }
        .uf-stat-item.danger .uf-stat-value { color: #f4212e; }
        #uf-log {
            background: #253341;
            border-radius: 6px;
            padding: 6px 8px;
            height: 100px;
            overflow-y: auto;
            font-size: 11px;
            line-height: 1.5;
            font-family: monospace;
            color: #aab8c2;
        }
        #uf-log .log-success { color: #00ba7c; }
        #uf-log .log-warn { color: #ffad1f; }
        #uf-log .log-error { color: #f4212e; }
        #uf-log .log-info { color: #1d9bf0; }
        .uf-btn-row {
            display: flex;
            gap: 8px;
            margin-top: 2px;
        }
        .uf-btn {
            flex: 1;
            padding: 8px 0;
            border: none;
            border-radius: 20px;
            font-weight: 700;
            font-size: 13px;
            cursor: pointer;
            transition: opacity 0.2s;
        }
        .uf-btn:hover { opacity: 0.85; }
        .uf-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        #uf-start-btn { background: #1d9bf0; color: #fff; }
        #uf-stop-btn { background: #253341; color: #e7e9ea; border: 1px solid #38444d; }
        #uf-status-bar {
            font-size: 11px;
            color: #8899a6;
            text-align: center;
            margin-top: 6px;
        }
        #uf-status-bar.running { color: #1d9bf0; }
        #uf-status-bar.stopped { color: #f4212e; }
        #uf-status-bar.done { color: #00ba7c; }
    `);

    // ===== 构建面板 =====
    function buildPanel() {
        const panel = document.createElement('div');
        panel.id = 'uf-panel';
        panel.innerHTML = `
            <div id="uf-header">
                <span>🐦 Twitter/X Unfollower</span>
                <button id="uf-minimize-btn" title="最小化/展开">—</button>
            </div>
            <div id="uf-body">
                <div class="uf-section">
                    <div class="uf-label">配置</div>
                    <div class="uf-config-row">
                        <label>最大取关数</label>
                        <input type="number" id="uf-cfg-max" value="${config.maxUnfollow}" min="1" max="9999">
                    </div>
                    <div class="uf-config-row">
                        <label>不活跃天数</label>
                        <input type="number" id="uf-cfg-days" value="${config.inactiveDays}" min="1" max="3650">
                    </div>
                    <div class="uf-config-row">
                        <label>最小延迟(ms)</label>
                        <input type="number" id="uf-cfg-dmin" value="${config.delayMin}" min="500" max="10000">
                    </div>
                    <div class="uf-config-row">
                        <label>最大延迟(ms)</label>
                        <input type="number" id="uf-cfg-dmax" value="${config.delayMax}" min="500" max="10000">
                    </div>
                </div>
                <div class="uf-section">
                    <div class="uf-label">统计</div>
                    <div class="uf-stats-grid">
                        <div class="uf-stat-item success">
                            <span class="uf-stat-value" id="uf-s-unfollowed">0</span>
                            <span class="uf-stat-label">取关成功</span>
                        </div>
                        <div class="uf-stat-item">
                            <span class="uf-stat-value" id="uf-s-total">0</span>
                            <span class="uf-stat-label">总处理</span>
                        </div>
                        <div class="uf-stat-item warn">
                            <span class="uf-stat-value" id="uf-s-blue">0</span>
                            <span class="uf-stat-label">跳过蓝勾</span>
                        </div>
                        <div class="uf-stat-item warn">
                            <span class="uf-stat-value" id="uf-s-active">0</span>
                            <span class="uf-stat-label">跳过活跃</span>
                        </div>
                        <div class="uf-stat-item">
                            <span class="uf-stat-value" id="uf-s-mutual">0</span>
                            <span class="uf-stat-label">跳过互关</span>
                        </div>
                        <div class="uf-stat-item danger">
                            <span class="uf-stat-value" id="uf-s-failed">0</span>
                            <span class="uf-stat-label">失败</span>
                        </div>
                    </div>
                </div>
                <div class="uf-section">
                    <div class="uf-label">日志</div>
                    <div id="uf-log"></div>
                </div>
                <div class="uf-btn-row">
                    <button class="uf-btn" id="uf-start-btn">▶ 开始取关</button>
                    <button class="uf-btn" id="uf-stop-btn" disabled>⏹ 停止</button>
                </div>
                <div id="uf-status-bar">就绪 — 点击开始</div>
            </div>
        `;
        document.body.appendChild(panel);

        // 最小化/展开
        panel.querySelector('#uf-minimize-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            panelMinimized = !panelMinimized;
            panel.classList.toggle('minimized', panelMinimized);
            panel.querySelector('#uf-minimize-btn').textContent = panelMinimized ? '＋' : '—';
        });

        // 开始按钮
        panel.querySelector('#uf-start-btn').addEventListener('click', () => {
            if (running) return;
            // 读取配置
            config.maxUnfollow = parseInt(panel.querySelector('#uf-cfg-max').value) || DEFAULT_CONFIG.maxUnfollow;
            config.inactiveDays = parseInt(panel.querySelector('#uf-cfg-days').value) || DEFAULT_CONFIG.inactiveDays;
            config.delayMin = parseInt(panel.querySelector('#uf-cfg-dmin').value) || DEFAULT_CONFIG.delayMin;
            config.delayMax = parseInt(panel.querySelector('#uf-cfg-dmax').value) || DEFAULT_CONFIG.delayMax;
            startUnfollowing();
        });

        // 停止按钮
        panel.querySelector('#uf-stop-btn').addEventListener('click', () => {
            if (!running) return;
            stopRequested = true;
            setStatus('已请求停止...', 'stopped');
            appendLog('⏹ 用户请求停止', 'warn');
        });
    }

    // ===== UI 辅助 =====
    function updateStats() {
        document.getElementById('uf-s-unfollowed').textContent = stats.unfollowed;
        document.getElementById('uf-s-total').textContent = stats.total;
        document.getElementById('uf-s-blue').textContent = stats.skippedBlue;
        document.getElementById('uf-s-active').textContent = stats.skippedActive;
        document.getElementById('uf-s-mutual').textContent = stats.skippedMutual;
        document.getElementById('uf-s-failed').textContent = stats.failed;
    }

    function appendLog(msg, type = '') {
        const log = document.getElementById('uf-log');
        if (!log) return;
        const line = document.createElement('div');
        if (type) line.className = `log-${type}`;
        line.textContent = msg;
        log.appendChild(line);
        log.scrollTop = log.scrollHeight;
    }

    function setStatus(msg, cls = '') {
        const bar = document.getElementById('uf-status-bar');
        if (!bar) return;
        bar.textContent = msg;
        bar.className = cls;
    }

    function setRunning(val) {
        running = val;
        const startBtn = document.getElementById('uf-start-btn');
        const stopBtn = document.getElementById('uf-stop-btn');
        if (startBtn) startBtn.disabled = val;
        if (stopBtn) stopBtn.disabled = !val;
    }

    // ===== 核心逻辑 =====
    function randomDelay(min, max) {
        return new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min));
    }

    function isMutualFollow(userCell) {
        const cellText = userCell.textContent || '';
        if (cellText.includes('Follows you')) return true;
        if (cellText.includes('关注了你')) return true;
        const spans = userCell.querySelectorAll('span');
        for (let span of spans) {
            const text = span.textContent || '';
            if (text.includes('Follows you') || text.includes('关注了你')) return true;
        }
        return false;
    }

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

    function getUsername(userCell) {
        const links = userCell.querySelectorAll('a');
        for (let link of links) {
            const href = link.getAttribute('href') || '';
            if (href.startsWith('/') && !href.includes('/status/')) {
                const parts = href.split('/');
                if (parts[1] && parts[1].length > 0) return parts[1];
            }
        }
        const allText = userCell.textContent || '';
        const match = allText.match(/@([a-zA-Z0-9_]+)/);
        if (match) return match[1];
        return 'unknown';
    }

    async function checkActivity(userCell) {
        const timeEl = userCell.querySelector('time');
        if (timeEl) {
            const datetime = timeEl.getAttribute('datetime');
            if (datetime) {
                const days = Math.floor((new Date() - new Date(datetime)) / (1000 * 60 * 60 * 24));
                return { hasTweet: true, days, inactive: days > config.inactiveDays };
            }
        }
        return { hasTweet: false, days: null, inactive: true };
    }

    function findUnfollowButton(userCell) {
        // 方式1: data-testid
        let btn = userCell.querySelector('[data-testid="unfollow"]') ||
                  userCell.querySelector('[data-testid$="-unfollow"]') ||
                  userCell.querySelector('[data-testid*="unfollow"]');
        if (btn) return btn;

        // 方式2: aria-label
        const allButtons = userCell.querySelectorAll('[role="button"]');
        for (let b of allButtons) {
            const ariaLabel = (b.getAttribute('aria-label') || '').toLowerCase();
            if (ariaLabel.includes('following') || ariaLabel.includes('unfollow')) return b;
        }

        // 方式3: 精确文本匹配
        for (let b of allButtons) {
            const text = (b.textContent || '').trim().toLowerCase();
            if (text === 'following' || text === '正在关注') return b;
        }

        return null;
    }

    function waitForConfirmDialog(timeoutMs = 3000) {
        return new Promise((resolve) => {
            const findConfirmBtn = () => {
                const dialog = document.querySelector('[role="alertdialog"]') ||
                               document.querySelector('[data-testid="confirmationSheetDialog"]');
                if (dialog) {
                    const btn = dialog.querySelector('[data-testid="confirmationSheetConfirm"]') ||
                                dialog.querySelector('[data-testid="unfollowConfirm"]');
                    if (btn) return btn;
                }
                return document.querySelector('[data-testid="confirmationSheetConfirm"]') ||
                       document.querySelector('[data-testid="unfollowConfirm"]');
            };

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

    async function unfollowUser(button, username, days) {
        try {
            appendLog(`🖱️ 点击取关: @${username}`, 'info');
            button.click();
            await randomDelay(800, 1200);

            let confirmBtn = await waitForConfirmDialog(3000);

            if (!confirmBtn) {
                appendLog('🔄 重试点击取关按钮...', 'warn');
                button.click();
                await randomDelay(800, 1200);
                confirmBtn = await waitForConfirmDialog(3000);
            }

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
                confirmBtn.click();
                stats.unfollowed++;
                const daysText = days !== null ? `(${days}天前)` : '(从未发推)';
                appendLog(`✅ 取关成功 #${stats.unfollowed}: @${username} ${daysText}`, 'success');
                updateStats();
                return true;
            } else {
                appendLog(`❌ 未找到确认按钮: @${username}`, 'error');
                stats.failed++;
                updateStats();
                return false;
            }
        } catch (e) {
            appendLog(`❌ 错误: ${e.message}`, 'error');
            stats.failed++;
            updateStats();
            return false;
        }
    }

    async function scrollToLoadMore() {
        const before = document.querySelectorAll('[data-testid="UserCell"]').length;
        window.scrollTo(0, document.body.scrollHeight);
        await randomDelay(config.scrollDelay, config.scrollDelay + 1000);
        const after = document.querySelectorAll('[data-testid="UserCell"]').length;
        return after > before;
    }

    async function startUnfollowing() {
        if (running) return;

        // 重置统计
        stats = { unfollowed: 0, skippedBlue: 0, skippedActive: 0, skippedMutual: 0, noButton: 0, failed: 0, total: 0 };
        stopRequested = false;
        updateStats();

        const logEl = document.getElementById('uf-log');
        if (logEl) logEl.innerHTML = '';

        setRunning(true);
        setStatus('▶ 运行中...', 'running');
        appendLog('=== 开始取关 ===', 'info');
        appendLog(`配置: 最大${config.maxUnfollow}人 | ${config.inactiveDays}天不活跃`, 'info');

        // 预加载
        appendLog('📜 预加载用户列表...', 'info');
        for (let i = 0; i < 3; i++) {
            if (stopRequested) break;
            await scrollToLoadMore();
        }

        let scrollCount = 0;
        let emptyScrollCount = 0;

        while (stats.unfollowed < config.maxUnfollow && scrollCount < config.maxScrolls) {
            if (stopRequested) break;

            const userCells = Array.from(document.querySelectorAll('[data-testid="UserCell"]'));

            if (userCells.length === 0) {
                appendLog('❌ 未找到用户，请确认在 following 页面', 'error');
                break;
            }

            let processed = 0;

            for (let cell of userCells) {
                if (stopRequested) break;
                if (stats.unfollowed >= config.maxUnfollow) break;
                if (cell.dataset.ufProcessed) continue;

                cell.dataset.ufProcessed = 'true';
                stats.total++;
                processed++;
                updateStats();

                const username = getUsername(cell);

                if (isMutualFollow(cell)) {
                    stats.skippedMutual++;
                    appendLog(`💚 跳过互关: @${username}`);
                    updateStats();
                    continue;
                }

                if (hasVerifiedBadge(cell)) {
                    stats.skippedBlue++;
                    appendLog(`🔵 跳过蓝勾: @${username}`, 'warn');
                    updateStats();
                    continue;
                }

                const activity = await checkActivity(cell);
                if (!activity.inactive) {
                    stats.skippedActive++;
                    appendLog(`⏭️ 跳过活跃: @${username} (${activity.days}天前)`, 'warn');
                    updateStats();
                    continue;
                }

                const btn = findUnfollowButton(cell);
                if (!btn) {
                    stats.noButton++;
                    appendLog(`⚠️ 无取关按钮: @${username}`, 'warn');
                    updateStats();
                    continue;
                }

                await unfollowUser(btn, username, activity.days);
                setStatus(`▶ 已取关 ${stats.unfollowed}/${config.maxUnfollow}`, 'running');
                await randomDelay(config.delayMin, config.delayMax);
            }

            scrollCount++;

            if (stats.unfollowed < config.maxUnfollow && !stopRequested) {
                const hasMore = await scrollToLoadMore();
                if (!hasMore) {
                    emptyScrollCount++;
                    appendLog(`⚠️ 无新增用户（连续 ${emptyScrollCount} 次）`, 'warn');
                    if (emptyScrollCount >= config.maxEmptyScrolls) {
                        appendLog('✅ 已加载全部用户（智能停止）', 'success');
                        break;
                    }
                } else {
                    emptyScrollCount = 0;
                }
            }
        }

        setRunning(false);
        const reason = stopRequested ? '用户手动停止' : '完成';
        setStatus(`⏹ ${reason}`, 'done');
        appendLog('=== 结束 ===', 'info');
        appendLog(`取关: ${stats.unfollowed} | 互关: ${stats.skippedMutual} | 蓝勾: ${stats.skippedBlue} | 活跃: ${stats.skippedActive} | 失败: ${stats.failed}`, 'info');
    }

    // ===== 油猴菜单 =====
    GM_registerMenuCommand('开始批量取关', () => {
        if (running) {
            alert('脚本正在运行中');
            return;
        }
        const panel = document.getElementById('uf-panel');
        if (panel && panelMinimized) {
            panelMinimized = false;
            panel.classList.remove('minimized');
            panel.querySelector('#uf-minimize-btn').textContent = '—';
        }
        startUnfollowing();
    });

    GM_registerMenuCommand('停止取关', () => {
        if (!running) {
            alert('脚本未在运行');
            return;
        }
        stopRequested = true;
    });

    // ===== 初始化 =====
    function init() {
        if (document.getElementById('uf-panel')) return;
        buildPanel();
    }

    // 等待页面就绪后插入面板
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(init, 500);
    } else {
        document.addEventListener('DOMContentLoaded', () => setTimeout(init, 500));
    }

})();
