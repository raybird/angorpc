import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'angorpc-secret-key-2026';

export interface AuthContext {
  authorization?: string;
  user?: {
    id: string;
    role: 'USER' | 'ADMIN';
  };
}

export const authMiddleware = async ({ context, next }: { context: AuthContext, next: any }) => {
  const authHeader = context.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('UNAUTHORIZED');
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: 'USER' | 'ADMIN' };
    
    return next({
      context: {
        ...context,
        user: {
          id: decoded.userId,
          role: decoded.role,
        },
      },
    });
  } catch (err) {
    throw new Error('UNAUTHORIZED');
  }
};
