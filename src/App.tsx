import { useState } from 'react';
import { Dashboard } from './pages/dashboard/Dashboard';
import { AreaHistory } from './pages/history/AreaHistory';
import { AlertLogs } from './pages/alerts/AlertLogs';

function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedAreaId, setSelectedAreaId] = useState<string>('prod-line-1');

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
          areaId={selectedAreaId} 
          setSelectedAreaId={setSelectedAreaId}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onBack={handleBackToDashboard} 
          mode="machine"
        />
      ) : activeTab === 'areas' ? (
        <AreaHistory 
          areaId={selectedAreaId} 
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
