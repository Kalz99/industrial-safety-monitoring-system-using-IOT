import { useMemo } from 'react';

export interface AreaInfo {
  id: string;
  name: string;
}

export const useAreas = () => {
  const areasList = useMemo<AreaInfo[]>(() => [
    { id: 'prod-line-1', name: 'Production Line 1' },
    { id: 'boiler-room', name: 'Boiler Room Sector' },
    { id: 'storage-a', name: 'Storage Area A' },
    { id: 'assembly-hall', name: 'Main Assembly Hall' }
  ], []);

  const areaNamesMap = useMemo(() => {
    return areasList.reduce((acc, area) => {
      acc[area.id] = area.name;
      return acc;
    }, {} as Record<string, string>);
  }, [areasList]);

  return {
    areasList,
    areaNamesMap
  };
};
