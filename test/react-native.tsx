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

export const View = createComponent('View');
export const Text = createComponent('Text');
export const ScrollView = createComponent('ScrollView');
export const SafeAreaView = createComponent('SafeAreaView');
export const Pressable = createComponent('Pressable');
export const Modal = createComponent('Modal');
export const TextInput = createComponent('TextInput');

export const StyleSheet = {
  create<T extends Record<string, unknown>>(styles: T): T {
    return styles;
  }
};

export const Platform = {
  OS: 'web',
  select<T>(options: { default?: T; web?: T }): T | undefined {
    return options.web ?? options.default;
  }
};

export const PanResponder = {
  create(): { panHandlers: Record<string, never> } {
    return { panHandlers: {} };
  }
};

export function useWindowDimensions(): {
  width: number;
  height: number;
  scale: number;
  fontScale: number;
} {
  return {
    width: 390,
    height: 844,
    scale: 1,
    fontScale: 1
  };
}
