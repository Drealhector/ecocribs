import { NextRequest } from 'next/server';
import crypto from 'node:crypto';

/**
 * Twilio delivery status callback for WhatsApp messages.
 * https://www.twilio.com/docs/usage/webhooks/messaging-webhooks
 */
export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-twilio-signature');
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!signature || !authToken) return new Response('Missing signature', { status: 401 });

  const url = new URL(req.url).toString();
  const body = await req.text();
  const params = new URLSearchParams(body);

  const sortedKeys = Array.from(params.keys()).sort();
  let data = url;
  for (const k of sortedKeys) data += k + (params.get(k) ?? '');
  const expected = crypto.createHmac('sha1', authToken).update(data).digest('base64');
  if (signature !== expected) return new Response('Invalid signature', { status: 401 });

  // TODO(production): forward to internal Convex mutation
  //   internal.notifications.dispatch.markDelivered({ providerMessageId, state })

  return new Response('ok', { status: 200 });
}
