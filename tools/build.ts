// tslint:disable no-console

import * as fs from 'fs'
import * as path from 'path'
import * as readdir from 'readdir-enhanced'
import * as util from 'util'
import * as sh from 'shelljs'
import * as packageJson from '../package.json'
import * as regexpEscape from 'escape-string-regexp'

const fsReadfile = util.promisify(fs.readFile)
const fsWritefile = util.promisify(fs.writeFile)

if (require.main === module) {
  run(main)
}

export async function main() {
  const src = path.resolve(process.cwd(), `src`)
  const lib = path.resolve(process.cwd(), `lib`)
  const es = path.resolve(process.cwd(), `es`)

  sh.rm('-rf', lib)
  exec(`tsc --pretty -p ${src}/tsconfig.json`)

  await transform(lib)

  sh.rm('-rf', es)
  exec(`tsc --pretty -p ${src}/tsconfig.es.json`)

  await transform(es)
}

async function transform(root: string) {
  const files = await readdir.async(root, { deep: true, filter: stats => stats.isFile() })

  const variables = getVariables()

  await Promise.all(
    files.map(async file => {
      const filepath = path.join(root, file)
      const buffer = await fsReadfile(filepath)
      const source = buffer.toString()
      let code = source

      // 替换全局变量
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`\\b${regexpEscape(key)}\\b`, 'g')
        code = code.replace(regex, value)
      }

      if (source === code) return

      await fsWritefile(filepath, code)
    }),
  )
}

function getVariables() {
  return {
    __VERSION__: packageJson.version,
  }
}

function exec(command: string) {
  const { code, stderr, stdout } = sh.exec(command)
  if (code !== 0) throw stderr
  return stdout
}

async function run(fn: Function) {
  try {
    await fn()
    process.exit(0)
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
}
