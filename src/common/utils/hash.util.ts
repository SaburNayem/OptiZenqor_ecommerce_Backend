import * as bcrypt from 'bcrypt';

export async function hashValue(value: string, rounds: number) {
  return bcrypt.hash(value, rounds);
}

export async function compareHash(value: string, hash: string) {
  return bcrypt.compare(value, hash);
}
