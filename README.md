# Industrial Safety Monitoring System using IoT

A modern web application built to monitor real-time industrial safety metrics and predictive machine analytics. The system integrates with **Firebase Realtime Database** for live sensor readings and alert dispatch, and **Azure Table Storage** for high-frequency historical analytics logging.

---

## 🚀 Key Features

*   **Real-time Dashboard**: Displays live metrics (vibration, current, temperature, smoke density, and flame presence) across different industrial sectors (Warehouse, Production Area, etc.).
*   **Predictive Maintenance**: Shows AI-driven machine health status indicators recommending preventative inspection.
*   **Interactive Analytics Graphs**: Beautiful line charts depicting historical telemetry patterns.
*   **Safety Audit Logs**: chronological log of active and acknowledged safety alerts with alarm sounds on threshold breach.
*   **Push Notifications**: Integrated Firebase Cloud Messaging (FCM) to trigger instant alerts for supervisors in the foreground and background.

---

## 🛠️ Tech Stack

*   **Frontend**: React 19 (TypeScript), Vite, Tailwind CSS v4, Lucide Icons
*   **State Management**: Zustand
*   **Realtime Backend & Auth**: Firebase Auth, Firebase Cloud Messaging, Firebase Realtime Database
*   **Historical Telemetry**: Azure Table Storage (`@azure/data-tables`)

---

## 📋 Prerequisites

Ensure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v18+ recommended)
*   [npm](https://www.npmjs.com/)

---

## ⚙️ Setup & Configuration

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Create a `.env` file in the root directory of the project and populate it with your Firebase and Azure Table Storage credentials:
   ```env
   # Firebase Config
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_firebase_app_id
   VITE_FIREBASE_DATABASE_URL=your_firebase_database_url

   # Azure Table Storage Config
   VITE_TABLE_SAS_TOKEN="your_azure_storage_sas_token"
   ```

---

## 💻 Running the App

### Start the Development Server
Runs the app in development mode with hot-reloading:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser to view the supervisor portal.

### Build for Production
Compiles the TypeScript code and bundles the assets for deployment:
```bash
npm run build
```

### Preview Production Build
Runs a local web server to preview the built application:
```bash
npm run preview
```

---

## 📂 Project Structure

```
├── public/                 # Static assets (favicons, service worker)
├── src/
│   ├── assets/             # Images and design logos
│   ├── components/         # Reusable UI components (Sidebar, Topbar, Modals)
│   ├── config/             # Firebase and Threshold configurations
│   ├── hooks/              # Custom hooks (Store, Alarm, Dashboard, AreaHistory)
│   ├── pages/              # Views (Dashboard, History, MachineHealth, Alerts)
│   ├── services/           # Api services (Firebase RTDB, Azure Table Storage)
│   ├── types/              # TS interfaces & declarations
│   ├── App.tsx             # Main routing and global state hook setup
│   └── main.tsx            # Main application entry point
├── package.json            # Scripts and dependency list
└── vite.config.ts          # Vite build configuration
```
