import { useEffect } from 'react';
import { Dashboard } from './pages/dashboard/Dashboard';
import { AreaHistory } from './pages/history/AreaHistory';
import { AlertLogs } from './pages/alerts/AlertLogs';
import { useStore } from './hooks/useStore';

function App() {
  const activeTab = useStore((state) => state.activeTab);
  const setActiveTab = useStore((state) => state.setActiveTab);
  const selectedAreaId = useStore((state) => state.selectedAreaId);
  const setSelectedAreaId = useStore((state) => state.setSelectedAreaId);
  const areasData = useStore((state) => state.areasData);

  // Set standard fallback selected area dynamically from database on launch
  useEffect(() => {
    if (areasData.length > 0) {
      const exists = areasData.some(a => a.id === selectedAreaId);
      if (!selectedAreaId || !exists) {
        setSelectedAreaId(areasData[0].id);
      }
    }
  }, [areasData, selectedAreaId, setSelectedAreaId]);


  const handleExploreArea = (areaId: string) => {
    setSelectedAreaId(areaId);
    setActiveTab('analytics'); // Swapping to analytics tab goes to machine analytics page
  };

  const handleBackToDashboard = () => {
    setActiveTab('overview');
  };

  return (
    <>
      {activeTab === 'analytics' ? (
        <AreaHistory 
          areaId={selectedAreaId || 'prod-line-1'} 
          setSelectedAreaId={setSelectedAreaId}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onBack={handleBackToDashboard} 
          mode="machine"
        />
      ) : activeTab === 'areas' ? (
        <AreaHistory 
          areaId={selectedAreaId || 'prod-line-1'} 
          setSelectedAreaId={setSelectedAreaId}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onBack={handleBackToDashboard} 
          mode="environment"
        />
      ) : activeTab === 'alerts' ? (
        <AlertLogs 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
        />
      ) : (
        <Dashboard 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onExploreArea={handleExploreArea} 
        />
      )}
    </>
  );
}

export default App;

