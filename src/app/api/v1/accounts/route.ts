import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(req: Request) {
    try {
        // Retrieve credentials from headers
        const apiKey = req.headers.get('x-api-key');
        const apiSecret = req.headers.get('x-api-secret');

        if (!apiKey || !apiSecret) {
            return NextResponse.json(
                { error: 'Missing API Key or API Secret in headers' },
                { status: 401 }
            );
        }

        // Verify API credentials
        const validKey = await prisma.apiKey.findFirst({
            where: {
                key: apiKey,
                secret: apiSecret,
                isActive: true,
            },
        });

        if (!validKey) {
            return NextResponse.json(
                { error: 'Invalid API credentials' },
                { status: 401 }
            );
        }

        const tenantId = validKey.tenantId;

        // Parse query parameters
        const { searchParams } = new URL(req.url);
        const typeParam = searchParams.get('type');
        const categoryParam = searchParams.get('category');
        const queryParam = searchParams.get('q');

        // Build dynamically the where clause
        const whereClause: Prisma.AccountWhereInput = {
            tenantId: tenantId,
        };

        // If category is specified, use it. Otherwise default to 'DETAIL'
        if (categoryParam) {
            if (['HEADER', 'DETAIL'].includes(categoryParam.toUpperCase())) {
                whereClause.category = categoryParam.toUpperCase() as Prisma.EnumAccountCategoryFilter | "HEADER" | "DETAIL";
            }
        } else {
            whereClause.category = 'DETAIL';
        }

        // Filter by type (e.g. ASSET, EXPENSE)
        if (typeParam) {
            const types = typeParam.toUpperCase().split(',') as ("ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE")[];
            // Example allowed values based on schema: ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
            whereClause.type = { in: types };
        }

        // Search in Name or Code
        if (queryParam) {
            whereClause.OR = [
                { name: { contains: queryParam, mode: 'insensitive' } },
                { code: { contains: queryParam, mode: 'insensitive' } },
            ];
        }

        // Fetch accounts for this tenant
        const accounts = await prisma.account.findMany({
            where: whereClause,
            orderBy: {
                code: 'asc',
            },
        });

        // Format according to expected TruXos format
        const formattedAccounts = accounts.map((acc) => ({
            id: acc.id,
            name: `${acc.code} ${acc.name}`,
            type: acc.type,
            category: acc.category,
            code: acc.code,
            originalName: acc.name
        }));

        return NextResponse.json(
            {
                status: 'success',
                accounts: formattedAccounts,
                meta: {
                    count: formattedAccounts.length
                }
            },
            { status: 200 }
        );
    } catch (error: unknown) {
        console.error('Error fetching accounts:', error);
        return NextResponse.json(
            { error: 'Internal server error while fetching accounts' },
            { status: 500 }
        );
    }
}
