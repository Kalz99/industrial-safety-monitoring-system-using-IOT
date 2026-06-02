import { useMemo } from 'react';
import { useStore } from './useStore';

export interface AreaInfo {
  id: string;
  name: string;
}

export const useAreas = () => {
  const areasData = useStore((state) => state.areasData);

  const areasList = useMemo<AreaInfo[]>(() => {
    return areasData.map(area => ({
      id: area.id,
      name: area.name
    }));
  }, [areasData]);


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

