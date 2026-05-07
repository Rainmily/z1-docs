/**
 * 企业微信多企业认证服务
 *
 * 支持从多个不同的企业微信组织登录
 * 每个企业有独立的 CorpID + AgentID + AgentSecret
 */

import express from 'express';
import session from 'express-session';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import authRouter from './routes/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量
try {
  const { config } = await import('dotenv');
  config({ path: join(__dirname, '../.env') });
} catch { /* 生产环境用环境变量注入 */ }

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-multi-tenant';

// ── 中间件 ────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 8 * 60 * 60 * 1000,
  },
}));

// 静态文件
app.use(express.static(join(__dirname, '../doc_build')));

// ── 路由 ──────────────────────────────────────────────────────
app.use('/auth', authRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`\n  多企业微信认证服务已启动`);
  console.log(`  📍 http://localhost:${PORT}`);
  console.log(`  🔐 前端回调: ${FRONTEND_URL}/auth/callback\n`);
});
