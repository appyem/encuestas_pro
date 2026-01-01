import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export const logEvent = async (pollId, event, user = 'anonymous', details = null, tenantId = null) => {
  try {
    // Obtener tenantId del poll si está disponible
let tenantId = null;
if (typeof pollId === 'string') {
  // En producción, puedes cargar el poll aquí, pero para no afectar rendimiento,
  // es mejor pasar tenantId como parámetro desde el llamado.
  // Por ahora, lo dejamos null y lo completaremos en el Paso 5.
}
await addDoc(collection(db, 'audit_logs'), {
  pollId,
  event,
  user,
  details,
  tenantId, // ✅ ya no es null si se pasa desde el llamado
  timestamp: serverTimestamp(),
});
  } catch (err) {
    console.warn('⚠️ No se pudo registrar evento de auditoría:', err);
  }
};