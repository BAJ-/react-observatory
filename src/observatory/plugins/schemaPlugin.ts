import ts from 'typescript'
import { resolve } from 'node:path'
import type { Plugin } from 'vite'

export interface PropInfo {
  name: string
  type:
    | 'string'
    | 'number'
    | 'boolean'
    | 'function'
    | 'enum'
    | 'array'
    | 'object'
    | 'unknown'
  required: boolean
  enumValues?: string[]
}

function extractProps(filePath: string, tsconfigPath: string): PropInfo[] {
  const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile)
  const parsedConfig = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    resolve(tsconfigPath, '..'),
  )

  const program = ts.createProgram([filePath], parsedConfig.options)
  const checker = program.getTypeChecker()
  const sourceFile = program.getSourceFile(filePath)

  if (!sourceFile) return []

  const props: PropInfo[] = []

  ts.forEachChild(sourceFile, (node) => {
    // Find exported function declarations or variable declarations
    let funcType: ts.Type | undefined

    if (
      ts.isFunctionDeclaration(node) &&
      node.name &&
      hasExportModifier(node)
    ) {
      funcType = checker.getTypeAtLocation(node)
    } else if (ts.isVariableStatement(node) && hasExportModifier(node)) {
      const decl = node.declarationList.declarations[0]
      if (decl) {
        funcType = checker.getTypeAtLocation(decl)
      }
    } else if (ts.isExportAssignment(node)) {
      funcType = checker.getTypeAtLocation(node.expression)
    }

    if (!funcType || props.length > 0) return

    const callSignatures = funcType.getCallSignatures()
    if (callSignatures.length === 0) return

    // React components have a single call signature: (props) => JSX
    const firstParam = callSignatures[0].getParameters()[0]
    if (!firstParam) return

    const paramType = checker.getTypeOfSymbol(firstParam)
    for (const prop of paramType.getProperties()) {
      props.push(symbolToPropInfo(prop, checker))
    }
  })

  return props
}

function hasExportModifier(node: ts.Node): boolean {
  const modifiers = ts.canHaveModifiers(node)
    ? ts.getModifiers(node)
    : undefined
  return modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) ?? false
}

function symbolToPropInfo(
  symbol: ts.Symbol,
  checker: ts.TypeChecker,
): PropInfo {
  const rawType = checker.getTypeOfSymbol(symbol)
  const required = !(symbol.flags & ts.SymbolFlags.Optional)

  // Optional props have type `T | undefined`. Strip undefined so we can
  // classify the base type (e.g. boolean, not unknown). Optionality itself
  // is tracked by the `required` flag above.
  const type = rawType.isUnion() ? checker.getNonNullableType(rawType) : rawType

  if (type.getCallSignatures().length > 0) {
    return { name: symbol.name, type: 'function', required }
  }

  if (type.isUnion()) {
    const types = type.types
    const allLiterals = types.every((t) => t.isStringLiteral())
    if (allLiterals) {
      return {
        name: symbol.name,
        type: 'enum',
        required,
        enumValues: types.map((t) => (t as ts.StringLiteralType).value),
      }
    }
  }

  if (type.flags & ts.TypeFlags.String) {
    return { name: symbol.name, type: 'string', required }
  }
  if (type.flags & ts.TypeFlags.Number) {
    return { name: symbol.name, type: 'number', required }
  }
  if (
    type.flags & ts.TypeFlags.Boolean ||
    type.flags & ts.TypeFlags.BooleanLiteral
  ) {
    return { name: symbol.name, type: 'boolean', required }
  }
  if (checker.isArrayType(type)) {
    return { name: symbol.name, type: 'array', required }
  }
  if (type.flags & ts.TypeFlags.Object) {
    return { name: symbol.name, type: 'object', required }
  }

  return { name: symbol.name, type: 'unknown', required }
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

        try {
          const tsconfigPath = resolve(process.cwd(), 'tsconfig.app.json')
          const props = extractProps(absPath, tsconfigPath)

          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ props }))
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err)
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: message }))
        }
      })
    },
  }
}
