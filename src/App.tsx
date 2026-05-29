import { Dashboard } from './pages/dashboard/Dashboard';
import { AreaHistory } from './pages/history/AreaHistory';
import { AlertLogs } from './pages/alerts/AlertLogs';
import { useStore } from './hooks/useStore';

function App() {
  const activeTab = useStore((state) => state.activeTab);
  const setActiveTab = useStore((state) => state.setActiveTab);
  const selectedAreaId = useStore((state) => state.selectedAreaId);
  const setSelectedAreaId = useStore((state) => state.setSelectedAreaId);

  // Set standard fallback selected area on launch if empty
  if (!selectedAreaId) {
    setSelectedAreaId('prod-line-1');
  }

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

