export type Actor = { kind: "guest" };

export interface AuthService {
  getActor(): Promise<Actor>;
}

/** Guest-only implementation: every visitor is a guest (no accounts in Foundation). */
export const guestAuthService: AuthService = {
  async getActor() {
    return { kind: "guest" };
  },
};
