// Vite 설정. /api는 개발 서버에서 Express(3000)로 프록시해 배포 시와 동일하게 same-origin으로 취급
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@shared": path.resolve(dirname, "../shared"),
    },
  },
  server: {
    fs: {
      allow: [".."],
    },
    watch: {
      // Docker(특히 Windows 호스트의 bind mount)는 inotify 이벤트가 컨테이너까지 전달되지 않아
      // 파일 내용은 최신인데 vite가 변경을 못 감지해 HMR이 죽는다. polling으로 우회한다.
      usePolling: process.env.VITE_WATCH_POLL === "true",
    },
    proxy: {
      "/api": {
        // Docker 컨테이너 안에서는 localhost가 client 컨테이너 자신이라 server로 못 간다.
        // docker-compose.yml의 client 서비스가 이 값을 http://server:3000으로 넘긴다.
        target: process.env.VITE_API_PROXY_TARGET ?? "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
