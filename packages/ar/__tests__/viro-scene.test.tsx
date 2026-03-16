import React from 'react';
import renderer from 'react-test-renderer';
import { SunArcARScene } from '../src/viro-scene';

// Mock ViroReact
jest.mock('@reactvision/react-viro', () => {
  const React = require('react');
  return {
    ViroARScene: ({ children }: any) => React.createElement('ViroARScene', null, children),
    ViroPolyline: ({ points, position, thickness, materials }: any) => 
      React.createElement('ViroPolyline', { points, position, thickness, materials }),
    ViroMaterials: {
      createMaterials: jest.fn()
    }
  };
}, { virtual: true });

describe('SunArcARScene', () => {
  it('renders without crashing', () => {
    const mockPoints = [
      { x: 0, y: 10, z: -50, azimuth: 0, altitude: 45, date: new Date(), phase: 'day' },
      { x: 10, y: 20, z: -40, azimuth: 10, altitude: 50, date: new Date(), phase: 'day' }
    ];

    const component = renderer.create(
      <SunArcARScene
        arcPoints={mockPoints}
        currentSunIndex={0}
        showPhaseColors={false}
        showBlockedSegments={false}
      />
    );

    expect(component.toJSON()).toBeTruthy();
  });
});
