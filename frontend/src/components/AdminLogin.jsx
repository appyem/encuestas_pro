// src/components/AdminLogin.jsx
import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError('Credenciales incorrectas. Inténtelo de nuevo.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-black to-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        {/* Logo / ícono */}
        <div className="neon-glow mb-6">
          <div className="inline-block p-4 rounded-2xl bg-gray-800 border border-neonBlue shadow-neonBlue/30">
            <span className="text-4xl">🔐</span>
          </div>
        </div>

        {/* Título */}
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-neonBlue to-neonPurple mb-2">
          Encuestas Pro
        </h1>
        <p className="text-gray-400 mb-8">Acceso exclusivo para administradores</p>

        {/* Formulario */}
        <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 shadow-xl">
          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-300 text-sm">
              ❌ {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-1 text-left">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900 text-white rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-neonBlue focus:border-transparent transition"
                placeholder="admin@ejemplo.com"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-1 text-left">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900 text-white rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-neonPink focus:border-transparent transition"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-neonBlue to-neonPurple text-gray-900 font-bold rounded-xl shadow-lg hover:shadow-neonBlue/40 transition-all duration-300 transform hover:scale-[1.02]"
            >
              🔑 Iniciar Sesión
            </button>
          </form>
        </div>

        <p className="mt-6 text-gray-500 text-xs">
          © {new Date().getFullYear()} Encuestas Pro — Sistema de encuestas electorales
        </p>
      </div>
    </div>
  );
}