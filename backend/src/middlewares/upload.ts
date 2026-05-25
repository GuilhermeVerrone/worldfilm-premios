import multer from 'multer';
import type { FileFilterCallback } from 'multer';
import type { Request } from 'express';
import path from 'path';
import fs from 'fs';
import { env } from '../utils/env';

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const comprovantesDir = path.resolve(env.uploadPath, 'comprovantes');
ensureDir(comprovantesDir);

const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) =>
    cb(null, comprovantesDir),
  filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `comprovante_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
  },
});

export const uploadComprovante = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas JPG, PNG e PDF são permitidos'));
    }
  },
});
