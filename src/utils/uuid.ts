import { v4 as uuidv4 } from 'uuid';

/** 生成 UUID v4 */
export function generateId(): string {
  return uuidv4();
}
