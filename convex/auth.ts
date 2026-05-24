/**
 * Convex Auth — first-party auth for the EcoCribs Documentation Portal.
 *
 * We use the Password provider so staff (admins, managers, documentation
 * officers, agents) sign in with email + password. External participants
 * (clients, witnesses) continue to authenticate via single-use `invitations`
 * tokens — they are NOT users and do not pass through Convex Auth.
 *
 * The Convex Auth library manages its own tables (see `authTables` spread in
 * `schema.ts`) plus the `users` table, which we extend with our profile
 * fields. HTTP routes are mounted in `http.ts` via `auth.addHttpRoutes(http)`.
 *
 * See: https://labs.convex.dev/auth
 */
import { convexAuth } from '@convex-dev/auth/server';
import { Password } from '@convex-dev/auth/providers/Password';

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
});
