// src/components/AdminPanel.jsx
import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import CreatePollForm from './CreatePollForm';
import EditPollForm from './EditPollForm';
import PollReport from './PollReport';

// ✅ Logo de la aplicación
const APP_LOGO = "https://raw.githubusercontent.com/appyem/im-genes-candidatos-/refs/heads/main/logo.png";

function openWhatsApp(message) {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const encodedMessage = encodeURIComponent(message);
  
  if (isMobile) {
    window.location.href = `whatsapp://send?text=${encodedMessage}`;
  } else {
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  }
}

export default function AdminPanel() {
  const [currentView, setCurrentView] = useState('results');
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [results, setResults] = useState({});
  const [realVoteCounts, setRealVoteCounts] = useState({});
  const [pollToEdit, setPollToEdit] = useState(null);
  const [isManualMode, setIsManualMode] = useState(false);
  const [votersList, setVotersList] = useState([]);
  const [showVotersModal, setShowVotersModal] = useState(false);
  const [selectedCandidateForVoters, setSelectedCandidateForVoters] = useState(null);

  const loadPolls = async () => {
    try {
      const q = query(collection(db, 'polls'), where('creator', '==', auth.currentUser.email));
      const snapshot = await getDocs(q);
      const pollsList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPolls(pollsList);
      if (pollsList.length > 0 && !selectedPoll && currentView === 'results') {
        setSelectedPoll(pollsList[0]);
      }
    } catch (err) {
      console.error('Error al cargar encuestas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolls();
  }, []);

  // ✅ Mantener la escucha EN TODO MOMENTO (incluso en modo manual)
  useEffect(() => {
    if (currentView !== 'results' || !selectedPoll) return;

    const unsubscribe = onSnapshot(
      query(collection(db, 'votes'), where('pollId', '==', selectedPoll.id)),
      (snapshot) => {
        const allVotes = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          allVotes.push({
            id: doc.id,
            candidateId: data.candidateId,
            idNumber: data.idNumber || 'No registrado',
          });
        });

        const counts = {};
        selectedPoll.candidates.forEach((cand) => (counts[cand.id] = 0));
        allVotes.forEach((vote) => {
          if (counts[vote.candidateId] !== undefined) counts[vote.candidateId] += 1;
        });
        setRealVoteCounts(counts);
        setVotersList(allVotes);
      }
    );
    return () => unsubscribe();
  }, [selectedPoll, currentView]);

  // ✅ Calcular resultados finales: baseVotes + votos reales
  const finalVoteCounts = {};
  if (selectedPoll) {
    selectedPoll.candidates.forEach(cand => {
      const base = cand.baseVotes || 0;
      const real = realVoteCounts[cand.id] || 0;
      finalVoteCounts[cand.id] = base + real;
    });
  }

  const totalVotes = Object.values(finalVoteCounts).reduce((sum, val) => sum + val, 0);
  const maxVotes = Math.max(...Object.values(finalVoteCounts), 1);

  // ✅ Actualizar el estado de resultados para el formulario de edición
  useEffect(() => {
    if (selectedPoll) {
      const hasManual = selectedPoll.candidates.some(cand => cand.baseVotes !== undefined);
      setIsManualMode(hasManual);
      const editResults = {};
      selectedPoll.candidates.forEach(cand => {
        editResults[cand.id] = cand.baseVotes || 0;
      });
      setResults(editResults);
    }
  }, [selectedPoll]);

  const handleResultChange = (candidateId, value) => {
    const numValue = value === '' ? 0 : parseInt(value, 10) || 0;
    setResults((prev) => ({ ...prev, [candidateId]: numValue }));
  };

  const handleSaveResults = async () => {
    if (!selectedPoll) return;
    if (!window.confirm('⚠️ ¿Estás seguro de añadir estos votos simulados? Se sumarán a los votos reales.')) {
      return;
    }
    try {
      const updatedCandidates = selectedPoll.candidates.map((cand) => ({
        ...cand,
        baseVotes: results[cand.id] || 0
      }));
      await updateDoc(doc(db, 'polls', selectedPoll.id), { candidates: updatedCandidates });
      alert('✅ Votos simulados añadidos exitosamente');
    } catch (err) {
      console.error('Error al guardar:', err);
      alert('❌ Error al guardar');
    }
  };

  const handleResetToReal = async () => {
    if (!selectedPoll) return;
    try {
      const updatedCandidates = selectedPoll.candidates.map((cand) => ({
        ...cand,
        baseVotes: 0
      }));
      await updateDoc(doc(db, 'polls', selectedPoll.id), { candidates: updatedCandidates });
      alert('✅ Votos simulados eliminados');
    } catch (err) {
      console.error('Error al restaurar:', err);
      alert('❌ Error al restaurar');
    }
  };

  const handleLogout = () => signOut(auth);

  const startEditing = (poll) => {
    setPollToEdit(poll);
    setCurrentView('edit');
  };

  const handleClosePoll = async () => {
    if (!selectedPoll) return;
    if (window.confirm('¿Seguro que deseas cerrar esta encuesta? Ya no se permitirán más votos.')) {
      try {
        await updateDoc(doc(db, 'polls', selectedPoll.id), { status: 'closed' });
        const updatedPolls = polls.map(poll =>
          poll.id === selectedPoll.id ? { ...poll, status: 'closed' } : poll
        );
        setPolls(updatedPolls);
        setSelectedPoll(prev => prev ? { ...prev, status: 'closed' } : null);
        alert('✅ Encuesta cerrada exitosamente');
      } catch (err) {
        console.error('Error al cerrar encuesta:', err);
        alert('❌ Error al cerrar la encuesta');
      }
    }
  };

  const handleDeletePoll = async () => {
    if (!selectedPoll) return;
    if (window.confirm('⚠️ ¿Eliminar permanentemente esta encuesta y todos sus votos? Esta acción no se puede deshacer.')) {
      try {
        await deleteDoc(doc(db, 'polls', selectedPoll.id));
        const votesQuery = query(collection(db, 'votes'), where('pollId', '==', selectedPoll.id));
        const votesSnapshot = await getDocs(votesQuery);
        const deleteVotesPromises = votesSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deleteVotesPromises);

        const updatedPolls = polls.filter(poll => poll.id !== selectedPoll.id);
        setPolls(updatedPolls);
        setSelectedPoll(updatedPolls.length > 0 ? updatedPolls[0] : null);
        alert('✅ Encuesta eliminada exitosamente');
      } catch (err) {
        console.error('Error al eliminar encuesta:', err);
        alert('❌ Error al eliminar la encuesta');
      }
    }
  };

  const openVotersModal = (candidate) => {
    const filtered = votersList
      .filter(vote => vote.candidateId === candidate.id)
      .map(vote => vote.idNumber)
      .filter(id => id && id !== 'No registrado');

    setSelectedCandidateForVoters({
      ...candidate,
      voterIds: filtered.length > 0 ? filtered : ['Ningún voto con ID registrado']
    });
    setShowVotersModal(true);
  };

  const handleEditComplete = () => {
    setCurrentView('results');
    setPollToEdit(null);
    loadPolls();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <p className="text-2xl font-bold text-neonPurple">📊 Cargando panel...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <img 
              src={APP_LOGO} 
              alt="Encuestas Pro" 
              className="w-10 h-10 mr-3 rounded-full"
            />
            <h1 className="text-2xl font-extrabold">
              Panel de Administración
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-800 text-neonRed border border-neonRed rounded-xl hover:bg-gray-700 transition flex items-center"
          >
            <span className="mr-2">Salir</span>
          </button>
        </div>

        {currentView === 'report' && selectedPoll ? (
          <PollReport 
            poll={selectedPoll} 
            onBack={() => setCurrentView('results')} 
          />
        ) : currentView === 'create' ? (
          <CreatePollForm onPollCreated={loadPolls} />
        ) : currentView === 'edit' ? (
          <EditPollForm poll={pollToEdit} onEditComplete={handleEditComplete} />
        ) : (
          <>
            {polls.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">📭</div>
                <h2 className="text-xl font-bold text-gray-300 mb-2">No tienes encuestas</h2>
                <button
                  onClick={() => setCurrentView('create')}
                  className="mt-4 px-6 py-2 bg-neonBlue text-gray-900 font-bold rounded-xl"
                >
                  ➕ Crear ahora
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 border border-gray-700 flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-neonBlue text-sm font-medium mb-2">Encuesta activa:</label>
                    <select
                      value={selectedPoll?.id || ''}
                      onChange={(e) => {
                        const poll = polls.find((p) => p.id === e.target.value);
                        setSelectedPoll(poll);
                      }}
                      className="w-full bg-gray-900 text-white p-3 rounded-xl border border-gray-700 focus:ring-2 focus:ring-neonBlue"
                    >
                      {polls.map((poll) => (
                        <option key={poll.id} value={poll.id}>
                          {poll.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end gap-2 w-full md:w-auto flex-wrap">
                    <button
                      onClick={() => startEditing(selectedPoll)}
                      className="px-4 py-3 bg-neonPurple text-gray-900 font-bold rounded-xl hover:bg-purple-400 flex-1 min-w-[100px]"
                    >
                      ✏️ Editar
                    </button>
                    {selectedPoll && selectedPoll.status !== 'closed' && (
                      <button
                        onClick={handleClosePoll}
                        className="px-4 py-3 bg-neonRed text-white font-bold rounded-xl hover:bg-red-600 flex-1 min-w-[100px]"
                      >
                        🔒 Cerrar
                      </button>
                    )}
                    <button
                      onClick={() => setCurrentView('report')}
                      className="px-4 py-3 bg-neonGreen text-gray-900 font-bold rounded-xl hover:bg-green-400 flex-1 min-w-[100px]"
                    >
                      📊 Reporte
                    </button>
                    <button
                      onClick={handleDeletePoll}
                      className="px-4 py-3 bg-gray-700 text-neonRed font-bold rounded-xl hover:bg-gray-600 flex-1 min-w-[100px]"
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>

                {selectedPoll && (
                  <div className="p-3 bg-gray-900/40 rounded-lg border border-neonCyan">
                    <p className="text-sm text-neonCyan mb-1">🔗 Enlace de la encuesta:</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={`${window.location.origin}/encuesta/${selectedPoll.id}`}
                        readOnly
                        className="flex-1 p-2 bg-gray-800 text-white rounded text-xs"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/encuesta/${selectedPoll.id}`);
                          alert('✅ Enlace copiado');
                        }}
                        className="px-3 py-1.5 bg-neonCyan text-gray-900 text-xs font-bold rounded"
                      >
                        📋 Copiar
                      </button>
                    </div>
                  </div>
                )}

                {/* ✅ RESULTADOS EN VIVO */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-5 border border-neonGreen">
                  <div className="flex justify-between items-center mb-5">
                    <h2 className="text-xl font-bold text-neonGreen">Resultados En Vivo 📈</h2>
                    {totalVotes > 0 && (
                      <span className="px-3 py-1 bg-neonGreen/20 text-neonGreen rounded-full text-sm font-medium">
                        {totalVotes} votos 
                      </span>
                    )}
                  </div>
                  <div className="space-y-5">
                    {selectedPoll?.candidates.map((cand) => {
                      const votes = finalVoteCounts[cand.id] || 0;
                      const percentage = totalVotes ? Math.round((votes / totalVotes) * 100) : 0;
                      const width = totalVotes ? (votes / maxVotes) * 100 : 0;
                      return (
                        <div key={cand.id} className="flex items-center">
                          <img
                            src={cand.photoUrl || 'https://placehold.co/40'}
                            alt={cand.name}
                            className="w-10 h-10 rounded-full mr-3 border-2 border-gray-700"
                          />
                          <div className="flex-1">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium text-white">
                                {cand.name}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openVotersModal(cand);
                                  }}
                                  className="ml-2 text-xs bg-gray-700 hover:bg-gray-600 text-neonCyan px-2 py-1 rounded"
                                >
                                  👤 Ver IDs
                                </button>
                              </span>
                              <span className={`font-bold ${isManualMode ? 'text-neonPink' : 'text-neonYellow'}`}>
                                {votes} ({percentage}%)
                              </span>
                            </div>
                            <div className="h-5 bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  cand.color === 'neonPink'
                                    ? 'bg-neonPink'
                                    : cand.color === 'neonBlue'
                                    ? 'bg-neonBlue'
                                    : cand.color === 'neonGreen'
                                    ? 'bg-neonGreen'
                                    : cand.color === 'neonYellow'
                                    ? 'bg-neonYellow'
                                    : cand.color === 'neonPurple'
                                    ? 'bg-neonPurple'
                                    : cand.color === 'neonRed'
                                    ? 'bg-neonRed'
                                    : cand.color === 'red'
                                    ? 'bg-red'
                                    : cand.color === 'greenLight'
                                    ? 'bg-greenLight'
                                    : cand.color === 'greenDark'
                                    ? 'bg-greenDark'
                                    : cand.color === 'blueLight'
                                    ? 'bg-blueLight'
                                    : cand.color === 'neonOrange'
                                    ? 'bg-neonOrange'
                                    : cand.color === 'neonCoral'
                                    ? 'bg-neonCoral'
                                    : cand.color === 'neonTeal'
                                    ? 'bg-neonTeal'
                                    : cand.color === 'neonLime'
                                    ? 'bg-neonLime'
                                    : cand.color === 'neonIndigo'
                                    ? 'bg-neonIndigo'
                                    : cand.color === 'neonEmerald'
                                    ? 'bg-neonEmerald'
                                    : cand.color === 'neonSky'
                                    ? 'bg-neonSky'
                                    : cand.color === 'neonGold'
                                    ? 'bg-neonGold'
                                    : 'bg-gray-500'
                                }`}
                                style={{ width: `${width}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-5 border border-neonPurple">
                  <h3 className="text-lg font-bold text-neonPurple mb-3 flex items-center">
                    ✏️ Edición Manual de Resultados
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    {isManualMode 
                      ? 'Los valores que ingreses se cambiaran por los votos reales.' 
                      : 'Ingresa votos simulados que se sumarán a los reales.'}
                  </p>
                  <div className="space-y-3">
                    {selectedPoll?.candidates.map((cand) => (
                      <div key={`edit-${cand.id}`} className="flex items-center">
                        <span className="w-40 font-medium text-white">{cand.name}</span>
                        <input
                          type="number"
                          min="0"
                          value={results[cand.id] || 0}
                          onChange={(e) => handleResultChange(cand.id, e.target.value)}
                          className={`w-24 p-2 text-center font-bold rounded-lg border bg-opacity-20 ${
                            cand.color === 'neonPink'
                              ? 'bg-neonPink/20 border-neonPink'
                              : cand.color === 'neonBlue'
                              ? 'bg-neonBlue/20 border-neonBlue'
                              : cand.color === 'neonGreen'
                              ? 'bg-neonGreen/20 border-neonGreen'
                              : cand.color === 'neonYellow'
                              ? 'bg-neonYellow/20 border-neonYellow'
                              : 'bg-neonPurple/20 border-neonPurple'
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={handleSaveResults}
                      className="flex-1 py-3 bg-gradient-to-r from-neonYellow to-neonPink text-gray-900 font-bold rounded-xl hover:opacity-90 transition"
                    >
                      💾 Añadir Votos Simulados
                    </button>
                    {isManualMode && (
                      <button
                        onClick={handleResetToReal}
                        className="flex-1 py-3 bg-gray-700 text-white font-bold rounded-xl hover:bg-gray-600 transition"
                      >
                        ↩️ Solo Reales
                      </button>
                    )}
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => {
                      if (!selectedPoll) {
                        alert('Selecciona una encuesta primero.');
                        return;
                      }
                      const startDate = new Date(selectedPoll.startDate).toLocaleDateString('es-CO', {
                        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      });
                      const endDate = new Date(selectedPoll.endDate).toLocaleDateString('es-CO', {
                        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      });
                      const shareMessage = `🗳️ *¡Participa en la encuesta!*  

*${selectedPoll.title}*

${selectedPoll.question}

📅 *Periodo:* ${startDate} – ${endDate}

👉 ${window.location.origin}/encuesta/${selectedPoll.id}

🔒 Voto único por dispositivo  
🇨🇴 APPYEMPRESA S.A.S

¿Quieres usar esta aplicación de encuestas digitales o conocer más resultados?  
Escríbenos al WhatsApp: *+57 321 5179153*`;
                      openWhatsApp(shareMessage);
                    }}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-lg"
                  >
                    <span>📲</span> Compartir encuesta por WhatsApp
                  </button>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => {
                      if (!selectedPoll || totalVotes === 0) {
                        alert('No hay votos para generar resultados.');
                        return;
                      }
                      const winner = selectedPoll.candidates.reduce((prev, current) =>
                        (finalVoteCounts[current.id] || 0) > (finalVoteCounts[prev.id] || 0) ? current : prev
                      );
                      const startDate = new Date(selectedPoll.startDate).toLocaleDateString('es-CO', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      });
                      const endDate = new Date(selectedPoll.endDate).toLocaleDateString('es-CO', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      });
                      const marginOfError = totalVotes > 0 ? Math.round(1.96 * Math.sqrt(0.25 / totalVotes) * 100 * 10) / 10 : 0;
                      const resultLines = selectedPoll.candidates.map((cand) => {
                        const votes = finalVoteCounts[cand.id] || 0;
                        const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                        return `• ${cand.name} (${cand.party}) – *${votes}* votos (${pct}%)`;
                      });
                      const message = `🇨🇴 *ENCUESTA ELECTORAL – COLOMBIA*

🗳️ *${selectedPoll.title}*

*Resultados Preliminares:*
${resultLines.join('\n')}

🏅 *Líder: ${winner.name}*

📊 *Ficha Técnica:*
• 📋 Muestra: ${totalVotes} votos únicos
• 📅 Periodo: ${startDate} – ${endDate}
• ⚖️ Margen de error: ±${marginOfError}% (95% confianza)
• 🔐 Sin login – Voto anónimo y único
• 🚫 Prohibida la suplantación

✅ *Certificación:*
Sistema con huella digital de dispositivo.  
Voto único garantizado. Resultados no manipulables.

📱 *Desarrollado por APPYEMPRESA S.A.S*  
*¡Tecnología al servicio de la democracia colombiana! 💚💛❤️

¿Deseas implementar encuestas digitales en tu organización?  
Escríbenos al WhatsApp: *+57 321 5179153*`;
                      openWhatsApp(message);
                    }}
                    className="w-full py-3.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-lg"
                  >
                    <span>📱</span> Enviar resultados por WhatsApp
                  </button>
                </div>
              </div>
            )}

            {polls.length > 0 && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => setCurrentView('create')}
                  className="px-6 py-2 bg-gray-800 text-neonBlue border border-neonBlue rounded-xl hover:bg-gray-700"
                >
                  ➕ Crear Nueva Encuesta
                </button>
              </div>
            )}
          </>
        )}

        {/* Modal de votantes por identificación */}
        {showVotersModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
              <div className="p-4 border-b border-neonCyan bg-gray-900">
                <h3 className="text-lg font-bold text-neonCyan">
                  🪪 Votantes: {selectedCandidateForVoters?.name}
                </h3>
                <p className="text-gray-400 text-sm">
                  Total: {selectedCandidateForVoters?.voterIds?.length || 0} identificaciones
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 bg-gray-900/50">
                {selectedCandidateForVoters?.voterIds?.length > 0 ? (
                  <ul className="space-y-2">
                    {selectedCandidateForVoters.voterIds.map((id, idx) => (
                      <li
                        key={idx}
                        className="bg-gray-800/60 p-2 rounded border border-gray-700 text-white text-sm"
                      >
                        {id}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-center">No hay identificaciones registradas.</p>
                )}
              </div>
              <div className="p-4 border-t border-gray-700 bg-gray-900">
                <button
                  onClick={() => setShowVotersModal(false)}
                  className="w-full py-2 bg-neonRed text-white rounded-lg font-medium"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
