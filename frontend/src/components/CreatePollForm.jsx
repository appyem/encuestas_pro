// src/components/CreatePollForm.jsx
import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export default function CreatePollForm({ onPollCreated }) {
  const [title, setTitle] = useState('');
  const [question, setQuestion] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [candidates, setCandidates] = useState([
    { name: '', party: '', color: 'neonBlue', photoFile: null, photoPreview: null, photoUrl: '' }
  ]);
  const [newPollLink, setNewPollLink] = useState('');

  const addCandidate = () => {
    setCandidates([...candidates, { name: '', party: '', color: 'neonPink', photoFile: null, photoPreview: null, photoUrl: '' }]);
  };

  const updateCandidate = (index, field, value) => {
    const newCandidates = [...candidates];
    newCandidates[index][field] = value;
    if (field === 'photoFile') {
      if (value) {
        newCandidates[index].photoPreview = URL.createObjectURL(value);
        newCandidates[index].photoUrl = '';
      } else {
        newCandidates[index].photoPreview = null;
        newCandidates[index].photoUrl = 'https://placehold.co/160?text=Sin+Foto';
      }
    }
    setCandidates(newCandidates);
  };

  const removeCandidate = (index) => {
    if (candidates.length > 2) {
      if (candidates[index].photoPreview) {
        URL.revokeObjectURL(candidates[index].photoPreview);
      }
      setCandidates(candidates.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !question.trim()) {
      alert('⚠️ Debe ingresar título y pregunta.');
      return;
    }

    if (!startDate || !endDate) {
      alert('⚠️ Debe seleccionar fecha y hora de inicio y fin.');
      return;
    }

    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    if (start >= end) {
      alert('⚠️ La fecha de inicio debe ser anterior a la de fin.');
      return;
    }

    for (const cand of candidates) {
      if (!cand.name.trim() || !cand.party.trim()) {
        alert('⚠️ Todos los candidatos deben tener nombre y partido.');
        return;
      }
      if (!cand.photoFile && !cand.photoUrl) {
        alert('⚠️ Debe seleccionar una imagen para cada candidato.');
        return;
      }
    }

    try {
      // Convertir todas las imágenes a Base64
      const candidatesWithBase64 = [];
      for (const cand of candidates) {
        let finalPhotoUrl = cand.photoUrl;
        if (cand.photoFile) {
          const reader = new FileReader();
          finalPhotoUrl = await new Promise((resolve) => {
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(cand.photoFile);
          });
        }
        candidatesWithBase64.push({
          id: `cand_${Date.now()}_${candidatesWithBase64.length}`,
          name: cand.name,
          party: cand.party,
          color: cand.color,
          photoUrl: finalPhotoUrl,
        });
      }

      const pollData = {
        title,
        question,
        creator: auth.currentUser.email,
        createdAt: serverTimestamp(),
        startDate: start,
        endDate: end,
        status: 'scheduled',
        candidates: candidatesWithBase64,
      };

      const docRef = await addDoc(collection(db, 'polls'), pollData);
      const pollId = docRef.id;
      const link = `${window.location.origin}/encuesta/${pollId}`;
      setNewPollLink(link);

      alert('✅ Encuesta creada exitosamente');
      onPollCreated();
    } catch (err) {
      console.error('Error al crear encuesta:', err);
      alert('❌ Error al crear la encuesta.');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(newPollLink);
    alert('✅ Enlace copiado al portapapeles');
  };

  const shareViaWhatsApp = () => {
    const message = `🗳️ *¡Participa en la encuesta!*  

*${title}*

${question}

👉 ${newPollLink}

🔒 Voto único por dispositivo  
🇨🇴 APPYEMPRESA S.A.S`;

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-neonBlue">
      <h2 className="text-2xl font-bold text-neonBlue mb-6 text-center">🆕 Crear Nueva Encuesta</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-gray-300 mb-2">Título de la Encuesta</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 bg-gray-900 text-white rounded-xl border border-gray-700"
            placeholder="Ej: Elecciones Presidenciales 2025"
            required
          />
        </div>

        <div>
          <label className="block text-gray-300 mb-2">Pregunta de la Encuesta</label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full p-3 bg-gray-900 text-white rounded-xl border border-gray-700"
            placeholder="¿Por quién votarás?"
            rows="2"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-300 mb-2">Inicio (fecha y hora)</label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-3 bg-gray-900 text-white rounded-xl border border-gray-700"
              required
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-2">Fin (fecha y hora)</label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-3 bg-gray-900 text-white rounded-xl border border-gray-700"
              required
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="block text-gray-300">Candidatos</label>
            <button
              type="button"
              onClick={addCandidate}
              className="text-neonYellow text-sm flex items-center"
            >
              ➕ Agregar candidato
            </button>
          </div>

          <div className="space-y-4">
            {candidates.map((candidate, index) => (
              <div key={index} className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <input
                    type="text"
                    placeholder="Nombre"
                    value={candidate.name}
                    onChange={(e) => updateCandidate(index, 'name', e.target.value)}
                    className="p-2 bg-gray-800 text-white rounded-lg border border-gray-600"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Partido político"
                    value={candidate.party}
                    onChange={(e) => updateCandidate(index, 'party', e.target.value)}
                    className="p-2 bg-gray-800 text-white rounded-lg border border-gray-600"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Foto del candidato</label>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      onChange={(e) => updateCandidate(index, 'photoFile', e.target.files[0] || null)}
                      className="w-full p-1 bg-gray-800 text-white rounded-lg border border-gray-600 file:text-sm file:bg-gray-700 file:border-0 file:px-2 file:py-1 file:rounded"
                      required={!candidate.photoUrl}
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="text-gray-400 text-sm mr-2">Color:</label>
                    <select
                      value={candidate.color}
                      onChange={(e) => updateCandidate(index, 'color', e.target.value)}
                      className="p-2 bg-gray-800 text-white rounded-lg border border-gray-600 flex-1"
                    >
                      <option value="neonRed">Rojo Neón 🔴</option>
                      <option value="red">Rojo Puro ❤️</option>
                      <option value="neonGreen">Verde Neón 💚</option>
                      <option value="greenLight">Verde Claro 🌿</option>
                      <option value="greenDark">Verde Oscuro 🌲</option>
                      <option value="neonBlue">Azul Neón 💙</option>
                      <option value="blueLight">Azul Claro ☁️</option>
                      <option value="neonYellow">Amarillo Neón 💛</option>
                      <option value="neonPink">Rosa Neón 💖</option>
                      <option value="neonPurple">Púrpura Neón 💜</option>
                      <option value="neonOrange">Naranja Neón 🍊</option>
                      <option value="neonCoral">Coral Neón 🌊</option>
                      <option value="neonTeal">Turquesa Neón 💠</option>
                      <option value="neonLime">Lima Neón 🍋</option>
                      <option value="neonIndigo">Índigo Neón 🌌</option>
                      <option value="neonEmerald">Esmeralda Neón 💎</option>
                      <option value="neonSky">Cielo Neón ☀️</option>
                      <option value="neonGold">Dorado Neón 🏆</option>
                    </select>
                  </div>
                </div>

                {candidates.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCandidate(index)}
                    className="text-red-400 text-sm mt-2 flex items-center"
                  >
                    ❌ Eliminar candidato
                  </button>
                )}

                {/* Vista previa de imagen */}
                {(candidate.photoPreview || candidate.photoUrl) && (
                  <div className="mt-3">
                    <label className="text-gray-400 text-sm block mb-1">Vista previa:</label>
                    <img
                      src={candidate.photoPreview || candidate.photoUrl}
                      alt={candidate.name || "Candidato"}
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-600"
                      onError={(e) => {
                        e.currentTarget.src = 'https://placehold.co/160?text=Foto+no+válida';
                        e.currentTarget.className = 'w-16 h-16 rounded-full object-cover border-2 border-red-500';
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3.5 bg-gradient-to-r from-neonGreen to-neonBlue text-gray-900 font-bold rounded-xl hover:opacity-90 transition"
        >
          🚀 Crear Encuesta
        </button>
      </form>

      {/* Mostrar enlace si ya se creó */}
      {newPollLink && (
        <div className="mt-6 p-4 bg-gray-900/50 rounded-xl border border-neonCyan">
          <p className="text-neonCyan font-medium mb-2">🔗 Enlace permanente de la encuesta:</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newPollLink}
              readOnly
              className="flex-1 p-2 bg-gray-800 text-white rounded-lg text-sm"
            />
            <button
              onClick={copyToClipboard}
              className="px-3 py-2 bg-neonCyan text-gray-900 font-bold rounded-lg hover:bg-cyan-400"
            >
              📋 Copiar
            </button>
            <button
              onClick={shareViaWhatsApp}
              className="px-3 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500"
            >
              📱 WhatsApp
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
