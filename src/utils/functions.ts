import type { AnalaticsType } from "../types/analatics";

export const compressAddress = (address : string) => {
  return `${address.slice(0, 6)}`+'...'+`${address.slice(-4)}`
}

export const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const nicRegex = /^(?:\d{9}[VvXx]|\d{12})$/;

export const isValidPassword = (password: string) => {
  return passwordRegex.test(password);
};

export const isValidEmail = (email: string) => {
  return emailRegex.test(email);
};

export const isValidNIC = (nic: string) => {
  return nicRegex.test(nic);
};

export const calculatePolygonArea = (coordinates: [number, number][]): number => {
  if (coordinates.length < 3) return 0;
  
  let area = 0;
  const n = coordinates.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += coordinates[i][0] * coordinates[j][1];
    area -= coordinates[j][0] * coordinates[i][1];
  }
  
  return Math.abs(area) / 2 * 111320 * 111320;
};

export const calculateAnalatics = (data:any[]) =>{
  console.log(data);
  const analatics: AnalaticsType = {
    totalDeeds: data?.length ?? 0,
    signedDeeds: 0,
    rejectedDeeds: 0,
    pendingDeeds: 0,
    monthlyGrowth: 0,
    completionRate: 0,
    avgProcessingTime: 0
  }
  return analatics;
}

// Overlap detection utilities
export interface LocationPoint {
  longitude: number;
  latitude: number;
}

export interface OverlapResult {
  deed1: string;
  deed2: string;
  overlapType: 'polygon' | 'boundary' | 'both';
  overlapPercentage?: number;
}

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
export const isPointInPolygon = (
  point: LocationPoint,
  polygon: LocationPoint[]
): boolean => {
  if (polygon.length < 3) return false;

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].longitude;
    const yi = polygon[i].latitude;
    const xj = polygon[j].longitude;
    const yj = polygon[j].latitude;

    const intersect =
      yi > point.latitude !== yj > point.latitude &&
      point.longitude < ((xj - xi) * (point.latitude - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
};

/**
 * Check if two line segments intersect
 */
const doLineSegmentsIntersect = (
  p1: LocationPoint,
  p2: LocationPoint,
  p3: LocationPoint,
  p4: LocationPoint
): boolean => {
  const ccw = (A: LocationPoint, B: LocationPoint, C: LocationPoint): number => {
    return (C.latitude - A.latitude) * (B.longitude - A.longitude) - 
           (B.latitude - A.latitude) * (C.longitude - A.longitude);
  };

  return (
    ccw(p1, p3, p4) !== ccw(p2, p3, p4) &&
    ccw(p1, p2, p3) !== ccw(p1, p2, p4)
  );
};

/**
 * Validate coordinates are within valid ranges
 */
const isValidCoordinate = (coord: LocationPoint): boolean => {
  // Sri Lanka approximate bounds: lat 5.9-9.8, lng 79.7-81.9
  // But we'll use more generous bounds to allow for other regions
  return (
    coord.latitude >= -90 && coord.latitude <= 90 &&
    coord.longitude >= -180 && coord.longitude <= 180 &&
    !isNaN(coord.latitude) && !isNaN(coord.longitude) &&
    isFinite(coord.latitude) && isFinite(coord.longitude)
  );
};

/**
 * Check if two polygons overlap by checking:
 * 1. If any vertex of polygon1 is inside polygon2
 * 2. If any vertex of polygon2 is inside polygon1
 * 3. If any edges intersect
 */
export const doPolygonsOverlap = (
  polygon1: LocationPoint[],
  polygon2: LocationPoint[]
): boolean => {
  if (polygon1.length < 3 || polygon2.length < 3) return false;

  // Validate all coordinates
  const validPoly1 = polygon1.filter(isValidCoordinate);
  const validPoly2 = polygon2.filter(isValidCoordinate);
  
  if (validPoly1.length < 3 || validPoly2.length < 3) return false;

  // Check if polygons are too far apart (quick rejection)
  const getBounds = (poly: LocationPoint[]) => {
    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;
    for (const p of poly) {
      minLat = Math.min(minLat, p.latitude);
      maxLat = Math.max(maxLat, p.latitude);
      minLng = Math.min(minLng, p.longitude);
      maxLng = Math.max(maxLng, p.longitude);
    }
    return { minLat, maxLat, minLng, maxLng };
  };

  const bounds1 = getBounds(validPoly1);
  const bounds2 = getBounds(validPoly2);

  // If bounding boxes don't overlap, polygons can't overlap
  if (bounds1.maxLat < bounds2.minLat || bounds2.maxLat < bounds1.minLat ||
      bounds1.maxLng < bounds2.minLng || bounds2.maxLng < bounds1.minLng) {
    return false;
  }

  // Check if any vertex of polygon1 is inside polygon2
  for (const point of validPoly1) {
    if (isPointInPolygon(point, validPoly2)) {
      return true;
    }
  }

  // Check if any vertex of polygon2 is inside polygon1
  for (const point of validPoly2) {
    if (isPointInPolygon(point, validPoly1)) {
      return true;
    }
  }

  // Check if any edges intersect
  for (let i = 0; i < validPoly1.length; i++) {
    const p1 = validPoly1[i];
    const p2 = validPoly1[(i + 1) % validPoly1.length];

    for (let j = 0; j < validPoly2.length; j++) {
      const p3 = validPoly2[j];
      const p4 = validPoly2[(j + 1) % validPoly2.length];

      if (doLineSegmentsIntersect(p1, p2, p3, p4)) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Calculate the approximate overlap percentage between two polygons
 */
export const calculateOverlapPercentage = (
  polygon1: LocationPoint[],
  polygon2: LocationPoint[]
): number => {
  if (!doPolygonsOverlap(polygon1, polygon2)) return 0;

  // Count points from polygon1 inside polygon2
  let pointsInside1 = 0;
  for (const point of polygon1) {
    if (isPointInPolygon(point, polygon2)) {
      pointsInside1++;
    }
  }

  // Count points from polygon2 inside polygon1
  let pointsInside2 = 0;
  for (const point of polygon2) {
    if (isPointInPolygon(point, polygon1)) {
      pointsInside2++;
    }
  }

  // Calculate overlap as average of both percentages
  const overlap1 = (pointsInside1 / polygon1.length) * 100;
  const overlap2 = (pointsInside2 / polygon2.length) * 100;

  return (overlap1 + overlap2) / 2;
};

/**
 * Check if a string is a deed number reference (e.g., "D001", "78216")
 */
const isDeedNumberReference = (value: string): boolean => {
  if (!value) return false;
  // Check if it starts with 'D' followed by numbers, or is just numbers (deed numbers)
  return /^D\d+$/.test(value.trim()) || /^\d+$/.test(value.trim());
};

/**
 * Check if boundaries (sides) overlap by comparing side references
 * Only considers it an overlap if both deeds reference the same deed number
 * Generic landmarks like "Road", "River" are ignored to avoid false positives
 */
export const doBoundariesOverlap = (
  sides1?: { North?: string; South?: string; East?: string; West?: string },
  sides2?: { North?: string; South?: string; East?: string; West?: string }
): boolean => {
  if (!sides1 || !sides2) return false;

  const sides1Values = [sides1.North, sides1.South, sides1.East, sides1.West]
    .filter(Boolean)
    .filter(val => isDeedNumberReference(val!)); // Only check deed number references
  
  const sides2Values = [sides2.North, sides2.South, sides2.East, sides2.West]
    .filter(Boolean)
    .filter(val => isDeedNumberReference(val!)); // Only check deed number references

  // Check if any deed number boundary references match
  for (const side1 of sides1Values) {
    for (const side2 of sides2Values) {
      if (side1 === side2 && side1) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Detect all overlapping deeds
 */
export const detectOverlappingDeeds = (
  deeds: Array<{
    deedNumber: string;
    location: LocationPoint[];
    sides?: { North?: string; South?: string; East?: string; West?: string };
    surveyPlanNumber?: string;
  }>,
  plansMap: Map<string, { coordinates: LocationPoint[]; sides?: { North?: string; South?: string; East?: string; West?: string } }> | Record<string, { coordinates: LocationPoint[]; sides?: { North?: string; South?: string; East?: string; West?: string } }>
): OverlapResult[] => {
  const overlaps: OverlapResult[] = [];

  console.log('=== detectOverlappingDeeds Debug ===');
  console.log('Total deeds to check:', deeds.length);
  console.log('Plans map keys:', plansMap instanceof Map ? Array.from(plansMap.keys()) : Object.keys(plansMap));

  for (let i = 0; i < deeds.length; i++) {
    for (let j = i + 1; j < deeds.length; j++) {
      const deed1 = deeds[i];
      const deed2 = deeds[j];

      // Skip if checking same deed (normalize deed numbers to strings for comparison)
      const deed1Num = String(deed1.deedNumber).trim();
      const deed2Num = String(deed2.deedNumber).trim();
      if (deed1Num === deed2Num) continue;

      // Get plan data for both deeds - try multiple lookup methods
      let plan1 = null;
      let plan2 = null;
      
      if (deed1.surveyPlanNumber) {
        plan1 = plansMap instanceof Map ? plansMap.get(deed1.surveyPlanNumber) : plansMap[deed1.surveyPlanNumber];
      }
      // Also try looking up by deed number if plan not found by surveyPlanNumber
      if (!plan1) {
        plan1 = plansMap instanceof Map ? plansMap.get(deed1.deedNumber) : plansMap[deed1.deedNumber];
      }
      
      if (deed2.surveyPlanNumber) {
        plan2 = plansMap instanceof Map ? plansMap.get(deed2.surveyPlanNumber) : plansMap[deed2.surveyPlanNumber];
      }
      // Also try looking up by deed number if plan not found by surveyPlanNumber
      if (!plan2) {
        plan2 = plansMap instanceof Map ? plansMap.get(deed2.deedNumber) : plansMap[deed2.deedNumber];
      }

      // Use plan coordinates if available, otherwise use deed location
      // Both are stored as {longitude, latitude} format (LocationPoint)
      let coords1: LocationPoint[] = [];
      let coords2: LocationPoint[] = [];

      if (plan1?.coordinates && plan1.coordinates.length >= 3) {
        // Ensure coordinates are in correct format {longitude, latitude}
        coords1 = plan1.coordinates.map((coord: any) => ({
          longitude: typeof coord.longitude === 'number' ? coord.longitude : (coord.lng ?? 0),
          latitude: typeof coord.latitude === 'number' ? coord.latitude : (coord.lat ?? 0),
        })).filter((c: LocationPoint) => c.longitude !== 0 || c.latitude !== 0);
        console.log(`Deed ${deed1.deedNumber}: Using plan coordinates (${coords1.length} points)`, coords1[0]);
      } else if (deed1.location && deed1.location.length >= 3) {
        // Ensure deed location is in correct format
        coords1 = deed1.location.map((coord: any) => ({
          longitude: typeof coord.longitude === 'number' ? coord.longitude : (coord.lng ?? 0),
          latitude: typeof coord.latitude === 'number' ? coord.latitude : (coord.lat ?? 0),
        })).filter((c: LocationPoint) => c.longitude !== 0 || c.latitude !== 0);
        console.log(`Deed ${deed1.deedNumber}: Using deed location (${coords1.length} points)`, coords1[0]);
      } else {
        console.log(`Deed ${deed1.deedNumber}: No valid coordinates (plan: ${plan1 ? `exists with ${plan1.coordinates?.length || 0} coords` : 'not found'}, location: ${deed1.location?.length || 0} points)`);
      }

      if (plan2?.coordinates && plan2.coordinates.length >= 3) {
        // Ensure coordinates are in correct format {longitude, latitude}
        coords2 = plan2.coordinates.map((coord: any) => ({
          longitude: typeof coord.longitude === 'number' ? coord.longitude : (coord.lng ?? 0),
          latitude: typeof coord.latitude === 'number' ? coord.latitude : (coord.lat ?? 0),
        })).filter((c: LocationPoint) => c.longitude !== 0 || c.latitude !== 0);
        console.log(`Deed ${deed2.deedNumber}: Using plan coordinates (${coords2.length} points)`, coords2[0]);
      } else if (deed2.location && deed2.location.length >= 3) {
        // Ensure deed location is in correct format
        coords2 = deed2.location.map((coord: any) => ({
          longitude: typeof coord.longitude === 'number' ? coord.longitude : (coord.lng ?? 0),
          latitude: typeof coord.latitude === 'number' ? coord.latitude : (coord.lat ?? 0),
        })).filter((c: LocationPoint) => c.longitude !== 0 || c.latitude !== 0);
        console.log(`Deed ${deed2.deedNumber}: Using deed location (${coords2.length} points)`, coords2[0]);
      } else {
        console.log(`Deed ${deed2.deedNumber}: No valid coordinates (plan: ${plan2 ? `exists with ${plan2.coordinates?.length || 0} coords` : 'not found'}, location: ${deed2.location?.length || 0} points)`);
      }

      // Skip if either deed has no valid coordinates
      if (coords1.length < 3 || coords2.length < 3) {
        console.log(`Skipping overlap check: Deed ${deed1.deedNumber} vs ${deed2.deedNumber} - insufficient coordinates`);
        continue;
      }

      // Check polygon overlap
      const polygonOverlap = doPolygonsOverlap(coords1, coords2);
      console.log(`Polygon overlap check: Deed ${deed1.deedNumber} vs ${deed2.deedNumber} = ${polygonOverlap}`);

      // Check boundary overlap
      const sides1 = plan1?.sides || deed1.sides;
      const sides2 = plan2?.sides || deed2.sides;
      const boundaryOverlap = doBoundariesOverlap(sides1, sides2);
      console.log(`Boundary overlap check: Deed ${deed1.deedNumber} vs ${deed2.deedNumber} = ${boundaryOverlap}`, { sides1, sides2 });

      // Calculate overlap percentage if polygons overlap
      const overlapPercentage = polygonOverlap 
        ? calculateOverlapPercentage(coords1, coords2)
        : undefined;

      // Only consider polygon overlaps as errors if the overlap percentage is > 0%
      const hasSignificantPolygonOverlap = polygonOverlap && overlapPercentage !== undefined && overlapPercentage > 0;

      if (hasSignificantPolygonOverlap || boundaryOverlap) {
        const overlapType: 'polygon' | 'boundary' | 'both' = 
          hasSignificantPolygonOverlap && boundaryOverlap ? 'both' :
          hasSignificantPolygonOverlap ? 'polygon' : 'boundary';

        console.log(`OVERLAP DETECTED: Deed ${deed1Num} vs ${deed2Num} - Type: ${overlapType}, Percentage: ${overlapPercentage?.toFixed(1)}%`);

        overlaps.push({
          deed1: deed1Num,
          deed2: deed2Num,
          overlapType,
          overlapPercentage: hasSignificantPolygonOverlap ? overlapPercentage : undefined,
        });
      }
    }
  }

  console.log(`Total overlaps found: ${overlaps.length}`);
  
  // Specific check for deeds 002 and 005 (normalize to strings)
  const check002vs005 = overlaps.find(o => {
    const d1 = String(o.deed1).trim();
    const d2 = String(o.deed2).trim();
    return (d1 === '002' && d2 === '005') || (d1 === '005' && d2 === '002');
  });
  if (check002vs005) {
    console.log('✅ OVERLAP FOUND between 002 and 005:', check002vs005);
  } else {
    console.log('❌ NO OVERLAP FOUND between 002 and 005');
    // Check if both deeds exist (check both string and number formats)
    const deed002 = deeds.find(d => {
      const deedNum = String(d.deedNumber).trim();
      return deedNum === '002' || deedNum === '2';
    });
    const deed005 = deeds.find(d => {
      const deedNum = String(d.deedNumber).trim();
      return deedNum === '005' || deedNum === '5';
    });
    console.log('Deed 002 exists:', !!deed002, deed002 ? {
      hasPlan: !!deed002.surveyPlanNumber,
      planNumber: deed002.surveyPlanNumber,
      hasLocation: !!deed002.location && deed002.location.length > 0,
      locationCount: deed002.location?.length || 0,
    } : null);
    console.log('Deed 005 exists:', !!deed005, deed005 ? {
      hasPlan: !!deed005.surveyPlanNumber,
      planNumber: deed005.surveyPlanNumber,
      hasLocation: !!deed005.location && deed005.location.length > 0,
      locationCount: deed005.location?.length || 0,
    } : null);
  }
  
  console.log('=== End detectOverlappingDeeds Debug ===');

  return overlaps;
};