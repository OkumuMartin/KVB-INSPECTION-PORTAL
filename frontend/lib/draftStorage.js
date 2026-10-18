const STORAGE_PREFIX = 'kvb:inspection-draft:';

// Cache the derived AES key for the current session so we do not re-run
// PBKDF2 (100k iterations) on every keystroke — that would stall the UI.
const keyCache = new Map();

function keyFor(userId) {
  return `${STORAGE_PREFIX}${userId || 'anonymous'}`;
}

async function deriveKey(userId) {
  const cached = keyCache.get(userId);
  if (cached) return cached;

  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(`kvb-draft-${userId || 'anonymous'}`),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode('kvb-draft-salt-v1'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );

  keyCache.set(userId, key);
  return key;
}

function stripSignatures(formData) {
  if (!formData) return formData;
  return {
    ...formData,
    signOff: {
      inspector: { ...formData.signOff?.inspector, signatureData: '' },
      personInCharge: { ...formData.signOff?.personInCharge, signatureData: '' },
    },
  };
}

export async function saveLocalDraft(userId, { outletId, inspectionDate, formData, stepIndex }) {
  if (typeof window === 'undefined') return false;

  const payload = JSON.stringify({
    outletId,
    inspectionDate,
    formData: stripSignatures(formData),
    stepIndex,
    savedAt: new Date().toISOString(),
  });

  // Try encryption first; fall back to plaintext for older browsers
  if (userId && window.crypto?.subtle) {
    try {
      const key = await deriveKey(userId);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const enc = new TextEncoder().encode(payload);
      const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        enc,
      );
      const bundle = JSON.stringify({
        iv: Array.from(iv),
        data: Array.from(new Uint8Array(ciphertext)),
        encrypted: true,
      });
      window.localStorage.setItem(keyFor(userId), bundle);
      return true;
    } catch {
      // Fall through to plaintext
    }
  }

  try {
    window.localStorage.setItem(keyFor(userId), JSON.stringify({ encrypted: false, data: payload }));
    return true;
  } catch {
    return false;
  }
}

export async function readLocalDraft(userId) {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(keyFor(userId));
    if (!raw) return null;

    const bundle = JSON.parse(raw);
    if (!bundle || typeof bundle !== 'object') return null;

    // Plaintext fallback (older drafts or encryption failure)
    if (!bundle.encrypted) {
      const parsed = JSON.parse(bundle.data);
      return parsed && typeof parsed === 'object' ? parsed : null;
    }

    // Encrypted path
    if (!userId || !window.crypto?.subtle) {
      // Cannot decrypt without a session — clear the stale entry
      window.localStorage.removeItem(keyFor(userId));
      return null;
    }

    const key = await deriveKey(userId);
    const iv = new Uint8Array(bundle.iv);
    const data = new Uint8Array(bundle.data);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data,
    );
    const text = new TextDecoder().decode(decrypted);
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function clearLocalDraft(userId) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(keyFor(userId));
  } catch {
    /* storage unavailable */
  }
}