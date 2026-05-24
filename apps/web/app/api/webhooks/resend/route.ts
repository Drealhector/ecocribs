import { NextRequest } from 'next/server';
import { Webhook } from 'svix';

/**
 * Resend → svix-signed webhooks. https://resend.com/docs/dashboard/webhooks
 */
export async function POST(req: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return new Response('Webhook misconfigured', { status: 500 });

  const payload = await req.text();
  const headers = {
    'svix-id': req.headers.get('svix-id') ?? '',
    'svix-timestamp': req.headers.get('svix-timestamp') ?? '',
    'svix-signature': req.headers.get('svix-signature') ?? '',
  };

  try {
    new Webhook(secret).verify(payload, headers);
  } catch {
    return new Response('Invalid signature', { status: 401 });
  }

  // TODO(production): forward to internal Convex mutation to update
  //   notifications.state based on event type (email.delivered,
  //   email.bounced, email.complained).

  return new Response('ok', { status: 200 });
}
