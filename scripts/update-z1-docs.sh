#!/bin/bash
# Z1操作手册自动更新脚本
# 定时任务：每10分钟执行一次
# 使用方法: ./update-z1-docs.sh

set -e

# 配置
PROJECT_DIR="/Users/fan/www/AI/z1-docs"
QUEUE_FILE="$PROJECT_DIR/.claude/z1-queue.json"
LOG_FILE="/tmp/z1-cron.log"

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 检查队列文件是否存在
if [ ! -f "$QUEUE_FILE" ]; then
    log "错误: 队列文件不存在: $QUEUE_FILE"
    exit 1
fi

# 使用 Node.js 解析 JSON 和处理
node << 'SCRIPT'
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const PROJECT_DIR = '/Users/fan/www/AI/z1-docs';
const QUEUE_FILE = path.join(PROJECT_DIR, '.claude/z1-queue.json');
const LOG_FILE = '/tmp/z1-cron.log';

function log(msg) {
    const timestamp = new Date().toLocaleString('zh-CN');
    console.log(`[${timestamp}] ${msg}`);
}

try {
    // 读取队列
    const queueData = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8'));
    if (!queueData.queue || queueData.queue.length === 0) {
        log('队列为空，任务结束');
        process.exit(0);
    }

    // 获取第一个任务
    const task = queueData.queue[0];
    log(`开始处理: ${task.name} (token: ${task.token})`);

    // 如果是文件夹类型，跳过
    if (task.type === 'folder') {
        log('跳过文件夹类型任务');
        queueData.queue.shift();
        queueData.lastUpdated = new Date().toISOString().split('T')[0];
        fs.writeFileSync(QUEUE_FILE, JSON.stringify(queueData, null, 2));
        log('队列已更新');
        process.exit(0);
    }

    // 创建输出目录
    const categoryDir = path.join(PROJECT_DIR, 'docs/z1', task.category);
    if (!fs.existsSync(categoryDir)) {
        fs.mkdirSync(categoryDir, { recursive: true });
    }

    // 生成文件名
    const safeName = task.name
        .replace(/[，,、\s]+/g, '-')
        .replace(/[【】[\]（）()]/g, '')
        .replace(/[^\w-]/g, '')
        .toLowerCase();
    const outputFile = path.join(categoryDir, `${safeName}.mdx`);

    log(`输出文件: ${outputFile}`);

    // 读取飞书文档 (使用 --doc 标志)
    let docContent = '';
    try {
        const result = execSync(`lark-cli docs +fetch --doc ${task.token} --format markdown`, {
            cwd: PROJECT_DIR,
            encoding: 'utf-8',
            timeout: 60000
        });
        docContent = result;
        log('成功读取飞书文档，长度: ' + docContent.length);
    } catch (err) {
        log(`读取飞书文档失败: ${err.message}`);
        process.exit(1);
    }

    // 转换内容为操作手册格式
    const title = task.name.replace(/产品文档$/, '').trim();
    const folder = task.folder || task.category;

    // 生成 MDX 内容
    const mdxContent = `---
title: ${title}
description: ${title}操作指南
---

# ${title}

${docContent.slice(0, 5000)}

## 相关功能

- [返回会员业务](/z1/member-guide/)
`;

    // 写入文件
    fs.writeFileSync(outputFile, mdxContent, 'utf-8');
    log(`文档已写入: ${outputFile}`);

    // 从队列中移除已处理的任务
    queueData.queue.shift();
    queueData.lastUpdated = new Date().toISOString().split('T')[0];
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(queueData, null, 2));
    log('队列已更新');

    // Git 提交和推送
    try {
        log('开始 Git 提交...');
        execSync('git add -A', { cwd: PROJECT_DIR, stdio: 'inherit' });
        const status = execSync('git status --porcelain', { cwd: PROJECT_DIR }).toString();
        if (status.trim()) {
            const commitMsg = `docs: 添加${title}操作手册`;
            execSync(`git commit -m "${commitMsg}"`, { cwd: PROJECT_DIR, stdio: 'inherit' });
            execSync('git push', { cwd: PROJECT_DIR, stdio: 'inherit' });
            log('Git 推送成功!');
        } else {
            log('没有变更，无需提交');
        }
    } catch (gitErr) {
        log(`Git 操作失败: ${gitErr.message}`);
    }

    log(`任务完成: ${task.name}`);

} catch (error) {
    log(`错误: ${error.message}`);
    process.exit(1);
}
SCRIPT

log "脚本执行完成"
