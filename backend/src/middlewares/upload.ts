import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { env } from '../utils/env';

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const comprovantesDir = path.resolve(env.uploadPath, 'comprovantes');
ensureDir(comprovantesDir);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, comprovantesDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `comprovante_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
  },
});

export const uploadComprovante = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas JPG, PNG e PDF são permitidos'));
    }
  },
});
