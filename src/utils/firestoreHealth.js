/**
 * firestoreHealth — stub para compatibilidade após remoção do Firestore.
 * agenda-agendamentos.js usa PostgreSQL como fallback quando Firestore indisponível.
 * Retornando false aqui força sempre o caminho PostgreSQL.
 */
function isFirestoreAvailable() {
  return false;
}

function markFirestoreUnavailable() {
  // no-op
}

module.exports = { isFirestoreAvailable, markFirestoreUnavailable };
