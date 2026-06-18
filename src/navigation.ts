import type { Doc } from '../convex/_generated/dataModel';

// The screens in the main stack and the params each one receives.
// `undefined` means the screen takes no params.
export type RootStackParamList = {
  Home: undefined;
  Track: undefined;
  RunDetail: { run: Doc<'runs'> };
};
