import type { JwtPayloadAdmin, JwtPayloadVendedor } from '@worldfilm/shared';

declare global {
  namespace Express {
    interface Request {
      admin?: JwtPayloadAdmin;
      vendedor?: JwtPayloadVendedor;
    }
  }
}
