import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TestsPage from './pages/TestsPage';
import TestDetailPage from './pages/TestDetailPage';
import CandidatesPage from './pages/CandidatesPage';
import SessionDetailPage from './pages/SessionDetailPage';
import UsersPage from './pages/UsersPage';
import ProfilePage from './pages/ProfilePage';
import CandidatePortal from './pages/CandidatePortal';
import CandidateTest from './pages/CandidateTest';
import TestResult from './pages/TestResult';
import HomePage from './pages/HomePage';
import Layout from './components/layout/Layout';
import TalentDashboardPage from './pages/TalentDashboardPage';
import JobOffersPage from './pages/JobOffersPage';
import JobOfferDetailPage from './pages/JobOfferDetailPage';
import TalentCandidatesPage from './pages/TalentCandidatesPage';
import TalentCandidateDetailPage from './pages/TalentCandidateDetailPage';
import './styles/global.css';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh',fontSize:'1.2rem',color:'#4f46e5'}}>Chargement...</div>;
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/test/:code" element={<CandidatePortal />} />
          <Route path="/test/:code/start" element={<CandidateTest />} />
          <Route path="/test/result/:sessionId" element={<TestResult />} />
          <Route path="/dashboard" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="tests" element={<TestsPage />} />
            <Route path="tests/:id" element={<TestDetailPage />} />
            <Route path="candidates" element={<CandidatesPage />} />
            <Route path="candidates/:id" element={<SessionDetailPage />} />
            <Route path="talent" element={<TalentDashboardPage />} />
            <Route path="talent/offers" element={<JobOffersPage />} />
            <Route path="talent/offers/:id" element={<JobOfferDetailPage />} />
            <Route path="talent/candidates" element={<TalentCandidatesPage />} />
            <Route path="talent/candidates/:id" element={<TalentCandidateDetailPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
