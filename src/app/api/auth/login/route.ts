import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        if (!body || typeof body !== 'object') {
            return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
        }
        const { username, password } = body;

        // Validation
        if (!username || typeof username !== 'string' || !password || typeof password !== 'string') {
            return NextResponse.json(
                { error: "Username and password are required and must be valid text." },
                { status: 400 }
            );
        }

        // Find user with tenant info
        const user = await prisma.user.findUnique({
            where: { username: username.toLowerCase() },
            include: { tenant: true },
        });

        if (!user) {
            return NextResponse.json(
                { error: "Invalid credentials." },
                { status: 401 }
            );
        }

        // Verify password
        const isValid = await verifyPassword(password, user.password);

        if (!isValid) {
            return NextResponse.json(
                { error: "Invalid credentials." },
                { status: 401 }
            );
        }

        // Generate JWT (for localStorage / client use)
        const token = signToken({
            userId: user.id,
            username: user.username,
            role: user.role,
            tenantId: user.tenant.id,
            tenantSlug: user.tenant.slug,
        });

        // ─── Set httpOnly session cookie (used by all Server Actions) ───
        // jose-signed JWT that getSession() can verify
        const { SignJWT } = await import('jose');
        const secretKey = process.env.JWT_SECRET || 'super-secret-key-1234';
        const key = new TextEncoder().encode(secretKey);
        const sessionToken = await new SignJWT({ userId: user.id, tenantId: user.tenant.id })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('7d')
            .sign(key);

        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        const response = NextResponse.json({
            message: "Login successful.",
            token,
            user: {
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                role: user.role,
            },
            tenant: {
                id: user.tenant.id,
                name: user.tenant.name,
                slug: user.tenant.slug,
            },
        });

        // Set the 'session' cookie so Server Actions (getSession()) work
        response.cookies.set('session', sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            expires: expiresAt,
            sameSite: 'lax',
            path: '/',
        });

        return response;
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            { error: "An unexpected error occurred. Please try again." },
            { status: 500 }
        );
    }
}
