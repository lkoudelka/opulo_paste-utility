import { resolve } from 'path';
import fs from 'fs';

// Dev/preview server only: append the serial traffic that the page POSTs to
// ./__serial-log as JSON lines (one file per server start).
// Directory: $PASTE_LOG_DIR, default ./logs
function serialLog() {
    const dir = process.env.PASTE_LOG_DIR || resolve(__dirname, 'logs');
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const file = resolve(dir, `paste-utility-${stamp}.jsonl`);
    const handler = (req, res, next) => {
        if (req.method !== 'POST' || !req.url.endsWith('/__serial-log')) return next();
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const lines = JSON.parse(body).map(e => JSON.stringify(e)).join('\n') + '\n';
                fs.mkdirSync(dir, { recursive: true });
                fs.appendFileSync(file, lines);
                res.statusCode = 204;
            } catch (e) {
                res.statusCode = 400;
            }
            res.end();
        });
    };
    return {
        name: 'serial-log',
        configureServer(server) { server.middlewares.use(handler); },
        configurePreviewServer(server) { server.middlewares.use(handler); }
    };
}

export default {
    base: './',
    plugins: [serialLog()],
    optimizeDeps: { exclude: ["fsevents"] },
    publicDir: 'public',
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                help: resolve(__dirname, 'help.html')
            }
        }
    }
}