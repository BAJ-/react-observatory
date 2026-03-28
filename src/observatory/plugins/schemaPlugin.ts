import { createGenerator } from 'ts-json-schema-generator'
import { resolve } from 'node:path'
import { readFileSync } from 'node:fs'
import type { Plugin } from 'vite'

function findPropsTypeName(filePath: string): string | undefined {
  const source = readFileSync(filePath, 'utf-8')

  // Find the type used in the component's parameter: ({ ... }: TypeName) or (props: TypeName)
  const paramMatch = source.match(
    /\}\s*:\s*(\w+)\s*\)|\(\s*\w+\s*:\s*(\w+)\s*\)/,
  )
  if (paramMatch) return paramMatch[1] ?? paramMatch[2]

  // Fallback: first interface or type alias in the file
  const fallback = source.match(/(?:interface|type)\s+(\w+)\s*(?:\{|=)/)
  return fallback?.[1]
}

export function schemaPlugin(): Plugin {
  return {
    name: 'observatory-schema',
    configureServer(server) {
      server.middlewares.use('/api/schema', (req, res) => {
        const url = new URL(req.url ?? '/', 'http://localhost')
        const componentPath = url.searchParams.get('component')

        if (!componentPath) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Missing component query param' }))
          return
        }

        const absPath = resolve(process.cwd(), componentPath)

        // Verify the file is inside the project root
        if (!absPath.startsWith(process.cwd())) {
          res.writeHead(403, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Path outside project root' }))
          return
        }

        const typeName = findPropsTypeName(absPath)

        if (!typeName) {
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ schema: null, typeName: null }))
          return
        }

        try {
          const generator = createGenerator({
            path: absPath,
            type: typeName,
            tsconfig: resolve(process.cwd(), 'tsconfig.app.json'),
            skipTypeCheck: true,
            expose: 'all',
          })

          const schema = generator.createSchema(typeName)

          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ schema, typeName }))
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err)
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: message }))
        }
      })
    },
  }
}
