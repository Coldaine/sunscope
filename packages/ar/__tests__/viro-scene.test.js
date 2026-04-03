"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_test_renderer_1 = __importDefault(require("react-test-renderer"));
const viro_scene_1 = require("../src/viro-scene");
// Mock ViroReact
jest.mock('@reactvision/react-viro', () => {
    const React = require('react');
    return {
        ViroARScene: ({ children }) => React.createElement('ViroARScene', null, children),
        ViroPolyline: ({ points, position, thickness, materials }) => React.createElement('ViroPolyline', { points, position, thickness, materials }),
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
        const component = react_test_renderer_1.default.create(react_1.default.createElement(viro_scene_1.SunArcARScene, { arcPoints: mockPoints, currentSunIndex: 0, showPhaseColors: false, showBlockedSegments: false }));
        expect(component.toJSON()).toBeTruthy();
    });
    it('renders empty ViroARScene when arcPoints is empty', () => {
        const component = react_test_renderer_1.default.create(react_1.default.createElement(viro_scene_1.SunArcARScene, { arcPoints: [], currentSunIndex: 0, showPhaseColors: false, showBlockedSegments: false }));
        const tree = component.toJSON();
        expect(tree.type).toBe('ViroARScene');
        // No ViroPolyline children
        expect(tree.children).toBeNull();
    });
    it('renders empty ViroARScene when only 1 point (< 2 needed)', () => {
        const component = react_test_renderer_1.default.create(react_1.default.createElement(viro_scene_1.SunArcARScene, { arcPoints: [{ x: 0, y: 10, z: -50, azimuth: 0, altitude: 45, date: new Date(), phase: 'day' }], currentSunIndex: 0, showPhaseColors: false, showBlockedSegments: false }));
        const tree = component.toJSON();
        expect(tree.type).toBe('ViroARScene');
        expect(tree.children).toBeNull();
    });
    it('renders ViroPolyline with showPhaseColors=true', () => {
        const mockPoints = [
            { x: 0, y: 10, z: -50, azimuth: 0, altitude: 45, date: new Date(), phase: 'golden_hour' },
            { x: 5, y: 15, z: -45, azimuth: 5, altitude: 48, date: new Date(), phase: 'golden_hour' },
            { x: 10, y: 20, z: -40, azimuth: 10, altitude: 50, date: new Date(), phase: 'day' },
            { x: 15, y: 22, z: -35, azimuth: 15, altitude: 52, date: new Date(), phase: 'day' },
        ];
        const component = react_test_renderer_1.default.create(react_1.default.createElement(viro_scene_1.SunArcARScene, { arcPoints: mockPoints, currentSunIndex: 0, showPhaseColors: true, showBlockedSegments: false }));
        const tree = component.toJSON();
        expect(tree.type).toBe('ViroARScene');
        // Should have multiple ViroPolyline children for different phases
        expect(tree.children.length).toBeGreaterThanOrEqual(1);
    });
    it('renders ViroPolyline with showBlockedSegments=true', () => {
        const mockPoints = [
            { x: 0, y: 10, z: -50, azimuth: 0, altitude: 45, date: new Date(), phase: 'day', blocked: true },
            { x: 5, y: 15, z: -45, azimuth: 5, altitude: 48, date: new Date(), phase: 'day', blocked: true },
            { x: 10, y: 20, z: -40, azimuth: 10, altitude: 50, date: new Date(), phase: 'day', blocked: false },
            { x: 15, y: 22, z: -35, azimuth: 15, altitude: 52, date: new Date(), phase: 'day', blocked: false },
        ];
        const component = react_test_renderer_1.default.create(react_1.default.createElement(viro_scene_1.SunArcARScene, { arcPoints: mockPoints, currentSunIndex: 0, showPhaseColors: false, showBlockedSegments: true }));
        const tree = component.toJSON();
        expect(tree.type).toBe('ViroARScene');
        expect(tree.children.length).toBeGreaterThanOrEqual(1);
    });
    it('default (no colors, no blocked) renders single ViroPolyline', () => {
        const mockPoints = [
            { x: 0, y: 10, z: -50, azimuth: 0, altitude: 45, date: new Date(), phase: 'day' },
            { x: 10, y: 20, z: -40, azimuth: 10, altitude: 50, date: new Date(), phase: 'day' },
        ];
        const component = react_test_renderer_1.default.create(react_1.default.createElement(viro_scene_1.SunArcARScene, { arcPoints: mockPoints, currentSunIndex: 0, showPhaseColors: false, showBlockedSegments: false }));
        const tree = component.toJSON();
        expect(tree.type).toBe('ViroARScene');
        // Single polyline child
        expect(tree.children.length).toBe(1);
        expect(tree.children[0].type).toBe('ViroPolyline');
    });
});
