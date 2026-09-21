import 'dotenv/config';
export function readEnv() {
  const secret = process.env.JWT_SECRET || '';
  if (secret.length < 32 || secret.startsWith('replace-with')) throw new Error('Set JWT_SECRET to a random value of at least 32 characters');
  if (!process.env.MONGODB_URI) throw new Error('Set MONGODB_URI in .env');
  return { secret, port: Number(process.env.PORT || 5000), origin: process.env.CLIENT_URL || 'http://localhost:5173' };
}
