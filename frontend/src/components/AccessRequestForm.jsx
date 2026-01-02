// src/components/AccessRequestForm.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function AccessRequestForm() {
  const navigate = useNavigate();

  const handleContact = () => {
    const email = 'gerenteappyempresa@gmail.com';
    const subject = encodeURIComponent('Solicitud de acceso a Encuestas Pro');
    const body = encodeURIComponent(
      'Hola,\n\n' +
      'Me interesa usar Encuestas Pro para mi organización.\n\n' +
      'Nombre:\n' +
      'Organización:\n' +
      'País:\n' +
      '¿Para qué necesitas la aplicación?:\n\n' +
      'Gracias.'
    );
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="text-5xl mb-6">📨</div>
        <h1 className="text-2xl font-bold text-neonCyan mb-4">
          ¿Quieres usar Encuestas Pro?
        </h1>
        <p className="text-gray-300 mb-6">
          Envíanos un correo con tus datos y te daremos acceso personalizado.
        </p>
        <button
          onClick={handleContact}
          className="w-full py-4 bg-gradient-to-r from-neonGreen to-neonBlue text-gray-900 font-bold rounded-xl text-lg"
        >
          📧 Escribir a gerenteappyempresa@gmail.com
        </button>
        <p className="mt-4 text-gray-500 text-sm">
          Incluye: nombre, organización, país y propósito de uso.
        </p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 text-neonBlue hover:underline"
        >
          ← Volver al inicio
        </button>
      </div>
    </div>
  );
}
