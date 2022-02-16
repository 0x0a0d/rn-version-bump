#!/usr/bin/env node

import {
  androidFindAppBuildGradle, androidWriteVersion,
  findMaxVersion,
  findPackageJson,
  getAndroidVersion,
  getIOSVersion,
  getPackageJsonVersion, increaseVersion,
  iosFindProjectPbxproj, iosWriteVersion, joinVersion,
  RNAppVersion, packageJsonWriteVersion,
} from '../utils'
import { choose } from '../prompts'

const paths = {
  pkg: findPackageJson(),
  ios: iosFindProjectPbxproj(),
  android: androidFindAppBuildGradle(),
}

const versions: Record<'pkg'|'ios'|'android', RNAppVersion> = {
  pkg: getPackageJsonVersion(paths.pkg),
  ios: getIOSVersion(paths.ios),
  android: getAndroidVersion(paths.android),
}

const maxVersion = findMaxVersion(...Object.values(versions))

function printEndLine(total = 1) {
  console.info(`\r\n`.repeat(total))
}

Promise.resolve().then(() => {
  console.info(`Current version:
package.json ${joinVersion(versions.pkg)}
ios          ${joinVersion(versions.ios)}
android      ${joinVersion(versions.android)}`)
  printEndLine()

  return choose(
    'Increase version type:',
    [
      {value: 'prerelease', title: `prerelease (${joinVersion(maxVersion)} => ${joinVersion(increaseVersion(maxVersion, 'prerelease'))})`},
      {value: 'patch', title:      `patch      (${joinVersion(maxVersion)} => ${joinVersion(increaseVersion(maxVersion, 'patch'))})`},
      {value: 'minor', title:      `minor      (${joinVersion(maxVersion)} => ${joinVersion(increaseVersion(maxVersion, 'minor'))})`},
      {value: 'major', title:      `major      (${joinVersion(maxVersion)} => ${joinVersion(increaseVersion(maxVersion, 'major'))})`},
    ]
  )
}).then(answer => {
  return increaseVersion(maxVersion, answer)
}).then(version => {
  iosWriteVersion(paths.ios, version)
  androidWriteVersion(paths.android, version)
  packageJsonWriteVersion(paths.pkg, version)
}).then(() => {
  const currentVersion: Record<'pkg'|'ios'|'android', RNAppVersion> = {
    pkg: getPackageJsonVersion(paths.pkg),
    ios: getIOSVersion(paths.ios),
    android: getAndroidVersion(paths.android),
  }

  printEndLine(1)
  console.info(`Current version (NEW):
package.json ${joinVersion(currentVersion.pkg)}
ios          ${joinVersion(currentVersion.ios)}
android      ${joinVersion(currentVersion.android)}`)

  printEndLine(1)
  console.info('Done!!!')
})
