import bcrypt from "bcrypt";
import { sign, Secret, SignOptions } from "jsonwebtoken";
import prisma from "../../config/prisma";
import { env } from "../../config/env";

export interface SignupInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export async function signupUser(data: SignupInput) {
  const { name, email, password } = data;

  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new Error("User already exists with this email");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true
    }
  });
}

export async function loginUser(data: LoginInput) {
  const { email, password } = data;

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  const jwtSecret: Secret = env.JWT_SECRET;
  const refreshSecret: Secret = env.REFRESH_SECRET;

  const jwtOptions: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"]
  };

  const refreshOptions: SignOptions = {
    expiresIn: env.REFRESH_EXPIRES_IN as SignOptions["expiresIn"]
  };

  const token = sign({ userId: user.id, email: user.email }, jwtSecret, jwtOptions);
  const refreshToken = sign(
    { userId: user.id, email: user.email },
    refreshSecret,
    refreshOptions
  );

  const hashedRefresh = await bcrypt.hash(refreshToken, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: hashedRefresh }
  });

  return {
    token,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email
    }
  };
}

export async function refreshTokens(userId: string, refreshToken: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.refreshToken) {
    throw new Error("Refresh token invalid");
  }

  const valid = await bcrypt.compare(refreshToken, user.refreshToken);
  if (!valid) {
    throw new Error("Refresh token invalid");
  }

  const jwtSecret: Secret = env.JWT_SECRET;
  const refreshSecret: Secret = env.REFRESH_SECRET;

  const jwtOptions: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"]
  };

  const refreshOptions: SignOptions = {
    expiresIn: env.REFRESH_EXPIRES_IN as SignOptions["expiresIn"]
  };

  const token = sign({ userId: user.id, email: user.email }, jwtSecret, jwtOptions);
  const newRefreshToken = sign(
    { userId: user.id, email: user.email },
    refreshSecret,
    refreshOptions
  );

  const hashedRefresh = await bcrypt.hash(newRefreshToken, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: hashedRefresh }
  });

  return { token, refreshToken: newRefreshToken };
}

export async function revokeRefreshToken(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null }
  });
}
