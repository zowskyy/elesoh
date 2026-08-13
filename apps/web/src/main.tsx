import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from './AppShell';
import { BusinessesPage } from './pages/BusinessesPage';
import { DashboardPage } from './pages/DashboardPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { WebsitesPage } from './pages/WebsitesPage';
import './styles.css';

const root = document.getElementById('root');
if (root === null) {
  throw new Error('root element missing');
}

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/businesses" element={<BusinessesPage />} />
          <Route path="/websites" element={<WebsitesPage />} />
          <Route path="/audits" element={<PlaceholderPage title="Audits" />} />
          <Route path="/findings" element={<PlaceholderPage title="Findings" />} />
          <Route path="/reports" element={<PlaceholderPage title="Reports" />} />
          <Route path="/jobs" element={<PlaceholderPage title="Jobs" />} />
          <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
