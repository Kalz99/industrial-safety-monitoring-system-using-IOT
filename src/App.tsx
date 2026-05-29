import { useEffect } from 'react';
import { Dashboard } from './pages/dashboard/Dashboard';
import { AreaHistory } from './pages/history/AreaHistory';
import { AlertLogs } from './pages/alerts/AlertLogs';
import { AlertModal } from './components/AlertModal';
import { PushNotificationService } from './services/pushNotification';
import { useStore } from './hooks/useStore';

function App() {
  const activeTab = useStore((state) => state.activeTab);
  const setActiveTab = useStore((state) => state.setActiveTab);
  const selectedAreaId = useStore((state) => state.selectedAreaId);
  const setSelectedAreaId = useStore((state) => state.setSelectedAreaId);
  const areasData = useStore((state) => state.areasData);
  const setActiveModalAlert = useStore((state) => state.setActiveModalAlert);

  // Set standard fallback selected area dynamically from database on launch
  useEffect(() => {
    if (areasData.length > 0) {
      const exists = areasData.some(a => a.id === selectedAreaId);
      if (!selectedAreaId || !exists) {
        setSelectedAreaId(areasData[0].id);
      }
    }
  }, [areasData, selectedAreaId, setSelectedAreaId]);

  // Initialize Web Push Notifications
  useEffect(() => {
    // 1. Request background permissions & get dynamic FCM Token
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      PushNotificationService.requestPermissionAndGetToken();
    }

    // 2. Set up foreground push listener to display our premium glass alert modal
    const unsubscribe = PushNotificationService.listenToForegroundMessages((payload) => {
      if (payload.data) {
        const { areaId, areaName, sourceType, sensorType, sensorLabel, value, unit } = payload.data;
        const newAlert = {
          areaId: areaId || 'rtdb-area',
          areaName: areaName || payload.notification?.title || 'Active Area Warning',
          sourceType: (sourceType as any) || 'machine',
          sensorType: sensorType || 'vibration',
          sensorLabel: sensorLabel || 'Sensor Trigger',
          value: value || '',
          unit: unit || '',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };
        setActiveModalAlert(newAlert);
      }
    });

    return unsubscribe;
  }, [setActiveModalAlert]);

  const handleExploreArea = (areaId: string) => {

    setSelectedAreaId(areaId);
    setActiveTab('analytics'); // Swapping to analytics tab goes to machine analytics page
  };

  const handleBackToDashboard = () => {
    setActiveTab('overview');
  };

  return (
    <>
      <AlertModal />
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

