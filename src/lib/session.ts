import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';

const secretKey = process.env.JWT_SECRET || 'super-secret-key-1234';
const key = new TextEncoder().encode(secretKey);

export async function createSession(userId: string, tenantId: string) {
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour
    const session = await new SignJWT({ userId, tenantId })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(key);

    const cookieStore = await cookies();
    cookieStore.set('session', session, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: expiresAt,
        sameSite: 'lax',
        path: '/',
    });
}

export async function verifySession(session: string | undefined = '') {
    try {
        if (!session) return null;
        const { payload } = await jwtVerify(session, key, {
            algorithms: ['HS256'],
        });
        return payload as { userId: string; tenantId: string };
    } catch (error) {
        return null;
    }
}

export async function deleteSession() {
    const cookieStore = await cookies();
    cookieStore.delete('session');
}

export async function getSession() {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;
    if (!session) return null;
    return await verifySession(session);
}
