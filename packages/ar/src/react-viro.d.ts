declare module '@reactvision/react-viro' {
  import React from 'react';

  export interface ViroComponentProps {
    children?: React.ReactNode;
    [key: string]: unknown;
  }

  export const ViroARScene: React.ComponentType<ViroComponentProps>;
  export const ViroAmbientLight: React.ComponentType<ViroComponentProps>;
  export const ViroPolyline: React.ComponentType<ViroComponentProps>;
  export const ViroSphere: React.ComponentType<ViroComponentProps>;
}
