import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const FILES = ['index.html', 'tailwind.css', 'video.js', 'local-avatar.js', 'local-avatar-core.mjs', 'vad.js', 'manifest.webmanifest', 'sw.js', 'vendor/trtc.js'];
const PAGE_ONLY_FILES = ['_headers'];
const ICONS = ['apple-touch-icon.png', 'icon-192.png', 'icon-512.png'];

rmSync('www', { recursive: true, force: true });
mkdirSync('www/vendor', { recursive: true });
for (const f of FILES) if (existsSync(f)) cpSync(f, `www/${f}`);
for (const f of PAGE_ONLY_FILES) if (existsSync(f)) cpSync(f, `www/${f}`);
for (const f of ICONS) cpSync(`icons/${f}`, `www/${f}`);

const localAvatarTag = '<script type="module" src="./local-avatar.js"></script>';
const videoTag = '<script type="module" src="./video.js"></script>';
let builtHtml = readFileSync('index.html', 'utf8');
if (!builtHtml.includes(localAvatarTag)) builtHtml = builtHtml.replace(videoTag, `${localAvatarTag}\n  ${videoTag}`);
writeFileSync('www/index.html', builtHtml);
console.log('www/ 已更新');

const web = {};
for (const f of FILES) web['/' + f] = f === 'index.html' ? builtHtml : readFileSync(f, 'utf8');
for (const f of ICONS) web['/' + f] = 'base64:' + readFileSync(`icons/${f}`).toString('base64');
writeFileSync('mcp-relay/src/web-assets.js', `// 自動產生，請改專案根目錄的檔案後跑 npm run build:web\nexport default ${JSON.stringify(web)};\n`);
console.log('mcp-relay/src/web-assets.js 已更新');
