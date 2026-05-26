import type { Doc, Id } from '../_generated/dataModel';
import type { Role } from './withAuth';

/**
 * Role × entity capability matrix.
 *
 * R = read; W = write; D = delete; A = admin (settings/billing/permissions).
 *   *  = scoped to assigned/own records
 *   ** = bound to the specific deal a client/witness was invited to
 */
const MATRIX = {
  org: {
    principal: 'RWDA', admin: 'RWDA', manager: 'R', documentation_officer: 'R', agent: 'R',
  },
  team: {
    principal: 'RWDA', admin: 'RWDA', manager: 'RWDA', documentation_officer: 'R', agent: 'R*',
  },
  deal: {
    principal: 'RWDA', admin: 'RWDA', manager: 'RWDA', documentation_officer: 'RWD', agent: 'RW*',
  },
  document: {
    principal: 'RWDA', admin: 'RWDA', manager: 'RWD', documentation_officer: 'RWD', agent: 'RW*',
  },
  template: {
    principal: 'RWDA', admin: 'RWDA', manager: 'RWDA', documentation_officer: 'RWD', agent: 'R',
  },
  signature: {
    principal: 'RWDA', admin: 'RWDA', manager: 'RW', documentation_officer: 'RW', agent: 'RW*',
  },
  audit: {
    principal: 'R', admin: 'R', manager: 'R', documentation_officer: 'R*', agent: '-',
  },
  member: {
    principal: 'RWDA', admin: 'RWDA', manager: 'R', documentation_officer: 'R', agent: 'R*',
  },
} as const;

type Entity = keyof typeof MATRIX;
type Perm = 'R' | 'W' | 'D' | 'A';

export function can(role: Role, entity: Entity, perm: Perm): boolean {
  const grant = (MATRIX[entity] as Record<Role, string>)[role] ?? '';
  return grant.includes(perm);
}

export function assertCan(role: Role, entity: Entity, perm: Perm): void {
  if (!can(role, entity, perm)) throw new Error('FORBIDDEN');
}

/**
 * 404-not-403 pattern. Don't leak existence of records belonging to other
 * tenants or unassigned-to-you records — they should appear identical to
 * "this record does not exist".
 */
export async function readDeal(
  ctx: any,
  args: { dealId: Id<'deals'>; orgId: Id<'orgs'>; userId: Id<'users'>; role: Role },
): Promise<Doc<'deals'>> {
  const { dealId, orgId, userId, role } = args;
  const deal = (await ctx.db.get(dealId)) as Doc<'deals'> | null;
  if (!deal) throw new Error('NOT_FOUND');
  if (deal.orgId !== orgId) throw new Error('NOT_FOUND');
  if (deal.state === 'ARCHIVED' && role !== 'admin' && role !== 'principal') throw new Error('NOT_FOUND');
  if (role === 'agent' && !deal.assignedAgentIds.includes(userId)) {
    throw new Error('NOT_FOUND');
  }
  return deal;
}

export async function readDocument(
  ctx: any,
  args: {
    documentId: Id<'documents'>;
    orgId: Id<'orgs'>;
    userId: Id<'users'>;
    role: Role;
  },
): Promise<Doc<'documents'>> {
  const doc = (await ctx.db.get(args.documentId)) as Doc<'documents'> | null;
  if (!doc) throw new Error('NOT_FOUND');
  if (doc.orgId !== args.orgId) throw new Error('NOT_FOUND');
  await readDeal(ctx, { dealId: doc.dealId, ...args });
  return doc;
}

