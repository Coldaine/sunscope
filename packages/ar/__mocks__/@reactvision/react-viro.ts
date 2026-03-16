// Mock implementation for Jest
const React = require('react');

module.exports = {
  ViroARScene: ({ children }: any) => React.createElement('ViroARScene', null, children),
  ViroPolyline: ({ points, position, thickness, materials }: any) => 
    React.createElement('ViroPolyline', { points, position, thickness, materials }),
  ViroMaterials: {
    createMaterials: jest.fn()
  }
};
