/**
 * Re-export of `convex/react` hooks with a preview-mode short-circuit.
 *
 * In preview, real Convex isn't connected and the stub function refs would
 * fail validation. We swap `useQuery`/`useMutation`/`useAction` for no-op
 * versions so pages render without errors; they fall back to seed data
 * from `@/lib/preview`. In production these are just the real Convex hooks.
 */
import {
  useQuery as realUseQuery,
  useMutation as realUseMutation,
  useAction as realUseAction,
} from 'convex/react';
import { IS_PREVIEW } from './preview';

const noopQuery: typeof realUseQuery = (() => undefined) as unknown as typeof realUseQuery;
const noopMutation: typeof realUseMutation = ((() =>
  async () => {
    throw new Error('PREVIEW_MODE: Convex mutation skipped. Wire real Convex to enable.');
  }) as unknown as typeof realUseMutation);
const noopAction: typeof realUseAction = ((() =>
  async () => {
    throw new Error('PREVIEW_MODE: Convex action skipped. Wire real Convex to enable.');
  }) as unknown as typeof realUseAction);

export const useQuery: typeof realUseQuery = IS_PREVIEW ? noopQuery : realUseQuery;
export const useMutation: typeof realUseMutation = IS_PREVIEW ? noopMutation : realUseMutation;
export const useAction: typeof realUseAction = IS_PREVIEW ? noopAction : realUseAction;
