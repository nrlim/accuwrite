import { NextResponse } from 'next/server';
import { verifyApiAuth } from '@/lib/apiAuth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const auth = await verifyApiAuth(req);
        if (auth.error) {
            return NextResponse.json({
                status: 'failed',
                connected: false,
                error: auth.error
            }, { status: auth.status });
        }

        // Fetch tenant name for a better greeting
        const tenant = await prisma.tenant.findUnique({
            where: { id: auth.tenantId! },
            select: { name: true }
        });

        return NextResponse.json(
            {
                status: 'success',
                connected: true,
                message: 'Successfully connected to Accuwrite API.',
                app_name: auth.validKey?.name,
                tenant_name: tenant?.name
            },
            { status: 200 }
        );
    } catch (error: unknown) {
        console.error('Error verifying connection:', error);
        return NextResponse.json(
            {
                status: 'failed',
                connected: false,
                error: 'Internal server error while verifying connection'
            },
            { status: 500 }
        );
    }
}
