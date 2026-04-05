import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '..', '')
    const bePort = env.BE_PORT || '8080'
    const fePort = env.FE_PORT || '5173'

    return {
        plugins: [react()],
        resolve: {
            tsconfigPaths: true,
        },
        define: {
            FEATURE_FLAG_ENABLED: process.env.FEATURE_FLAG === 'true',
        },
        build: {
            outDir: '../backend/src/main/resources/static',
            emptyOutDir: true,
        },
        server: {
            port: Number(fePort),
            proxy: {
                '/api': `http://localhost:${bePort}`,
            },
        },
    }
})
