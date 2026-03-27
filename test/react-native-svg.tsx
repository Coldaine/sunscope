import React from 'react';

type MockProps = {
  children?: React.ReactNode;
  [key: string]: unknown;
};

function createComponent(name: string): React.ComponentType<MockProps> {
  return function MockComponent(props: MockProps): React.JSX.Element {
    return React.createElement(name, props, props.children);
  };
}

const Svg = createComponent('Svg');
export default Svg;
export const Path = createComponent('Path');
export const Circle = createComponent('Circle');
export const Line = createComponent('Line');
export const G = createComponent('G');
export const Rect = createComponent('Rect');
export const Text = createComponent('SvgText');
