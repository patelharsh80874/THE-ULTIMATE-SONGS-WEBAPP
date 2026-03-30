import CryptoJS from "crypto-js";

export function decryptSaavnURL(encryptedMediaUrl) {
  const qualities = [
    { id: "_12", bitrate: "12kbps" },
    { id: "_48", bitrate: "48kbps" },
    { id: "_96", bitrate: "96kbps" },
    { id: "_160", bitrate: "160kbps" },
    { id: "_320", bitrate: "320kbps" },
  ];

  const key = CryptoJS.enc.Utf8.parse("38346591");

  try {
    // Decrypt the encrypted media URL using DES-ECB + PKCS7
    const decrypted = CryptoJS.DES.decrypt(
      {
        ciphertext: CryptoJS.enc.Base64.parse(encryptedMediaUrl),
      },
      key,
      {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7,
      }
    );

    const decryptedLink = decrypted.toString(CryptoJS.enc.Utf8).trim();

    if (!decryptedLink) return null;

    // Generate links for all bitrates by replacing quality id
    for (const q of qualities) {
      if (decryptedLink.includes(q.id)) {
        return qualities.map(({ id, bitrate }) => ({
          quality: bitrate,
          link: decryptedLink.replace(q.id, id),
        }));
      }
    }

    // If no quality pattern found, return raw decrypted link
    return [{ quality: "unknown", link: decryptedLink }];
  } catch (err) {
    console.log("Decryption failed:", err);
    return null;
  }
}
