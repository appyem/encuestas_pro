// src/components/AuditReport.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, query, collection, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function AuditReport() {
  const { pollId } = useParams();
  const [poll, setPoll] = useState(null);
  const [AuditLogs, setAuditLogs] = useState([]);
  const [votesCount, setVotesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar encuesta
        const pollDoc = await getDoc(doc(db, 'polls', pollId));
        if (!pollDoc.exists()) {
          setError('Encuesta no encontrada.');
          setLoading(false);
          return;
        }
        const pollData = pollDoc.data();
        if (pollData.status !== 'closed') {
          setError('La encuesta aún no ha sido cerrada. El reporte de auditoría solo está disponible para encuestas finalizadas.');
          setLoading(false);
          return;
        }
        setPoll(pollData);

        // Primero, asegurarse de que la encuesta pertenece a un tenant válido
        if (!poll.tenantId) {
        setError('Encuesta no válida para auditoría.');
        setLoading(false);
        return;
        }

        const logsQuery = query(
        collection(db, 'Audit_logs'),
        where('pollId', '==', pollId),
        where('tenantId', '==', poll.tenantId), // ✅ NUEVO
        orderBy('timestamp', 'asc')
        );
        const logsSnapshot = await getDocs(logsQuery);
        const logs = [];
        logsSnapshot.forEach(doc => {
          const data = doc.data();
          logs.push({
            ...data,
            timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp)
          });
        });
        setAuditLogs(logs);

        // Cargar total de votos
        const votesQuery = query(collection(db, 'votes'), where('pollId', '==', pollId));
        const votesSnapshot = await getDocs(votesQuery);
        setVotesCount(votesSnapshot.size);

        setLoading(false);
      } catch (err) {
        console.error('Error al cargar auditoría:', err);
        setError('Error al cargar el reporte de auditoría.');
        setLoading(false);
      }
    };

    if (pollId) {
      loadData();
    }
  }, [pollId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <p className="text-neonBlue text-xl">🔍 Cargando reporte de auditoría...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">🛡️</div>
          <h2 className="text-xl font-bold text-neonRed mb-2">Reporte no disponible</h2>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  // Calcular margen de error
  const marginOfError = votesCount > 0 
    ? Math.round(1.96 * Math.sqrt(0.25 / votesCount) * 100 * 10) / 10 
    : 0;

  // Formatear fecha
  const formatDate = (date) => {
    return new Date(date).toLocaleString('es-CO', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  // Enmascarar email
  const maskedEmail = poll.creator 
    ? poll.creator.charAt(0) + '•••••@' + poll.creator.split('@')[1]
    : 'Desconocido';

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neonGreen mb-2">🛡️ Reporte de Auditoría Pública</h1>
          <p className="text-gray-400">Transparencia y verificación independiente</p>
        </div>

        <div className="bg-gray-800/50 rounded-2xl p-5 mb-6 border border-neonCyan">
          <h2 className="text-xl font-bold text-neonCyan mb-3">📋 Metadatos de la Encuesta</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <p><strong>Título:</strong> {poll.title}</p>
            <p><strong>Pregunta:</strong> {poll.question}</p>
            <p><strong>Creador:</strong> {maskedEmail}</p>
            <p><strong>Estado:</strong> Cerrada</p>
            <p><strong>Inicio:</strong> {formatDate(poll.startDate)}</p>
            <p><strong>Fin:</strong> {formatDate(poll.endDate)}</p>
            <p><strong>Votos válidos:</strong> {votesCount}</p>
            <p><strong>Margen de error:</strong> ±{marginOfError}%</p>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-2xl p-5 mb-6 border border-neonPurple">
          <h2 className="text-xl font-bold text-neonPurple mb-3">📝 Registro de Eventos</h2>
          {AuditLogs.length > 0 ? (
            <ul className="space-y-3">
              {AuditLogs.map((log, idx) => (
                <li key={idx} className="bg-gray-900/40 p-3 rounded-lg border border-gray-700">
                  <div className="flex justify-between">
                    <span className="font-mono text-neonYellow">{formatDate(log.timestamp)}</span>
                    <span className="text-neonBlue font-medium">{log.event}</span>
                  </div>
                  <p className="text-gray-400 text-sm mt-1">
                    Usuario: {log.user}
                    {log.details && (
                      <span> • {JSON.stringify(log.details)}</span>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No hay eventos registrados.</p>
          )}
        </div>

        <div className="text-center text-gray-500 text-xs mt-8">
          ✅ Este reporte es generado automáticamente y no puede ser alterado.  
          Fecha de generación: {new Date().toLocaleString('es-CO')}
        </div>
      </div>
    </div>
  );
}