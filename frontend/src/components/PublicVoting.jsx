// src/components/PublicVoting.jsx
import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, getDocs, query, where, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

// ✅ Detectar si el dispositivo es móvil
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export default function PublicVoting({ pollIdFromRoute = null }) {
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [voted, setVoted] = useState(false);
  const [votedMessage, setVotedMessage] = useState('');
  const [fingerprint, setFingerprint] = useState(null);

  // ✅ Verificar dispositivo al cargar
  useEffect(() => {
    if (!isMobileDevice()) {
      setError('Esta encuesta solo está disponible en dispositivos móviles (celulares).');
      setLoading(false);
      return;
    }
  }, []);

  useEffect(() => {
    const loadFingerprint = async () => {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      setFingerprint(result.visitorId);
    };
    loadFingerprint();
  }, []);

  useEffect(() => {
    // ✅ No cargar encuesta si no es móvil
    if (error === 'Esta encuesta solo está disponible en dispositivos móviles (celulares).') {
      return;
    }

    const loadPoll = async () => {
      setError('');
      setLoading(true);

      try {
        let pollData = null;
        let pollDocRef = null;

        if (pollIdFromRoute) {
          const docSnap = await getDoc(doc(db, 'polls', pollIdFromRoute));
          if (docSnap.exists()) {
            pollData = { id: docSnap.id, ...docSnap.data() };
            pollDocRef = doc(db, 'polls', pollIdFromRoute);
          } else {
            setError('Encuesta no encontrada.');
            setLoading(false);
            return;
          }
        } else {
          const q = query(
            collection(db, 'polls'),
            where('status', 'in', ['active', 'scheduled'])
          );
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            for (const docSnap of querySnapshot.docs) {
              const data = docSnap.data();
              const now = Date.now();
              if (data.startDate <= now && now <= data.endDate) {
                pollData = { id: docSnap.id, ...data };
                pollDocRef = docSnap.ref;
                break;
              }
            }
            if (!pollData) {
              setError('No hay encuestas activas en este momento.');
            }
          } else {
            setError('No hay encuestas disponibles.');
          }
        }

        if (pollData && pollDocRef) {
          const now = Date.now();
          if (now < pollData.startDate) {
            setError('La encuesta aún no ha iniciado.');
          } else if (now > pollData.endDate) {
            if (pollData.status !== 'closed') {
              try {
                await updateDoc(pollDocRef, { status: 'closed' });
                console.log(`Encuesta ${pollData.id} cerrada automáticamente.`);
              } catch (updateErr) {
                console.warn('No se pudo actualizar el estado a "closed":', updateErr);
              }
            }
            setError('La encuesta ya ha finalizado.');
          } else {
            setPoll(pollData);
          }
        }
      } catch (err) {
        console.error('Error al cargar encuesta:', err);
        setError('Error al cargar la encuesta.');
      } finally {
        setLoading(false);
      }
    };

    loadPoll();
  }, [pollIdFromRoute, error]);

  useEffect(() => {
    if (poll && fingerprint) {
      const voteKey = `vote_${poll.id}_${fingerprint}`;
      if (localStorage.getItem(voteKey)) {
        setVoted(true);
        setVotedMessage('¡Ya participaste! Gracias por tu voto. 🙌');
      }
    }
  }, [poll, fingerprint]);

  const handleVote = async (candidate) => {
    if (!poll || !fingerprint || voted || !candidate.id) return;
    try {
      await addDoc(collection(db, 'votes'), {
        pollId: poll.id,
        candidateId: candidate.id,
        candidateName: candidate.name,
        fingerprint: fingerprint,
        timestamp: serverTimestamp(),
      });
      localStorage.setItem(`vote_${poll.id}_${fingerprint}`, 'true');
      setVoted(true);
      setVotedMessage(`¡Votaste por ${candidate.name}! ✨🗳️`);
    } catch (err) {
      alert('❌ Error al registrar tu voto. Inténtalo de nuevo.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-4">
        <p className="text-2xl font-bold text-neonBlue drop-shadow-[0_0_10px_rgba(0,255,255,0.7)]">
          🔮 Cargando...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">📱</div>
          <h2 className="text-xl font-bold text-neonRed mb-2">Acceso Restringido</h2>
          <p className="text-gray-400">{error}</p>
          <p className="text-gray-500 text-sm mt-3">
            Por seguridad de la encuesta, solo se permite votar desde teléfonos móviles.
          </p>
        </div>
      </div>
    );
  }

  if (voted) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-b from-gray-900 to-black flex flex-col items-center justify-center p-4 text-center">
        <div className="neon-pulse mb-6">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-neonGreen to-neonYellow">
            ¡Gracias por votar! ✅
          </h1>
        </div>
        <p className="text-xl text-neonPink max-w-md mb-8">{votedMessage}</p>
        <div className="neon-border px-6 py-3 rounded-full bg-gray-800/70 backdrop-blur-sm">
          <p className="text-neonCyan font-medium">Tu voto es único y seguro 🔒</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-gray-900 to-black flex flex-col items-center p-4 pt-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-neonBlue to-neonPurple">
            🗳️ {poll.title}
          </h1>
          <p className="mt-3 text-gray-300 text-lg">{poll.question}</p>
        </div>

        <div className="space-y-5">
          {poll.candidates.map((candidate) => (
            <div
              key={candidate.id}
              className="bg-gray-800/70 backdrop-blur-sm rounded-2xl p-4 flex items-center border border-transparent transition-all duration-300 shadow-lg hover:shadow-xl"
              style={{
                borderColor: `var(--color-${candidate.color})`,
                boxShadow: `0 4px 20px rgba(0,0,0,0.5), 0 0 15px var(--color-${candidate.color}, rgba(255,0,255,0.15))`,
              }}
            >
              <img
                src={candidate.photoUrl || 'https://placehold.co/80'}
                alt={candidate.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-700"
                onError={(e) => (e.currentTarget.src = 'https://placehold.co/80')}
              />
              <div className="ml-4 flex-1">
                <h3 className="font-bold text-white">{candidate.name}</h3>
                <p className="text-gray-400 text-sm">{candidate.party}</p>
              </div>
              <button
                onClick={() => handleVote(candidate)}
                className={`px-5 py-2.5 rounded-full font-bold text-gray-900 transition-transform duration-200 hover:scale-105 ${
                  candidate.color === 'neonPink'
                    ? 'bg-neonPink hover:bg-pink-400'
                    : candidate.color === 'neonBlue'
                    ? 'bg-neonBlue hover:bg-cyan-400'
                    : candidate.color === 'neonGreen'
                    ? 'bg-neonGreen hover:bg-green-400'
                    : candidate.color === 'neonYellow'
                    ? 'bg-neonYellow hover:bg-yellow-400'
                    : candidate.color === 'neonPurple'
                    ? 'bg-neonPurple hover:bg-purple-400'
                    : candidate.color === 'neonRed'
                    ? 'bg-neonRed hover:bg-red-400'
                    : candidate.color === 'red'
                    ? 'bg-red hover:bg-red-500'
                    : candidate.color === 'greenLight'
                    ? 'bg-greenLight hover:bg-green-300 text-gray-900'
                    : candidate.color === 'greenDark'
                    ? 'bg-greenDark hover:bg-green-700 text-white'
                    : candidate.color === 'blueLight'
                    ? 'bg-blueLight hover:bg-blue-300 text-gray-900'
                    : candidate.color === 'neonOrange'
                    ? 'bg-neonOrange hover:bg-orange-400'
                    : candidate.color === 'neonCoral'
                    ? 'bg-neonCoral hover:bg-rose-400'
                    : candidate.color === 'neonTeal'
                    ? 'bg-neonTeal hover:bg-teal-400'
                    : candidate.color === 'neonLime'
                    ? 'bg-neonLime hover:bg-lime-400 text-gray-900'
                    : candidate.color === 'neonIndigo'
                    ? 'bg-neonIndigo hover:bg-indigo-400'
                    : candidate.color === 'neonEmerald'
                    ? 'bg-neonEmerald hover:bg-emerald-400'
                    : candidate.color === 'neonSky'
                    ? 'bg-neonSky hover:bg-sky-300 text-gray-900'
                    : candidate.color === 'neonGold'
                    ? 'bg-neonGold hover:bg-yellow-400 text-gray-900'
                    : 'bg-gray-500 hover:bg-gray-400'
                }`}
              >
                ✅ Elegir
              </button>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-gray-500 text-sm">
          🔒 Encuesta segura • Voto único • <span className="text-neonBlue">Encuestas Pro</span>
        </p>
      </div>
    </div>
  );
}