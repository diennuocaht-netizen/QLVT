/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Documents } from './pages/Documents';
import { Devices } from './pages/Devices';
import { Admin } from './pages/Admin';
import { InventoryDashboard } from './pages/InventoryDashboard';
import { InventoryItems } from './pages/InventoryItems';
import { InventoryReceipts } from './pages/InventoryReceipts';
import { InventoryIssues } from './pages/InventoryIssues';
import { InventoryRequisitions } from './pages/InventoryRequisitions';
import { InventoryAudits } from './pages/InventoryAudits';
import { InventorySettings } from './pages/InventorySettings';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Đang tải...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="documents" element={<Documents />} />
            <Route path="devices" element={<Devices />} />
            <Route path="admin" element={<Admin />} />
            
            {/* Inventory Routes */}
            <Route path="inventory" element={<InventoryDashboard />} />
            <Route path="inventory/items" element={<InventoryItems />} />
            <Route path="inventory/receipts" element={<InventoryReceipts />} />
            <Route path="inventory/issues" element={<InventoryIssues />} />
            <Route path="inventory/requisitions" element={<InventoryRequisitions />} />
            <Route path="inventory/audits" element={<InventoryAudits />} />
            <Route path="inventory/settings" element={<InventorySettings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
