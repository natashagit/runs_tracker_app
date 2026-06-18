import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

// Email + password authentication. The Password provider handles sign-up and
// sign-in; the client passes `flow: "signUp" | "signIn"` with email/password.
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
});
