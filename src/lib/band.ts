// Thin client for the Band Agent REST API (https://docs.band.ai/api/agent-api).
// Each Band agent authenticates with its own X-API-Key. Because Band's real-time
// SDK is Python-only, this TypeScript app uses the documented REST "custom
// integration" path: an orchestrator drives the flow and each agent posts real
// messages into a shared Band room with @mention handoffs.

const BASE = process.env.BAND_BASE_URL || "https://app.band.ai/api/v1";

export interface BandIdentity {
  id: string; // agent UUID
  handle: string; // "owner/slug"
  name: string; // display name
}

export interface BandMention {
  id: string;
  handle?: string;
  name?: string;
}

export interface BandMessage {
  id: string;
  content: string;
  message_type: string;
  sender_id: string;
  sender_type: string;
  sender_name?: string;
}

async function bandFetch(apiKey: string, path: string, init: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Band API ${path} failed (${res.status}): ${text}`);
  }
  return res.status === 204 ? null : res.json();
}

// GET /agent/me — "Who am I?" Returns this agent's identity (id, handle, name).
export async function getIdentity(apiKey: string): Promise<BandIdentity> {
  const json = await bandFetch(apiKey, "/agent/me", { method: "GET" });
  const d = json.data ?? json;
  return { id: d.id, handle: d.handle, name: d.name };
}

// POST /agent/chats — create a room (caller becomes owner).
export async function createRoom(apiKey: string, title: string): Promise<string> {
  const json = await bandFetch(apiKey, "/agent/chats", {
    method: "POST",
    body: JSON.stringify({ chat: { title } }),
  });
  return json.data.id as string;
}

// POST /agent/chats/{id}/participants — add a sibling agent to the room.
export async function addParticipant(
  apiKey: string,
  roomId: string,
  participantId: string
): Promise<void> {
  await bandFetch(apiKey, `/agent/chats/${roomId}/participants`, {
    method: "POST",
    body: JSON.stringify({
      participant: { participant_id: participantId, role: "member" },
    }),
  });
}

// POST /agent/chats/{id}/messages — send a text message (must @mention recipients).
export async function sendMessage(
  apiKey: string,
  roomId: string,
  content: string,
  mentions: BandMention[]
): Promise<string> {
  const json = await bandFetch(apiKey, `/agent/chats/${roomId}/messages`, {
    method: "POST",
    body: JSON.stringify({ message: { content, mentions } }),
  });
  return json.data.id as string;
}

// GET /agent/chats/{id}/context — read the room transcript relevant to this agent.
export async function getContext(
  apiKey: string,
  roomId: string
): Promise<BandMessage[]> {
  const json = await bandFetch(
    apiKey,
    `/agent/chats/${roomId}/context?limit=100`,
    { method: "GET" }
  );
  return (json.data ?? []) as BandMessage[];
}
