import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { User, Company } from './db/models';
import logger from './logger';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        try {
          // Find user by email
          const user = await User.findOne({
            where: { email: credentials.email },
            include: [{ model: Company, as: 'company' }],
          });

          if (!user) {
            logger.warn('Login failed: User not found', { email: credentials.email });
            throw new Error('Invalid credentials');
          }

          // Check if account is active
          if (user.status !== 'active') {
            logger.warn('Login failed: Account inactive', { email: credentials.email });
            throw new Error('Account is inactive');
          }

          // Check if account is locked
          if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
            logger.warn('Login failed: Account locked', { email: credentials.email });
            throw new Error('Account is locked. Please try again later.');
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            // Increment failed login attempts
            await user.update({
              failedLoginAttempts: user.failedLoginAttempts + 1,
              lockedUntil:
                user.failedLoginAttempts + 1 >=
                parseInt(process.env.MAX_FAILED_LOGIN_ATTEMPTS || '5')
                  ? new Date(
                      Date.now() +
                        parseInt(process.env.ACCOUNT_LOCK_DURATION || '1800') * 1000
                    )
                  : null,
            });

            logger.warn('Login failed: Invalid password', { email: credentials.email });
            throw new Error('Invalid credentials');
          }

          // Reset failed login attempts and update last login
          await user.update({
            failedLoginAttempts: 0,
            lockedUntil: null,
            lastLoginAt: new Date(),
          });

          logger.info('Login successful', { userId: user.id, email: user.email });

          // Return user data (without password)
          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            companyId: user.companyId,
            role: user.role,
            permissions: user.permissions,
          };
        } catch (error) {
          logger.error('Login error:', error);
          throw error;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: parseInt(process.env.SESSION_MAX_AGE || '604800'), // 7 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.companyId = (user as any).companyId;
        token.role = (user as any).role;
        token.permissions = (user as any).permissions;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).email = token.email;
        (session.user as any).companyId = token.companyId;
        (session.user as any).role = token.role;
        (session.user as any).permissions = token.permissions;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};
