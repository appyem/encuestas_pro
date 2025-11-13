// src/components/EditPollForm.jsx
import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function EditPollForm({ poll, onEditComplete }) {
  const [title, setTitle] = useState(poll.title);
  const [question, setQuestion] = useState(poll.question);
  const [candidates, setCandidates] = useState(
    poll.candidates.map(cand => ({
      name: cand.name,
      party: cand.party,
      color: cand.color,
      photoUrl: cand.photoUrl
    }))
  );

  useEffect(() => {
    setTitle(poll.title);
    setQuestion(poll.question);
    setCandidates(
      poll.candidates.map(cand => ({
        name: cand.name,
        party: cand.party,
        color: cand.color,
        photoUrl: cand.photoUrl
      }))
    );
  }, [poll]);

  const addCandidate = () => {
    setCandidates([...candidates, { name: '', party: '', color: 'neonPink', photoUrl: '' }]);
  };

  const updateCandidate = (index, field, value) => {
    const newCandidates = [...candidates];
    newCandidates[index][field] = value;
    setCandidates(newCandidates);
  };

  const removeCandidate = (index) => {
    if (candidates.length > 2) {
      setCandidates(candidates.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !question.trim()) {
      alert('⚠️ Debe ingresar título y pregunta.');
      return;
    }

    for (const cand of candidates) {
      if (!cand.name.trim() || !cand.party.trim() || !cand.photoUrl.trim()) {
        alert('⚠️ Todos los candidatos deben tener nombre, partido e imagen.');
        return;
      }
    }

    try {
      const updatedData = {
        title,
        question,
        candidates: candidates.map((cand, idx) => ({
          id: poll.candidates[idx]?.id || `cand_${Date.now()}_${idx}`,
          name: cand.name,
          party: cand.party,
          color: cand.color,
          photoUrl: cand.photoUrl
        }))
      };

      await updateDoc(doc(db, 'polls', poll.id), updatedData);
      alert('✅ Encuesta actualizada exitosamente');
      onEditComplete();
    } catch (err) {
      console.error('Error al editar encuesta:', err);
      alert('❌ Error al guardar los cambios.');
    }
  };

  if (!poll) return null;

  return (
    <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-neonPurple">
      <h2 className="text-2xl font-bold text-neonPurple mb-6 text-center">✏️ Editar Encuesta</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-gray-300 mb-2">Título</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 bg-gray-900 text-white rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-neonPurple"
            required
          />
        </div>

        <div>
          <label className="block text-gray-300 mb-2">Pregunta</label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full p-3 bg-gray-900 text-white rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-neonGreen"
            rows="2"
            required
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="block text-gray-300">Candidatos</label>
            <button
              type="button"
              onClick={addCandidate}
              className="text-neonYellow text-sm"
            >
              ➕ Agregar
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
                    placeholder="Partido"
                    value={candidate.party}
                    onChange={(e) => updateCandidate(index, 'party', e.target.value)}
                    className="p-2 bg-gray-800 text-white rounded-lg border border-gray-600"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <input
                    type="url"
                    placeholder="URL de la foto"
                    value={candidate.photoUrl}
                    onChange={(e) => updateCandidate(index, 'photoUrl', e.target.value)}
                    className="p-2 bg-gray-800 text-white rounded-lg border border-gray-600"
                    required
                  />
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

                {candidates.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCandidate(index)}
                    className="text-red-400 text-sm mt-2"
                  >
                    ❌ Eliminar
                  </button>
                )}

                {candidate.photoUrl && (
                  <div className="mt-2">
                    <img
                      src={candidate.photoUrl}
                      alt="Previsualización"
                      className="w-12 h-12 rounded-full object-cover border"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onEditComplete}
            className="flex-1 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600"
          >
            ← Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 py-3 bg-neonPurple text-gray-900 font-bold rounded-xl hover:bg-purple-400"
          >
            💾 Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  );
}