import React from 'react';

type MockProps = {
  children?: React.ReactNode;
  [key: string]: unknown;
};

function createMockComponent(name: string): React.ComponentType<MockProps> {
  return function MockComponent(props: MockProps): React.JSX.Element {
    return React.createElement(name, props, props.children);
  };
}

export const ViroARScene = createMockComponent('ViroARScene');
export const ViroAmbientLight = createMockComponent('ViroAmbientLight');
export const ViroPolyline = createMockComponent('ViroPolyline');
export const ViroSphere = createMockComponent('ViroSphere');
