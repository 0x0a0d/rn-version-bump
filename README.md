#rn-version-bump

bump react native version

> npx rn-version-bump

# How this works

+ First read current versions of `ios/[Project].xcodeproj/project.pbxproj`, `android/app/build.gradle`, `package.json`
+ Find max version of them
+ Increase version by: `prerelease` (ios's `buildnumber`), `patch`, `minor`, `major`
+ Write new version back
