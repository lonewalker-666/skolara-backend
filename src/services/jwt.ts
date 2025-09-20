import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const {
  JWT_ACCESS_SECRET: ACCESS_SECRET,
  JWT_REFRESH_SECRET: REFRESH_SECRET,
  JWT_ACCESS_TTL: ACCESS_TTL,
  JWT_REFRESH_TTL: REFRESH_TTL,
} = env;

type SignOptions = { expiresIn?: string | number; subject?: string };

export type JwtPayload = {
  sub: string;
  mobile: string;
  email?: string | null;
  type: "access" | "refresh";
};

export const JwtService = {
  signAccess(payload: Omit<JwtPayload, "type">, opts: SignOptions = {}) {
    return jwt.sign({ ...payload, type: "access" }, ACCESS_SECRET, {
      expiresIn: ACCESS_TTL,
      ...opts,
    } as jwt.SignOptions);
  },
  signRefresh(payload: Omit<JwtPayload, "type">, opts: SignOptions = {}) {
    return jwt.sign({ ...payload, type: "refresh" }, REFRESH_SECRET, {
      expiresIn: REFRESH_TTL,
      ...opts,
    } as jwt.SignOptions);
  },
  verifyAccess<T extends object = any>(token: string): JwtPayload & T {
    return jwt.verify(token, ACCESS_SECRET) as any;
  },
  verifyRefresh<T extends object = any>(token: string): JwtPayload & T {
    return jwt.verify(token, REFRESH_SECRET) as any;
  },
};
