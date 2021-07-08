export default function getRandomString(bytes: number): string {
    const randomValues = new Uint8Array(bytes);
    window.crypto.getRandomValues(randomValues);
    return Array.from(randomValues).map(intToHex).join('');
}

function intToHex(nr: number): string {
    return nr.toString(16).padStart(2, '0');
}
