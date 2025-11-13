// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';
import AdminLogin from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';
import PublicVotingWrapper from './components/PublicVotingWrapper';

export default function App() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-neonBlue">Cargando...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* ✅ Ruta pública: SOLO accesible con ID */}
        <Route path="/encuesta/:pollId" element={<PublicVotingWrapper />} />

        {/* ✅ Ruta raíz: redirige al login de admin */}
        <Route
          path="/"
          element={!user ? <AdminLogin /> : <Navigate to="/admin" />}
        />

        {/* Rutas de administración */}
        <Route
          path="/admin/login"
          element={!user ? <AdminLogin /> : <Navigate to="/admin" />}
        />
        <Route
          path="/admin"
          element={user ? <AdminPanel /> : <Navigate to="/admin/login" />}
        />

        {/* Ruta no encontrada */}
        <Route
          path="*"
          element={
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
              <p className="text-neonRed">Página no encontrada</p>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}