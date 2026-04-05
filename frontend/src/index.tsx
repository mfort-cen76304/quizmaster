import React from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '#fe/app.tsx'

const root = document.getElementById('root')

if (root) {
    const reactRoot = createRoot(root)
    reactRoot.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>,
    )
}
