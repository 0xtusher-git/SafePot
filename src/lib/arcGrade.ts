const API_BASE = "https://arc-grade.vercel.app/api/v1";

export async function checkIsTrusted(address: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/trusted/${address}`);
    if (!res.ok) return false;
    const data = await res.json();
    return data.trusted === true;
  } catch (error) {
    console.error("Error checking trust score:", error);
    return false;
  }
}

export async function getTrustScore(address: string): Promise<number | null> {
  try {
    const res = await fetch(`${API_BASE}/score/${address}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.score;
  } catch (error) {
    console.error("Error getting trust score:", error);
    return null;
  }
}
