import { NextResponse } from 'next/server';

export async function POST() {
    const response = NextResponse.json({ message: 'Logged out' });
    // Clear the httpOnly session cookie used by Server Actions
    response.cookies.set('session', '', {
        httpOnly: true,
        expires: new Date(0),
        path: '/',
    });
    return response;
}
