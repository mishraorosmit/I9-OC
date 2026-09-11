/**
 * claimSpawn.js
 * -------------
 * Modular claim service. The UI and detection layers call this
 * function — they do not talk to Supabase directly.
 *
 * Current implementation: mock (logs to console + resolves instantly).
 * To wire up Supabase, replace the mock block below with real DB calls.
 * The interface stays the same, so the UI/detection code never changes.
 *
 * Interface:
 *   claimSpawn(spawn) → Promise<{ success: boolean, error?: string }>
 *
 * Spawn shape:
 *   { id, name, latitude, longitude, radius, points, active }
 */

// ---------------------------------------------------------------------------
// MOCK IMPLEMENTATION
// Replace this block with your Supabase client calls when ready.
// ---------------------------------------------------------------------------

const MOCK_DELAY_MS = 200; // simulate async network call

/**
 * Mock user ID — replace with real auth session in production.
 * e.g. const { data: { user } } = await supabase.auth.getUser()
 */
const MOCK_USER_ID = "mock-user-001";

async function mockClaimSpawn(spawn) {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
  console.info(
    `[I9 Mock] Claimed spawn "${spawn.name}" (id: ${spawn.id}) — +${spawn.points} pts`,
    { userId: MOCK_USER_ID, timestamp: new Date().toISOString() }
  );
  return { success: true };
}

// ---------------------------------------------------------------------------
// PUBLIC INTERFACE
// ---------------------------------------------------------------------------

/**
 * claimSpawn
 * Executes a claim for the given spawn. Returns a result object so
 * callers can handle failures gracefully.
 *
 * @param {{ id, name, points, latitude, longitude, radius, active }} spawn
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function claimSpawn(spawn) {
  if (!spawn || spawn.id == null) {
    return { success: false, error: "Invalid spawn data" };
  }

  try {
    /*
     * ── Supabase replacement ──────────────────────────────────────────────
     * import { supabase } from "./supabaseClient";
     *
     * const { data: { user } } = await supabase.auth.getUser();
     * const { error } = await supabase.from("claims").insert({
     *   spawn_id: spawn.id,
     *   user_id:  user.id,
     *   points:   spawn.points,
     *   claimed_at: new Date().toISOString(),
     * });
     * if (error) throw error;
     * return { success: true };
     * ─────────────────────────────────────────────────────────────────────
     */
    return await mockClaimSpawn(spawn);
  } catch (err) {
    console.error("[I9] claimSpawn error:", err);
    return { success: false, error: err?.message ?? "Unknown error" };
  }
}

export default claimSpawn;
