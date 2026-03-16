/**
 * @module @sunscope/ar/__mocks__/react-viro
 * @description Jest mock for ViroReact
 */

import React from 'react';

// Mock all ViroReact components
export const ViroARScene = (props: any) => React.createElement('ViroARScene', props);
export const ViroARSceneNavigator = (props: any) => React.createElement('ViroARSceneNavigator', props);
export const ViroPolyline = (props: any) => React.createElement('ViroPolyline', props);
export const ViroSphere = (props: any) => React.createElement('ViroSphere', props);
export const ViroText = (props: any) => React.createElement('ViroText', props);
export const ViroNode = (props: any) => React.createElement('ViroNode', props);
export const ViroCamera = (props: any) => React.createElement('ViroCamera', props);
export const ViroAmbientLight = (props: any) => React.createElement('ViroAmbientLight', props);
export const ViroDirectionalLight = (props: any) => React.createElement('ViroDirectionalLight', props);
export const ViroMaterials = {
  createMaterials: (materials: any) => materials,
};
export const ViroAnimations = {
  registerAnimations: (animations: any) => animations,
};

// Constants
export const ViroConstants = {
  VIRO_PLATFORM_IOS: 'ios',
  VIRO_PLATFORM_ANDROID: 'android',
};

// AR tracking states
export const ViroARTrackingTargets = {
  addTarget: () => {},
};

export const ViroARImageMarker = (props: any) => React.createElement('ViroARImageMarker', props);
