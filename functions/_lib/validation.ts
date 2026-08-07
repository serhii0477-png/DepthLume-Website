import { publicError } from './http';

export const text = (value: unknown, label: string, min = 1, max = 1000) => {
  if (typeof value !== 'string') throw publicError(`${label}: неправильне значення.`);
  const normalized = value.trim();
  if (normalized.length < min || normalized.length > max) throw publicError(`${label}: допустима довжина ${min}–${max} символів.`);
  return normalized;
};

export const optionalText = (value: unknown, label: string, max = 1000) => {
  if (value === undefined || value === null || value === '') return null;
  return text(value, label, 1, max);
};

export const email = (value: unknown) => {
  const normalized = text(value, 'Email', 5, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw publicError('Вкажіть коректний email.');
  return normalized;
};

export const password = (value: unknown) => {
  const normalized = text(value, 'Пароль', 12, 128);
  if (!/[a-z]/i.test(normalized) || !/\d/.test(normalized)) throw publicError('Пароль має містити літери та цифри.');
  return normalized;
};

export const boolean = (value: unknown, label: string) => {
  if (value !== true && value !== false) throw publicError(`${label}: виберіть значення.`);
  return value;
};

