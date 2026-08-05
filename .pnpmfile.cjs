/**
 * markuplint's JSX parser depends on @typescript-eslint/typescript-estree, and
 * cosmiconfig loads `*.config.ts` via `typescript.transpileModule`. Both still
 * need the classic TypeScript 5 API, while this repo uses TypeScript 7 (whose
 * default export is version metadata only).
 *
 * Convert the typescript peer into a direct dependency on 5.9.3 so pnpm does
 * not satisfy it with the workspace TypeScript 7.
 */
function readPackage(pkg) {
  const needsClassicTypescript = new Set([
    '@typescript-eslint/project-service',
    '@typescript-eslint/tsconfig-utils',
    '@typescript-eslint/typescript-estree',
    'cosmiconfig',
    'ts-api-utils'
  ])

  if (!needsClassicTypescript.has(pkg.name)) {
    return pkg
  }

  pkg.dependencies = {
    ...pkg.dependencies,
    typescript: '5.9.3'
  }

  if (pkg.peerDependencies) {
    delete pkg.peerDependencies.typescript
  }

  if (pkg.peerDependenciesMeta) {
    delete pkg.peerDependenciesMeta.typescript
  }

  return pkg
}

module.exports = {
  hooks: {
    readPackage
  }
}
