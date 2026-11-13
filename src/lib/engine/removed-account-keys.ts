import {
  deleteAiOwnerKeys,
  listAiKeyOwners,
} from "@/lib/ai-explain/preferences";
import { GUEST_OWNER_ID } from "./content-owner";

/**
 * The engine's own IndexedDB names (experimental-engine,
 * `storage/database.ts`). The registry name is in the engine docs
 * (host/api/SESSION.md); the per-account name is not, so check both when the
 * engine pin is bumped. If the registry is missing (a renamed or unused
 * engine), nothing is deleted.
 */
const ENGINE_REGISTRY_DATABASE = "kh10_accounts";
const engineAccountDatabase = (userId: string) => `kh10_user:${userId}`;

/**
 * Deletes the saved AI API keys of accounts the engine has removed from this
 * device (14 days after logout, a third account logging in, or logging out
 * with "remove study data"): their database is gone. AI content is kept; a
 * signed-in user can delete it in AI Study Tools → Usage.
 *
 * `readOwnerId` gives who is logged in now (an account's user id or the
 * guest), or undefined while it's unknown, when nothing is deleted. Only
 * reads the list of databases; never opens the engine's.
 */
export const deleteRemovedAccountKeys = async (
  readOwnerId: () => string | undefined
) => {
  const ownerId = readOwnerId();
  if (ownerId === undefined) return;
  const owners = listAiKeyOwners().filter(
    (id) => id !== GUEST_OWNER_ID && id !== ownerId
  );
  if (owners.length === 0) return;
  if (typeof indexedDB?.databases !== "function") return;
  let names: Set<string>;
  try {
    names = new Set(
      (await indexedDB.databases()).map(({ name }) => name ?? "")
    );
  } catch {
    return;
  }
  if (!names.has(ENGINE_REGISTRY_DATABASE)) return;
  // Someone may have logged in or out while the list was read.
  if (readOwnerId() !== ownerId) return;
  for (const id of owners) {
    if (!names.has(engineAccountDatabase(id))) deleteAiOwnerKeys(id);
  }
};
