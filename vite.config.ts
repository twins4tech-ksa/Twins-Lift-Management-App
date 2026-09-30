import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import net from 'net';
import {defineConfig, Plugin} from 'vite';

function dbHealthPlugin(): Plugin {
  return {
    name: 'db-health-check',
    configureServer(server) {
      server.middlewares.use('/api/db-health', (req, res) => {
        res.setHeader('Content-Type', 'application/json');

        const handleCheck = (rawDbUrl?: string) => {
          const dbUrl = rawDbUrl || process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.PG_URL;

          if (!dbUrl) {
            res.statusCode = 200;
            res.end(JSON.stringify({
              connected: false,
              status: 'disconnected',
              message: 'لم يتم تعيين رابط اتصال PostgreSQL (DATABASE_URL)',
              timestamp: new Date().toISOString()
            }));
            return;
          }

          try {
            // Strip postgresql:// or postgres://
            const parsed = new URL(dbUrl.startsWith('postgres') ? dbUrl : `postgres://${dbUrl}`);
            const host = parsed.hostname;
            const port = Number(parsed.port) || 5432;
            const database = parsed.pathname ? parsed.pathname.replace(/^\//, '') : 'postgres';

            const socket = new net.Socket();
            let isResolved = false;
            socket.setTimeout(2500);

            socket.on('connect', () => {
              if (!isResolved) {
                isResolved = true;
                socket.destroy();
                res.statusCode = 200;
                res.end(JSON.stringify({
                  connected: true,
                  status: 'connected',
                  host,
                  port,
                  database,
                  message: `متصل بقاعدة بيانات PostgreSQL بنجاح على ${host}:${port}`,
                  timestamp: new Date().toISOString()
                }));
              }
            });

            socket.on('timeout', () => {
              if (!isResolved) {
                isResolved = true;
                socket.destroy();
                res.statusCode = 200;
                res.end(JSON.stringify({
                  connected: false,
                  status: 'disconnected',
                  host,
                  port,
                  database,
                  message: `انتهت مهلة الاتصال بالخادم ${host}:${port}`,
                  timestamp: new Date().toISOString()
                }));
              }
            });

            socket.on('error', (err) => {
              if (!isResolved) {
                isResolved = true;
                socket.destroy();
                res.statusCode = 200;
                res.end(JSON.stringify({
                  connected: false,
                  status: 'disconnected',
                  host,
                  port,
                  database,
                  message: `تعذر الاتصال بـ ${host}:${port} (${err.message})`,
                  timestamp: new Date().toISOString()
                }));
              }
            });

            socket.connect(port, host);
          } catch (err: any) {
            res.statusCode = 200;
            res.end(JSON.stringify({
              connected: false,
              status: 'disconnected',
              message: `صيغة رابط الاتصال غير صحيحة: ${err.message}`,
              timestamp: new Date().toISOString()
            }));
          }
        };

        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const data = JSON.parse(body || '{}');
              handleCheck(data.url);
            } catch {
              handleCheck();
            }
          });
        } else {
          handleCheck();
        }
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), dbHealthPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true as const,
      proxy: {
        '/api/wa-proxy': {
          target: 'https://wa.serv-1001.twins4tech.com',
          changeOrigin: true,
          secure: false,
          rewrite: (p) => p.replace(/^\/api\/wa-proxy/, ''),
        },
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify - file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
