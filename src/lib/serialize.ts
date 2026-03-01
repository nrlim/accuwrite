/**
 * Shared serialization helpers.
 *
 * Next.js cannot pass Prisma `Decimal` objects (or `Date` objects with
 * prototype methods) across the Server → Client Component boundary.
 * These helpers convert them to plain JS primitives.
 */

/** Serialize a Prisma `Account` (flat, no children) */
export function serializeAccount(a: any): any {
    return {
        ...a,
        initialBalance: Number(a.initialBalance ?? 0),
        createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : a.createdAt,
        updatedAt: a.updatedAt instanceof Date ? a.updatedAt.toISOString() : a.updatedAt,
    };
}

/** Recursively serialize a tree-shaped `Account` (with `children`) */
export function serializeAccountTree(a: any): any {
    return {
        ...serializeAccount(a),
        children: Array.isArray(a.children) ? a.children.map(serializeAccountTree) : [],
        parent: a.parent
            ? { id: a.parent.id, name: a.parent.name, code: a.parent.code }
            : null,
    };
}

/** Serialize a JournalEntry (including nested items) */
export function serializeJournalEntry(e: any): any {
    return {
        ...e,
        date: e.date instanceof Date ? e.date.toISOString() : e.date,
        createdAt: e.createdAt instanceof Date ? e.createdAt.toISOString() : e.createdAt,
        updatedAt: e.updatedAt instanceof Date ? e.updatedAt.toISOString() : e.updatedAt,
        items: (e.items ?? []).map((i: any) => ({
            ...i,
            debit: Number(i.debit ?? 0),
            credit: Number(i.credit ?? 0),
            account: i.account ? serializeAccount(i.account) : null,
        })),
    };
}

/** Serialize an Invoice (including items and payments) */
export function serializeInvoice(inv: any): any {
    return {
        ...inv,
        subtotal: Number(inv.subtotal ?? 0),
        taxAmount: Number(inv.taxAmount ?? 0),
        totalAmount: Number(inv.totalAmount ?? 0),
        paidAmount: Number(inv.paidAmount ?? 0),
        date: inv.date instanceof Date ? inv.date.toISOString() : inv.date,
        dueDate: inv.dueDate instanceof Date ? inv.dueDate.toISOString() : inv.dueDate,
        items: (inv.items ?? []).map((i: any) => ({
            ...i,
            quantity: Number(i.quantity ?? 0),
            unitPrice: Number(i.unitPrice ?? 0),
            taxRate: Number(i.taxRate ?? 0),
            amount: Number(i.amount ?? 0),
        })),
        payments: (inv.payments ?? []).map((p: any) => ({
            ...p,
            amount: Number(p.amount ?? 0),
            date: p.date instanceof Date ? p.date.toISOString() : p.date,
        })),
    };
}

/** Serialize a Bill (including items and payments) */
export function serializeBill(b: any): any {
    return {
        ...b,
        subtotal: Number(b.subtotal ?? 0),
        taxAmount: Number(b.taxAmount ?? 0),
        totalAmount: Number(b.totalAmount ?? 0),
        paidAmount: Number(b.paidAmount ?? 0),
        date: b.date instanceof Date ? b.date.toISOString() : b.date,
        dueDate: b.dueDate instanceof Date ? b.dueDate.toISOString() : b.dueDate,
        items: (b.items ?? []).map((i: any) => ({
            ...i,
            quantity: Number(i.quantity ?? 0),
            unitPrice: Number(i.unitPrice ?? 0),
            taxRate: Number(i.taxRate ?? 0),
            amount: Number(i.amount ?? 0),
        })),
        payments: (b.payments ?? []).map((p: any) => ({
            ...p,
            amount: Number(p.amount ?? 0),
            date: p.date instanceof Date ? p.date.toISOString() : p.date,
        })),
    };
}

/** 
 * Bulletproof deep serialization stringifier for Server Actions.
 * Recursively converts Prisma Decimals to Javascript Numbers and Dates to ISO strings.
 */
export function deepSerialize<T>(obj: T): T {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj as unknown as T;

    // Handle Date
    if (obj instanceof Date) {
        return obj.toISOString() as unknown as T;
    }

    // Handle Prisma Decimal (detect by checking for 'toNumber' function or 'Decimal' constructor)
    if (typeof (obj as any).toNumber === 'function') {
        return (obj as any).toNumber() as unknown as T;
    }
    if ((obj as any)?.constructor?.name === 'Decimal') {
        return Number(obj) as unknown as T;
    }

    // Handle Array
    if (Array.isArray(obj)) {
        return obj.map((item) => deepSerialize(item)) as unknown as T;
    }

    // Handle Plain Object
    const serialized: any = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            serialized[key] = deepSerialize((obj as any)[key]);
        }
    }
    return serialized as unknown as T;
}
