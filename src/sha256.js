async function sha256hash(input) { // Call with `await sha256hash(...)`
    const textAsBuffer = new TextEncoder().encode(input);
    const hash = await window.crypto.subtle.digest("SHA-256", textAsBuffer);
    const array = Array.from(new Uint8Array(hash))
    return array.map((item) => item.toString(16).padStart(2, "0")).join("")
};
