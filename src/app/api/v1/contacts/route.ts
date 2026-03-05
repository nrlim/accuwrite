import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { verifyApiAuth } from '@/lib/apiAuth';

export async function GET(req: Request) {
    try {
        const auth = await verifyApiAuth(req);
        if (auth.error) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }

        const tenantId = auth.tenantId!;

        const { searchParams } = new URL(req.url);
        const typeParam = searchParams.get('type');
        const searchParam = searchParams.get('search');
        const pageParam = searchParams.get('page');
        const limitParam = searchParams.get('limit');

        const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;
        const limit = limitParam ? Math.min(100, Math.max(1, parseInt(limitParam, 10))) : 20;
        const skip = (page - 1) * limit;

        const whereClause: Prisma.ContactWhereInput = {
            tenantId: tenantId,
        };

        if (typeParam) {
            whereClause.type = typeParam as Prisma.EnumContactTypeFilter | "CUSTOMER" | "VENDOR" | "BOTH";
        }

        if (searchParam) {
            whereClause.OR = [
                { name: { contains: searchParam, mode: 'insensitive' } },
                { email: { contains: searchParam, mode: 'insensitive' } },
            ];
        }

        const [contacts, totalCount] = await Promise.all([
            prisma.contact.findMany({
                where: whereClause,
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            prisma.contact.count({
                where: whereClause,
            })
        ]);

        return NextResponse.json(
            {
                status: 'success',
                data: contacts,
                meta: {
                    page,
                    limit,
                    totalCount,
                    totalPages: Math.ceil(totalCount / limit),
                }
            },
            { status: 200 }
        );
    } catch (error: unknown) {
        console.error('Error fetching contacts:', error);
        return NextResponse.json(
            { error: 'Internal server error while fetching contacts' },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const auth = await verifyApiAuth(req);
        if (auth.error) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }

        const tenantId = auth.tenantId!;
        const payload = await req.json();

        if (!payload.name || !payload.type) {
            return NextResponse.json(
                { error: 'Missing required fields: name and type' },
                { status: 400 }
            );
        }

        const contact = await prisma.contact.create({
            data: {
                name: payload.name,
                type: payload.type,
                email: payload.email || null,
                phone: payload.phone || null,
                address: payload.address || null,
                npwp: payload.npwp || null,
                tenantId: tenantId,
            }
        });

        return NextResponse.json(
            {
                status: 'success',
                message: 'Contact created successfully',
                data: contact,
            },
            { status: 201 }
        );

    } catch (error: unknown) {
        console.error('Error creating contact:', error);
        return NextResponse.json(
            { error: 'Internal server error while creating contact' },
            { status: 500 }
        );
    }
}
