import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { internal } from './_generated/api';
import { Webhook } from 'svix';

const http = httpRouter();

http.route({
  path: '/webhooks/clerk',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
    if (!secret) return new Response('Webhook misconfigured', { status: 500 });

    const payload = await req.text();
    const headers = {
      'svix-id': req.headers.get('svix-id') ?? '',
      'svix-timestamp': req.headers.get('svix-timestamp') ?? '',
      'svix-signature': req.headers.get('svix-signature') ?? '',
    };

    let event: any;
    try {
      event = new Webhook(secret).verify(payload, headers);
    } catch {
      return new Response('Invalid signature', { status: 401 });
    }

    switch (event.type) {
      case 'user.created':
      case 'user.updated': {
        const u = event.data;
        await ctx.runMutation(internal.webhooks.clerk.upsertUser, {
          clerkId: u.id,
          email: u.email_addresses?.[0]?.email_address ?? '',
          phone: u.phone_numbers?.[0]?.phone_number,
          fullName: `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.username || u.id,
          avatarUrl: u.image_url,
        });
        break;
      }
      case 'organization.created':
      case 'organization.updated': {
        const o = event.data;
        await ctx.runMutation(internal.webhooks.clerk.upsertOrg, {
          clerkOrgId: o.id,
          name: o.name,
        });
        break;
      }
      case 'organizationMembership.created':
      case 'organizationMembership.updated': {
        const m = event.data;
        await ctx.runMutation(internal.webhooks.clerk.upsertMembership, {
          clerkUserId: m.public_user_data.user_id,
          clerkOrgId: m.organization.id,
          role: m.role,
        });
        break;
      }
    }

    return new Response('ok', { status: 200 });
  }),
});

export default http;
