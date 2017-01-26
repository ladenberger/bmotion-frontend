# BMotionWeb Frontend

[![Build Status](https://travis-ci.org/ladenberger/bmotion-frontend.svg?branch=develop)](https://travis-ci.org/ladenberger/bmotion-frontend)
[![Built with Grunt](https://cdn.gruntjs.com/builtwith.png)](http://gruntjs.com/)

## Build

Run the following command for building BMotionWeb standalone application, where xxx is the target platform:

```
gradle clean standalone_xxx
```

The following values are allowed for xxx: linux-x64, linux-ia32, darwin-x64, win32-ia32, win32-x64.

Or just run the following command for building for all platforms:

```
gradle clean standalone_all
```

The build script will produce a zip for all platforms. The zip files are located in the build/dist folder.

## Development

Run the following commmand to setup the development environment:

```
gradle setupdev
```

In order to start BMotionWeb from the source files run the following command:

```
gradle startdev
```

## No Gradle installed?

If you don't have gradle installed, you can use the gradlew script provided. For instance, use

```
./gradlew clean standalone_linux-x64
```

to build for linux x64.

This should build the application without a gradle installation on your computer.
