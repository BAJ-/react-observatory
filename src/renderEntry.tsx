import { StrictMode, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { ComponentRenderer } from '@/ui/ComponentRenderer'

const root = createRoot(document.getElementById('root')!)
root.render(createElement(StrictMode, null, createElement(ComponentRenderer)))
