// Have I Been Pwned k-anonymity check. Fails open if the service is unreachable.
export async function isPasswordPwned(password: string): Promise<boolean> {
  try {
    const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(password));
    const hash = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
    const res = await fetch(`https://api.pwnedpasswords.com/range/${hash.slice(0, 5)}`, {
      headers: { "Add-Padding": "true" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return false;
    const suffix = hash.slice(5);
    return (await res.text()).split("\n").some((l) => {
      const [s, c] = l.trim().split(":");
      return s === suffix && Number(c) > 0;
    });
  } catch {
    return false;
  }
}
export const PWNED_PASSWORD_MESSAGE =
  "This password has appeared in a known data breach. Please choose a different password.";
