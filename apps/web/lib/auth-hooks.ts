/**
 * Convex Auth React hooks with a preview-mode short-circuit.
 *
 * `useAuthActions` requires a ConvexAuthProvider context. In preview mode we
 * skip the provider (no Convex backend), so we substitute a no-op version
 * that just throws if called — preview pages never invoke signIn anyway,
 * they use the local demo-credential check instead.
 */
import { useAuthActions as realUseAuthActions } from '@convex-dev/auth/react';
import { IS_PREVIEW } from './preview';

const noopActions = {
  signIn: async () => {
    throw new Error('PREVIEW_MODE: signIn unavailable. Wire real Convex Auth to enable.');
  },
  signOut: async () => {
    throw new Error('PREVIEW_MODE: signOut unavailable.');
  },
};

export const useAuthActions: typeof realUseAuthActions = IS_PREVIEW
  ? ((() => noopActions) as unknown as typeof realUseAuthActions)
  : realUseAuthActions;
