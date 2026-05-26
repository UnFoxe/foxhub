// lib/crypto.js
import CryptoJS from 'crypto-js';

// Функция для шифрования текста с помощью мастер-ключа
export function encryptData(text, masterKey) {
  try {
    return CryptoJS.AES.encrypt(text, masterKey).toString();
  } catch (error) {
    console.error('Ошибка шифрования:', error);
    return null;
  }
}

// Функция для расшифровки текста с помощью мастер-ключа
export function decryptData(cipherText, masterKey) {
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, masterKey);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    
    // Если мастер-ключ неверный, на выходе будет пустая строка
    if (!originalText) return null; 
    return originalText;
  } catch (error) {
    // Если шифр поврежден или ключ совсем не подходит
    return null;
  }
}