import { join, relative } from 'path'
import {
  androidFindAppBuildGradle, androidWriteVersion, findMaxVersion,
  findPackageJson,
  getAndroidVersion,
  getIOSVersion, getPackageJsonVersion, increaseVersion,
  iosFindProjectPbxproj, iosWriteVersion, packageJsonWriteVersion, parseAndroidVersion, parseIOSVersion, parseVersion,
} from './utils'

process.chdir(join(__dirname, '../test/AppTest'))
const cwd = process.cwd()

describe('utils.ts', function () {
  const appVersion = {
    "major": 2,
    "minor": 0,
    "patch": 4,
    "prerelease": 1
  }

  it('increaseVersion', () => {
    expect(increaseVersion(appVersion, 'prerelease')).toStrictEqual({ "major": 2, "minor": 0, "patch": 4, "prerelease": 2})
    expect(increaseVersion(appVersion, 'patch')).toStrictEqual({ "major": 2, "minor": 0, "patch": 5, "prerelease": 0})
    expect(increaseVersion(appVersion, 'minor')).toStrictEqual({ "major": 2, "minor": 1, "patch": 0, "prerelease": 0})
    expect(increaseVersion(appVersion, 'major')).toStrictEqual({ "major": 3, "minor": 0, "patch": 0, "prerelease": 0})
  })

  describe('android', () => {
    const filePath = androidFindAppBuildGradle(cwd)
    it('androidFindAppBuildGradle', () => {
      expect(relative(cwd, filePath)).toBe('android/app/build.gradle')
    })
    it('getAndroidVersion', () => {
      expect(getAndroidVersion(filePath)).toStrictEqual(appVersion)
    })
    it('writeVersion', () => {
      const nextVersion = increaseVersion(appVersion, 'prerelease')
      const content = androidWriteVersion(filePath, nextVersion, true)
      expect(parseAndroidVersion(content)).toStrictEqual(nextVersion)
    })
  })

  describe('ios', () => {
    const filePath = iosFindProjectPbxproj(cwd)
    it('iosFindProjectPbxproj', () => {
      expect(relative(cwd, filePath)).toBe('ios/AppTest.xcodeproj/project.pbxproj')
    })
    it('getIOSVersion', () => {
      expect(getIOSVersion(filePath)).toStrictEqual(appVersion)
    })
    it('writeVersion', () => {
      const nextVersion = increaseVersion(appVersion, 'prerelease')
      const content = iosWriteVersion(filePath, nextVersion, true)
      expect(parseIOSVersion(content)).toStrictEqual(nextVersion)
    })
  })

  describe('pkg json', () => {
    const filePath = findPackageJson(cwd)
    it('findPackageJson', () => {
      expect(relative(cwd, filePath)).toBe('package.json')
    })
    it('parseVersion', () => {
      expect(parseVersion('2.0.4-1')).toStrictEqual(appVersion)
      expect(parseVersion('2.0.4')).toStrictEqual({...appVersion, prerelease: 0})
      expect(parseVersion('2.0')).toStrictEqual({...appVersion, prerelease: 0, patch: 0})
      expect(parseVersion('0.0')).toStrictEqual({...appVersion, prerelease: 0, patch: 0, major: 0})
    })
    it('getPackageJsonVersion', () => {
      expect(getPackageJsonVersion(filePath)).toStrictEqual(appVersion)
    })
    it('writeVersion', () => {
      const nextVersion = increaseVersion(appVersion, 'prerelease')
      const pkg = packageJsonWriteVersion(filePath, nextVersion, true)
      expect(parseVersion(pkg.version as string)).toStrictEqual(nextVersion)
    })
  })

  it('findMaxVersion', () => {
    expect(findMaxVersion(...[
      parseVersion('1.0.0-1'),
      parseVersion('2.5.3-2'),
      parseVersion('1.0.1-1'),
      parseVersion('1.2.1-2'),
      parseVersion('2.1.3-2'),
      parseVersion('2.4.3-2'),
    ])).toStrictEqual(parseVersion('2.5.3-2'))
  })
})
