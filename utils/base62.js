// src/utils/base62.js
const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const BASE = ALPHABET.length; // 62

export function encodeBase62(num) {
  if (num === 0) return ALPHABET[0];

  let result = "";
  while (num > 0) {
    const remainder = num % BASE;
    result = ALPHABET[remainder] + result;
    num = Math.floor(num / BASE);
  }
  return result;
}
