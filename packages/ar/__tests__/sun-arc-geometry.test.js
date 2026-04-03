"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sun_arc_geometry_1 = require("../src/sun-arc-geometry");
describe('Sun Arc Geometry', () => {
    it('should compute valid 3D points for given samples', () => {
        const samples = [
            { date: new Date('2026-06-20T12:00:00Z'), azimuth: 180, altitude: 45, phase: 'day' },
            { date: new Date('2026-06-20T06:00:00Z'), azimuth: 90, altitude: 0, phase: 'sunrise' },
            { date: new Date('2026-06-20T18:00:00Z'), azimuth: 270, altitude: 0, phase: 'sunset' },
            { date: new Date('2026-06-20T00:00:00Z'), azimuth: 0, altitude: -10, phase: 'night' }, // Should be filtered
        ];
        const points = (0, sun_arc_geometry_1.computeArcPoints)(samples, 50);
        // One point filtered out due to altitude <= -5
        expect(points.length).toBe(3);
        // solar noon (azimuth 180, altitude 45) -> south
        const noon = points[0];
        expect(noon.y).toBeGreaterThan(0);
        expect(noon.z).toBeCloseTo(50 * Math.cos(Math.PI / 4)); // south is +z or -z? Wait, -z is north, so southis +z
        expect(noon.x).toBeCloseTo(0);
        // sunrise (azimuth 90) -> east (+x)
        const sunrise = points[1];
        expect(sunrise.x).toBeCloseTo(50);
        expect(sunrise.z).toBeCloseTo(0);
        expect(sunrise.y).toBeCloseTo(0);
        // sunset (azimuth 270) -> west (-x)
        const sunset = points[2];
        expect(sunset.x).toBeCloseTo(-50);
        expect(sunset.z).toBeCloseTo(0);
        expect(sunset.y).toBeCloseTo(0);
    });
    it('should map blocked segments to points when sunHours provided', () => {
        const samples = [
            { date: new Date('2026-06-20T10:00:00Z'), azimuth: 135, altitude: 30, phase: 'day' }, // blocked
            { date: new Date('2026-06-20T14:00:00Z'), azimuth: 225, altitude: 30, phase: 'day' }, // unblocked
        ];
        const sunHours = {
            totalHours: 4,
            segments: [
                { startTime: new Date('2026-06-20T09:00:00Z'), endTime: new Date('2026-06-20T11:00:00Z'), blocked: true, obstruction: 'Building' },
                { startTime: new Date('2026-06-20T13:00:00Z'), endTime: new Date('2026-06-20T15:00:00Z'), blocked: false, obstruction: null },
            ]
        };
        const points = (0, sun_arc_geometry_1.computeArcPoints)(samples, 50, sunHours);
        expect(points[0].blocked).toBe(true);
        expect(points[1].blocked).toBe(false);
    });
    it('empty samples array → empty points', () => {
        const points = (0, sun_arc_geometry_1.computeArcPoints)([], 50);
        expect(points.length).toBe(0);
    });
    it('all samples below -5° → empty points', () => {
        const samples = [
            { date: new Date('2026-06-20T00:00:00Z'), azimuth: 0, altitude: -10, phase: 'night' },
            { date: new Date('2026-06-20T01:00:00Z'), azimuth: 0, altitude: -20, phase: 'night' },
            { date: new Date('2026-06-20T02:00:00Z'), azimuth: 0, altitude: -6, phase: 'night' },
        ];
        const points = (0, sun_arc_geometry_1.computeArcPoints)(samples, 50);
        expect(points.length).toBe(0);
    });
    it('altitude exactly -5° is filtered out (altitude <= -5)', () => {
        const samples = [
            { date: new Date('2026-06-20T00:00:00Z'), azimuth: 0, altitude: -5, phase: 'night' },
        ];
        const points = (0, sun_arc_geometry_1.computeArcPoints)(samples, 50);
        expect(points.length).toBe(0);
    });
    it('altitude -4.9° is NOT filtered (above -5)', () => {
        const samples = [
            { date: new Date('2026-06-20T00:00:00Z'), azimuth: 0, altitude: -4.9, phase: 'civil_twilight' },
        ];
        const points = (0, sun_arc_geometry_1.computeArcPoints)(samples, 50);
        expect(points.length).toBe(1);
    });
    it('without sunHours, blocked is undefined on all points', () => {
        const samples = [
            { date: new Date('2026-06-20T12:00:00Z'), azimuth: 180, altitude: 45, phase: 'day' },
        ];
        const points = (0, sun_arc_geometry_1.computeArcPoints)(samples, 50);
        expect(points[0].blocked).toBeUndefined();
    });
    it('points preserve sample metadata (azimuth, altitude, phase, date)', () => {
        const sample = {
            date: new Date('2026-06-20T12:00:00Z'),
            azimuth: 180,
            altitude: 60,
            phase: 'day',
        };
        const points = (0, sun_arc_geometry_1.computeArcPoints)([sample], 50);
        expect(points[0].azimuth).toBe(180);
        expect(points[0].altitude).toBe(60);
        expect(points[0].phase).toBe('day');
        expect(points[0].date).toBe(sample.date);
    });
});
