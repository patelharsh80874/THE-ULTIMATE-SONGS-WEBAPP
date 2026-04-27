/**
 * @deprecated — DO NOT USE THIS HOOK.
 *
 * Media Session is now managed centrally in PlayerContext.jsx with:
 * - Bulletproof iOS/Safari background audio support
 * - Silent audio keepalive via Web Audio API
 * - Throttled position state updates
 * - One-time action handler registration (no re-registration on song change)
 *
 * Using this hook alongside PlayerContext will cause iOS to DROP
 * lock screen controls due to conflicting handler registrations.
 *
 * This file is kept only as a reference. Do NOT import it.
 */

const useMediaSession = () => {
  console.warn(
    "[DEPRECATED] useMediaSession hook is deprecated. " +
    "Media Session is now handled in PlayerContext.jsx. " +
    "Remove this import to prevent iOS lock screen issues."
  );
  return { initializeMediaSession: () => {} };
};

export default useMediaSession;
