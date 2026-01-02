// src/lib/auditlog.js
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export const logEvent = async (pollId, event, user = 'anonymous', details = null, tenantId = null) => {
  try {
    await addDoc(collection(db, 'audit_logs'), {
      pollId,
      event,
      user,
      details,
      tenantId,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.warn('⚠️ No se pudo registrar evento de auditoría:', err);
  }
};