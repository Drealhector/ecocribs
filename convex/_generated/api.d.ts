/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agents from "../agents.js";
import type * as auth from "../auth.js";
import type * as commissions from "../commissions.js";
import type * as crons from "../crons.js";
import type * as deals from "../deals.js";
import type * as documents_generate from "../documents/generate.js";
import type * as documents_signature from "../documents/signature.js";
import type * as http from "../http.js";
import type * as invitations from "../invitations.js";
import type * as lib_audit from "../lib/audit.js";
import type * as lib_authz from "../lib/authz.js";
import type * as lib_formatters from "../lib/formatters.js";
import type * as lib_tokens from "../lib/tokens.js";
import type * as lib_withAuth from "../lib/withAuth.js";
import type * as notifications_dispatch from "../notifications/dispatch.js";
import type * as notifications_reminders from "../notifications/reminders.js";
import type * as seed from "../seed.js";
import type * as teamInvites from "../teamInvites.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  agents: typeof agents;
  auth: typeof auth;
  commissions: typeof commissions;
  crons: typeof crons;
  deals: typeof deals;
  "documents/generate": typeof documents_generate;
  "documents/signature": typeof documents_signature;
  http: typeof http;
  invitations: typeof invitations;
  "lib/audit": typeof lib_audit;
  "lib/authz": typeof lib_authz;
  "lib/formatters": typeof lib_formatters;
  "lib/tokens": typeof lib_tokens;
  "lib/withAuth": typeof lib_withAuth;
  "notifications/dispatch": typeof notifications_dispatch;
  "notifications/reminders": typeof notifications_reminders;
  seed: typeof seed;
  teamInvites: typeof teamInvites;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
