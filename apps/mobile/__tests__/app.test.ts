/**
 * @module @sunscope/mobile/__tests__/app
 * @description Structural tests for mobile app configuration and dependencies.
 *
 * Note: React Native testing requires special setup with jest-expo.
 * These tests validate configuration, JSON structure, and workspace package imports
 * without importing any RN components.
 */

import * as fs from 'fs';
import * as path from 'path';

const appRoot = path.resolve(__dirname, '..');

describe('Mobile App — environment', () => {
  it('should have NODE_ENV defined', () => {
    expect(process.env.NODE_ENV).toBeDefined();
  });
});

describe('Mobile App — app.json structure', () => {
  let appJson: any;

  beforeAll(() => {
    appJson = JSON.parse(fs.readFileSync(path.join(appRoot, 'app.json'), 'utf-8'));
  });

  it('has expo key at root', () => {
    expect(appJson).toHaveProperty('expo');
  });

  it('app name is SunScope', () => {
    expect(appJson.expo.name).toBe('SunScope');
  });

  it('slug is sunscope', () => {
    expect(appJson.expo.slug).toBe('sunscope');
  });

  it('orientation is portrait', () => {
    expect(appJson.expo.orientation).toBe('portrait');
  });

  it('userInterfaceStyle is dark', () => {
    expect(appJson.expo.userInterfaceStyle).toBe('dark');
  });

  it('iOS config has bundleIdentifier', () => {
    expect(appJson.expo.ios.bundleIdentifier).toBe('xyz.moosegoose.sunscope');
  });

  it('iOS infoPlist has location usage description', () => {
    expect(appJson.expo.ios.infoPlist.NSLocationWhenInUseUsageDescription).toBeTruthy();
  });

  it('iOS infoPlist has camera usage description', () => {
    expect(appJson.expo.ios.infoPlist.NSCameraUsageDescription).toBeTruthy();
  });

  it('android config has package', () => {
    expect(appJson.expo.android.package).toBe('xyz.moosegoose.sunscope');
  });
});

describe('Mobile App — package.json dependencies', () => {
  let pkgJson: any;

  beforeAll(() => {
    pkgJson = JSON.parse(fs.readFileSync(path.join(appRoot, 'package.json'), 'utf-8'));
  });

  it('depends on all workspace packages', () => {
    const deps = pkgJson.dependencies;
    expect(deps['@sunscope/core']).toBe('workspace:*');
    expect(deps['@sunscope/ui']).toBe('workspace:*');
    expect(deps['@sunscope/ar']).toBe('workspace:*');
    expect(deps['@sunscope/sky-detection']).toBe('workspace:*');
  });

  it('depends on expo', () => {
    expect(pkgJson.dependencies.expo).toBeDefined();
  });

  it('depends on react and react-native', () => {
    expect(pkgJson.dependencies.react).toBeDefined();
    expect(pkgJson.dependencies['react-native']).toBeDefined();
  });

  it('has test script', () => {
    expect(pkgJson.scripts.test).toBe('jest');
  });
});

describe('Mobile App — workspace package imports', () => {
  it('@sunscope/core is importable and exports key functions', () => {
    const core = require('@sunscope/core');
    expect(core.getSunPosition).toBeDefined();
    expect(core.getSunTimes).toBeDefined();
    expect(core.computeShadow).toBeDefined();
    expect(core.sampleSunDay).toBeDefined();
    expect(core.validateLocation).toBeDefined();
  });

  it('@sunscope/sky-detection is importable and exports key functions', () => {
    const sky = require('@sunscope/sky-detection');
    expect(sky.createEmptySkyMask).toBeDefined();
    expect(sky.integrateSunHours).toBeDefined();
    expect(sky.stitchFrame).toBeDefined();
  });
});
