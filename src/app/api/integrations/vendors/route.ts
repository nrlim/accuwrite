import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/apiAuth';

export async function GET(req: Request) {
    try {
        const auth = await verifyApiAuth(req);
        if (auth.error) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search');

        let whereClause: any = {
            tenantId: auth.tenantId,
            type: { in: ['VENDOR', 'BOTH'] }
        };

        if (search) {
            whereClause.name = { contains: search, mode: 'insensitive' };
        }

        const vendors = await prisma.contact.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                address: true,
                npwp: true,
            },
            orderBy: { name: 'asc' },
            take: 50 // Limit to 50 for API lookup
        });

        return NextResponse.json({
            status: 'success',
            data: vendors,
        });

    } catch (error: unknown) {
        console.error('Error fetching vendors:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
