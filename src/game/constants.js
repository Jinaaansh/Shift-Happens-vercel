export const MAX_HP = 100
export const LAUGH_DEADZONE = 15
export const DAMAGE_PER_SECOND = 10
export const MATCH_SECONDS = 180
export const OVERTIME_SECONDS = 30

// --- NEW: anti-cheat settings ---
export const NO_FACE_GRACE_MS = 1500        // face may vanish this long (blink, look down) with no penalty
export const NO_FACE_DAMAGE_PER_SECOND = 5  // HP lost per second while your face is hidden / tab is hidden
export const FORFEIT_AFTER_MS = 10000       // opponent disconnected this long = you win
