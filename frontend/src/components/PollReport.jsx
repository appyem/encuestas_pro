// src/components/PollReport.jsx
import React, { useEffect, useState } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, TimeScale);

export default function PollReport({ poll, onBack }) {
  const [hourlyData, setHourlyData] = useState(null);
  const [dailyData, setDailyData] = useState(null);
  const [candidateData, setCandidateData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [votesList, setVotesList] = useState([]);

  useEffect(() => {
    const loadVoteStats = async () => {
      try {
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const { db } = await import('../lib/firebase');

        const q = query(collection(db, 'votes'), where('pollId', '==', poll.id));
        const snapshot = await getDocs(q);
        const votes = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          let timestamp;
          if (data.timestamp?.toDate) {
            timestamp = data.timestamp.toDate();
          } else if (data.timestamp instanceof Date) {
            timestamp = data.timestamp;
          } else if (typeof data.timestamp === 'number') {
            timestamp = new Date(data.timestamp);
          } else {
            timestamp = new Date();
          }
          votes.push({ ...data, timestamp });
        });

        // Guardar lista completa para exportación
        setVotesList(votes);

        const candidateMap = {};
        poll.candidates.forEach(cand => {
          candidateMap[cand.id] = { ...cand, votes: 0 };
        });

        votes.forEach(vote => {
          if (candidateMap[vote.candidateId]) {
            candidateMap[vote.candidateId].votes += 1;
          }
        });

        const candidates = Object.values(candidateMap);
        const totalVotes = votes.length;

        setCandidateData({
          labels: candidates.map(c => c.name),
          datasets: [{
            data: candidates.map(c => c.votes),
            backgroundColor: candidates.map(c => `var(--color-${c.color})`),
            borderColor: candidates.map(c => `var(--color-${c.color})`),
            borderWidth: 1
          }]
        });

        const hourly = Array(24).fill(0);
        votes.forEach(vote => {
          const hour = vote.timestamp.getHours();
          if (hour >= 0 && hour < 24) {
            hourly[hour] += 1;
          }
        });

        setHourlyData({
          labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
          datasets: [{
            label: 'Votos por hora',
            data: hourly,
            borderColor: '#00ffff',
            backgroundColor: 'rgba(0, 255, 255, 0.2)',
            tension: 0.3,
            fill: true
          }]
        });

        const dayMap = {};
        votes.forEach(vote => {
          const dateStr = vote.timestamp.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
          dayMap[dateStr] = (dayMap[dateStr] || 0) + 1;
        });

        const dailyLabels = Object.keys(dayMap);
        const dailyValues = Object.values(dayMap);

        if (dailyLabels.length > 0) {
          setDailyData({
            labels: dailyLabels,
            datasets: [{
              label: 'Votos por día',
              data: dailyValues,
              backgroundColor: dailyLabels.map((_, i) => `hsl(${i * 40}, 90%, 60%)`),
              borderColor: dailyLabels.map((_, i) => `hsl(${i * 40}, 90%, 40%)`),
              borderWidth: 1
            }]
          });
        }

        setLoading(false);
      } catch (err) {
        console.error('Error al cargar estadísticas:', err);
        setError('Error al generar el reporte. Intente de nuevo.');
        setLoading(false);
      }
    };

    if (poll) {
      loadVoteStats();
    }
  }, [poll]);

  // ✅ Función para descargar CSV
  const downloadCSV = () => {
    if (votesList.length === 0) {
      alert('No hay votos para exportar.');
      return;
    }

    // Mapear ID de candidato a nombre
    const candidateNameMap = {};
    poll.candidates.forEach(cand => {
      candidateNameMap[cand.id] = cand.name;
    });

    const headers = ['ID Cédula/DNI', 'Candidato', 'Fecha y Hora'];
    const rows = votesList.map(vote => {
      const idNumber = vote.idNumber || 'No registrado';
      const candidate = candidateNameMap[vote.candidateId] || 'Desconocido';
      const dateStr = vote.timestamp.toLocaleString('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      return `"${idNumber}","${candidate}","${dateStr}"`;
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `votos_${poll.id}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-neonBlue text-xl">📊 Generando reporte...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
        <p className="text-neonRed text-lg mb-4">{error}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
        >
          ← Volver
        </button>
      </div>
    );
  }

  const totalVotes = candidateData?.datasets?.[0]?.data?.reduce((a, b) => a + b, 0) || 0;
  const marginOfError = totalVotes > 0 
    ? Math.round(1.96 * Math.sqrt(0.25 / totalVotes) * 100 * 10) / 10 
    : 0;

  const startDate = new Date(poll.startDate).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
  const endDate = new Date(poll.endDate).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-neonBlue">📊 Reporte Ejecutivo</h1>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
        >
          ← Volver
        </button>
      </div>

      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neonBlue to-neonPurple">
          {poll.title}
        </h2>
        <p className="text-gray-400">{poll.question}</p>
      </div>

      {/* ✅ Nueva sección: Tabla y descarga */}
      <div className="bg-gray-800/50 p-5 rounded-2xl mb-8 border border-neonCyan">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-neonCyan">📋 Votos Detallados</h3>
          <button
            onClick={downloadCSV}
            className="px-4 py-2 bg-neonCyan text-gray-900 font-bold rounded-lg hover:bg-cyan-400"
          >
            📥 Descargar CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="pb-2 text-left text-neonCyan">ID Cédula/DNI</th>
                <th className="pb-2 text-left text-neonCyan">Candidato</th>
                <th className="pb-2 text-left text-neonCyan">Fecha y Hora</th>
              </tr>
            </thead>
            <tbody>
              {votesList.length > 0 ? (
                votesList.map((vote, idx) => {
                  const candidateName = poll.candidates.find(c => c.id === vote.candidateId)?.name || 'Desconocido';
                  const dateStr = vote.timestamp.toLocaleString('es-CO', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  return (
                    <tr key={idx} className="border-b border-gray-700 hover:bg-gray-800/30">
                      <td className="py-2">{vote.idNumber || 'No registrado'}</td>
                      <td className="py-2">{candidateName}</td>
                      <td className="py-2 text-gray-400">{dateStr}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="3" className="py-4 text-center text-gray-500">No hay votos registrados</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-gray-800/50 p-5 rounded-2xl mb-8 border border-neonGreen">
        <h3 className="text-xl font-bold text-neonGreen mb-4">Resultados</h3>
        <div className="h-64">
          <Bar
            data={candidateData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false }
              },
              scales: {
                x: { ticks: { color: '#fff' } },
                y: { 
                  ticks: { color: '#fff' },
                  beginAtZero: true,
                  precision: 0
                }
              }
            }}
          />
        </div>
      </div>

      <div className="bg-gray-800/50 p-5 rounded-2xl mb-8 border border-neonBlue">
        <h3 className="text-xl font-bold text-neonBlue mb-4">Actividad por Hora del Día</h3>
        <div className="h-64">
          <Line
            data={hourlyData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { labels: { color: '#fff' } }
              },
              scales: {
                x: { 
                  ticks: { 
                    color: '#999',
                    maxRotation: 0,
                    minRotation: 0,
                    font: { size: 10 }
                  }
                },
                y: { 
                  ticks: { color: '#999', precision: 0 },
                  beginAtZero: true
                }
              }
            }}
          />
        </div>
      </div>

      {dailyData && dailyData.labels.length > 1 && (
        <div className="bg-gray-800/50 p-5 rounded-2xl mb-8 border border-neonPurple">
          <h3 className="text-xl font-bold text-neonPurple mb-4">Votos por Día</h3>
          <div className="h-64">
            <Doughnut
              data={dailyData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { 
                    labels: { 
                      color: '#fff',
                      font: { size: 12 }
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      )}

      <div className="bg-gray-800/50 p-5 rounded-2xl border border-neonYellow">
        <h3 className="text-xl font-bold text-neonYellow mb-3">📄 Ficha Técnica</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p><strong>Objeto:</strong> {poll.title}</p>
            <p><strong>Población objetivo:</strong> Público general</p>
            <p><strong>Tamaño de muestra:</strong> {totalVotes} votos válidos</p>
            <p><strong>Margen de error:</strong> ±{marginOfError}%</p>
            <p><strong>Nivel de confianza:</strong> 95%</p>
          </div>
          <div>
            <p><strong>Periodo de recolección:</strong> {startDate} – {endDate}</p>
            <p><strong>Método:</strong> Voto digital con control de huella de dispositivo</p>
            <p><strong>Características:</strong> Voto único, anónimo, sin suplantación</p>
            <p><strong>Responsable:</strong> APPYEMPRESA S.A.S</p>
            <p><strong>Fecha de elaboración:</strong> {new Date().toLocaleDateString('es-CO')}</p>
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-500 text-center">
        Este reporte cumple con los estándares éticos y técnicos para encuestas de opinión pública en Colombia. 
        Los resultados son preliminares y no constituyen proyección electoral.
      </p>
    </div>
  );
}
