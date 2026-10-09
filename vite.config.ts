import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import net from 'net';
import {defineConfig, Plugin} from 'vite';

function suppressHmrWsPlugin(): Plugin {
  return {
    name: 'suppress-hmr-ws-plugin',
    enforce: 'post',
    transform(code, id) {
      if (id.includes('@vite/client') || id.includes('vite/dist/client/client.mjs')) {
        return code
          .replace(
            'transport.connect(createHMRHandler(handleMessage));',
            'transport.connect(createHMRHandler(handleMessage)).catch(() => {});'
          )
          .replace(
            'reject(new Error("WebSocket closed without opened."));',
            'resolve();'
          );
      }
    },
  };
}

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
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'twins_logo.png', 'twins4tech.svg'],
        manifest: {
          id: '/',
          name: 'Twins Lift Manager',
          short_name: 'Twins Lifts',
          description: 'Calculate elevator quotations, manage maintenance visits, log offline inspections with SBC 801 checklist, and GPS field attendance.',
          theme_color: '#0B1E3B',
          background_color: '#0B1E3B',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
          shortcuts: [
            {
              name: 'تسجيل حضور GPS',
              short_name: 'حضور GPS',
              description: 'تسجيل حضور فني الصيانة في الموقع الجغرافي',
              url: '/?action=gps-attendance',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }],
            },
            {
              name: 'بلاغ عطل وطوارئ',
              short_name: 'بلاغ عطل',
              description: 'تسجيل بلاغ عطل فوري في المصعد',
              url: '/?action=new-breakdown',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }],
            },
            {
              name: 'بوابة الفني الميداني',
              short_name: 'بوابة الفني',
              description: 'فتح بوابة الفني لمتابعة الزيارات وبلاغات الطوارئ',
              url: '/?action=technician-portal',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }],
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
      dbHealthPlugin(),
      suppressHmrWsPlugin()
    ],
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
