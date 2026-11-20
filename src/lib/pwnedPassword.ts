/**
 * Checks a password against the Have I Been Pwned breach corpus using
 * k-anonymity: only the first 5 hex chars of the SHA-1 hash leave the browser.
 * Fails open (returns false) if the service is unreachable.
 */
export async function isPasswordPwned(password: string): Promise<boolean> {
  try {
    const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(password));
    const hash = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true" },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return false;
    const text = await res.text();
    return text.split("\n").some((line) => {
      const [s, count] = line.trim().split(":");
      return s === suffix && Number(count) > 0;
    });
  } catch {
    return false;
  }
}

export const PWNED_PASSWORD_MESSAGE =
  "This password has appeared in a known data breach. Please choose a different password.";
