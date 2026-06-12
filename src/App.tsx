import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config/firebase';
import { Dashboard } from './pages/dashboard/Dashboard';
import { AreaHistory } from './pages/history/AreaHistory';
import { AlertLogs } from './pages/alerts/AlertLogs';
import { Login } from './pages/login/login';
import { MachineHealth } from './pages/machinehealth/MachineHealth';
import { AlertModal } from './components/AlertModal';
import { PredictionAlertModal } from './components/PredictionAlertModal';
import { PushNotificationService } from './services/pushNotification';
import { useStore } from './hooks/useStore';
import { Loader2 } from 'lucide-react';
import logo1 from './assets/logo1.png';

function App() {
  const activeTab = useStore((state) => state.activeTab);
  const setActiveTab = useStore((state) => state.setActiveTab);
  const selectedAreaId = useStore((state) => state.selectedAreaId);
  const setSelectedAreaId = useStore((state) => state.setSelectedAreaId);
  const areasData = useStore((state) => state.areasData);
  const setActiveModalAlert = useStore((state) => state.setActiveModalAlert);
  
  const user = useStore((state) => state.user);
  const loadingUser = useStore((state) => state.loadingUser);
  const setUser = useStore((state) => state.setUser);
  const setLoadingUser = useStore((state) => state.setLoadingUser);

  // Monitor Firebase Authentication State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoadingUser(false);
    });
    return unsubscribe;
  }, [setUser, setLoadingUser]);

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
    if (!user) return; // Only listen/request when user is logged in

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
  }, [setActiveModalAlert, user]);

  const handleExploreArea = (areaId: string) => {
    setSelectedAreaId(areaId);
    setActiveTab('analytics'); // Swapping to analytics tab goes to machine analytics page
  };

  const handleBackToDashboard = () => {
    setActiveTab('overview');
  };

  // 1. Loading Authentication State Screen
  if (loadingUser) {
    return (
      <div className="min-h-screen bg-[#090d16] text-white flex flex-col items-center justify-center gap-4 font-sans relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-rose-500/5 blur-[120px] pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="h-16 w-16 flex items-center justify-center overflow-hidden rounded-2xl animate-pulse">
            <img src={logo1} alt="Logo" className="h-full w-full object-contain" />
          </div>
          <div className="flex items-center gap-2 text-slate-350 font-medium text-sm">
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            Loading Supervisor Portal...
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated Login Screen
  if (!user) {
    return <Login />;
  }

  // 3. Authenticated App Pages
  return (
    <>
      <AlertModal />
      <PredictionAlertModal />
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
      ) : activeTab === 'machinehealth' ? (
        <MachineHealth 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
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

