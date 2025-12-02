import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from './store';
import { Layout } from './components/Layout';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));

export const App: React.FC = () => {
         const auth = useSelector((state: RootState) => state.auth);

         return (
                  <Layout>
                           <Suspense fallback={<div>Loading...</div>}>
                                    <Routes>
                                             <Route path="/" element={<HomePage />} />
                                             <Route path="/login" element={<LoginPage />} />
                                             <Route path="/register" element={<RegisterPage />} />
                                             <Route
                                                      path="/dashboard"
                                                      element={auth.isAuthenticated ? <DashboardPage /> : <Navigate to="/login" />}
                                             />
                                    </Routes>
                           </Suspense>
                  </Layout>
         );
};
