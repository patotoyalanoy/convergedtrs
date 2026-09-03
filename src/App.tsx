import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { useEffect } from 'react';
import { SyncService } from './services/sync/syncService';

function App() {
  useEffect(() => {
    // Initialize offline/online sync listeners
    SyncService.initSyncListeners();
  }, []);

  return <RouterProvider router={router} />;
}

export default App;
