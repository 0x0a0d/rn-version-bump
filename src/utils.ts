import fs from 'fs'
import path from 'path'
import assert from 'assert'

export const LIMIT_SIZE = 2

export type RNAppVersion = {
  major: number,
  minor: number,
  patch: number,
  prerelease: number,
}
export type TypeOfArray<T> = T extends (infer U)[] ? U : T;

export function androidFindAppBuildGradle(findingPath = process.cwd()): string {
  const files = fs.readdirSync(findingPath)

  if (files.includes('build.gradle') && findingPath.endsWith(`${path.sep}app`)) {
    return path.join(findingPath, 'build.gradle')
  }

  if (files.includes('android')) {
    const androidPath = path.join(findingPath, 'android')
    try {
      if (fs.statSync(androidPath).isDirectory()) {
        return androidFindAppBuildGradle(androidPath)
      }
    } catch (e) {}
  }

  if (files.includes('app') && findingPath.endsWith(`${path.sep}android`)) {
    const appPath = path.join(findingPath, 'app')
    try {
      if (fs.statSync(appPath).isDirectory()) {
        return androidFindAppBuildGradle(appPath)
      }
    } catch (e) {}
  }

  if (findingPath === path.resolve('/')) throw new Error(`Path not found`)
  return androidFindAppBuildGradle(path.join(findingPath, '../'))
}

export function parseAndroidVersion(buildGradle: string): RNAppVersion {
  const versionCodeMatch = buildGradle.match(/^\s*versionCode\s+(\d+)/m)
  if (versionCodeMatch == null) throw new Error('get versionCode failed')

  const versionNameMatch = buildGradle.match(/\s*versionName\s+"([^"]+)"/m)
  if (versionNameMatch == null) throw new Error('get versionName failed')

  try {
    const [prerelease, patch, minor, major] = versionCodeMatch[1]
      .split('')
      .reverse()
      .join('')
      .match(new RegExp(`\\d\{1,${LIMIT_SIZE}\}`, 'g'))
      .map(str => Number(str.split('').reverse().join('').replace(/^0+/, '')))

    return {
      prerelease, major, minor, patch,
    }
  } catch (e) {}

  const [major, minor, patch] = versionNameMatch[1]
    .replace(/^\D+|\D+$/g, '')
    .split(/\D+/)
    .map(str => Number(str))
  return {
    major, minor, patch, prerelease: 0
  }
}

export function getAndroidVersion(buildGradlePath: string): RNAppVersion {
  const buildGradle = fs.readFileSync(buildGradlePath, { encoding: 'utf-8' })

  return parseAndroidVersion(buildGradle)
}

export function androidWriteVersion(buildGradlePath: string, version: RNAppVersion, dry?: false): void
export function androidWriteVersion(buildGradlePath: string, version: RNAppVersion, dry: true): string
export function androidWriteVersion(buildGradlePath: string, version: RNAppVersion, dry?: boolean): void | string {
  const content = fs.readFileSync(buildGradlePath, {encoding: 'utf-8'})
  const versionCode = [
    version.major.toString().padStart(LIMIT_SIZE, '0'),
    version.minor.toString().padStart(LIMIT_SIZE, '0'),
    version.patch.toString().padStart(LIMIT_SIZE, '0'),
    version.prerelease.toString().padStart(LIMIT_SIZE, '0'),
  ].join('').replace(/^0/, '')

  const newContent = content
    .replace(/(\n\s*)versionCode\s+[^\r\n]+/g, (m, m0) => `${m0}versionCode ${versionCode}`)
    .replace(/(\n\s*)versionName\s+"[^"]+"/g, (m, m0) => `${m0}versionName "${joinVersion(version, false)}"`)
  if (dry) {
    return newContent
  }
  fs.writeFileSync(buildGradlePath, newContent)
}

export function iosFindProjectPbxproj(findingPath = process.cwd()): string {
  const files = fs.readdirSync(findingPath)

  if (files.includes('project.pbxproj')) {
    return path.join(findingPath, 'project.pbxproj')
  }

  if (files.includes('ios')) {
    const iosPath = path.join(findingPath, 'ios')
    try {
      if (fs.statSync(iosPath).isDirectory()) {
        for (const file of fs.readdirSync(iosPath)) {
          if (!file.endsWith('.xcodeproj')) continue
          const xcodeProjPath = path.join(iosPath, file)
          try {
            if (fs.statSync(xcodeProjPath).isDirectory()) return iosFindProjectPbxproj(xcodeProjPath)
          } catch (e) { }
        }
      }
    } catch (e) {}
  }

  for (const file of files) {
    if (!file.endsWith('.xcodeproj')) continue
    const xcodeProjPath = path.join(findingPath, file)
    try {
      if (fs.statSync(xcodeProjPath).isDirectory()) return iosFindProjectPbxproj(xcodeProjPath)
    } catch (e) { }
  }

  if (findingPath === path.resolve('/')) throw new Error(`Path not found`)
  return iosFindProjectPbxproj(path.join(findingPath, '../'))
}

export function parseIOSVersion(pbxproj: string): RNAppVersion {
  const prereleaseMatch = pbxproj.match(/CURRENT_PROJECT_VERSION\s*=\s*([^;]+);/)
  if (prereleaseMatch == null) throw new Error('get prereleaseMatch failed')

  const versionNameMatch = pbxproj.match(/MARKETING_VERSION\s*=\s*([^;]+);/)
  if (versionNameMatch == null) throw new Error('get versionName failed')

  const [major, minor, patch] = versionNameMatch[1].split('.').map(str => Number(str))
  return {
    prerelease: Number(prereleaseMatch[1]), major, minor, patch
  }
}

export function getIOSVersion(pbxprojPath: string): RNAppVersion {
  const pbxproj = fs.readFileSync(pbxprojPath, { encoding: 'utf-8' })

  return parseIOSVersion(pbxproj)
}

export function iosWriteVersion(pbxprojPath: string, version: RNAppVersion, dry?: false): void
export function iosWriteVersion(pbxprojPath: string, version: RNAppVersion, dry: true): string
export function iosWriteVersion(pbxprojPath: string, version: RNAppVersion, dry?: boolean): void | string {
  const pbx = fs.readFileSync(pbxprojPath, {encoding: 'utf-8'})
  const newPbx = pbx
    .replace(/CURRENT_PROJECT_VERSION\s*=[^;]+;/g, `CURRENT_PROJECT_VERSION = ${version.prerelease};`)
    .replace(/MARKETING_VERSION\s*=[^;]+;/g, `MARKETING_VERSION = ${joinVersion(version, false)};`)

  if (dry) return newPbx
  fs.writeFileSync(pbxprojPath, newPbx)
}

export function findPackageJson(findingPath = process.cwd()): string {
  const files = fs.readdirSync(findingPath)

  if (files.includes('package.json')) {
    return path.join(findingPath, 'package.json')
  }

  if (findingPath === path.resolve('/')) throw new Error(`Path not found`)
  return findPackageJson(path.join(findingPath, '../'))
}

export function joinVersion(version: RNAppVersion, withBuildnumber = true): string {
  return withBuildnumber
    ?`${version.major}.${version.minor}.${version.patch}-${version.prerelease}`
    :`${version.major}.${version.minor}.${version.patch}`
}

export function parseVersion(version: string): RNAppVersion {
  assert(typeof version === 'string', `input version must be a string`)

  const [major, minor, patch, prerelease]  = version
    .replace(/^\D+|\D+$/g,'')
    .split(/\D+/)

  return {
    prerelease: prerelease == null ? 0 : Number(prerelease),
    major: major == null ? 0 : Number(major),
    minor: minor == null ? 0 : Number(minor),
    patch: patch == null ? 0 : Number(patch),
  }
}

export function getPackageJsonVersion(pkgJsonPath: string): RNAppVersion {
  const pkg = require(pkgJsonPath)

  return parseVersion(pkg.version)
}

export function packageJsonWriteVersion(pkgJsonPath: string, version: RNAppVersion, dry?: false): void
export function packageJsonWriteVersion(pkgJsonPath: string, version: RNAppVersion, dry: true): Record<string, string|object>
export function packageJsonWriteVersion(pkgJsonPath: string, version: RNAppVersion, dry?: boolean): void | Record<string, string|object> {
  const pkg = require(pkgJsonPath)
  pkg.version = joinVersion(version)

  if (dry) return pkg

  fs.writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, 2))
}

export function findMaxVersion(...versions: RNAppVersion[]) {
  const compareFields: (keyof RNAppVersion)[] = ['major', 'minor', 'patch', 'prerelease']
  let maxIndex = 0

  for (let i = 1; i < versions.length; i++) {
    if (compareFields.some(field => versions[maxIndex][field] < versions[i][field])) {
      maxIndex = i
    }
  }
  return versions[maxIndex]
}

export type RNAppVersionLevel =
  | 'major'
  | 'minor'
  | 'patch'
  | 'prerelease'
export function increaseVersion(version: RNAppVersion, level: RNAppVersionLevel): RNAppVersion {
  if (version[level] >= (Math.pow(10, LIMIT_SIZE) - 1)) throw new Error(`${level} cannot greater than ${Math.pow(10, LIMIT_SIZE) - 1}. Now is ${version[level]}`)

  const newVersion = {...version}
  switch (level) {
    case 'prerelease':
      newVersion.prerelease++
      break
    case 'patch':
      newVersion.patch++
      newVersion.prerelease = 0
      break
    case 'minor':
      newVersion.minor++
      newVersion.patch = 0
      newVersion.prerelease = 0
      break
    case 'major':
      newVersion.major++
      newVersion.minor = 0
      newVersion.patch = 0
      newVersion.prerelease = 0
      break
  }

  return newVersion
}
