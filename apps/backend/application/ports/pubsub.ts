export type PubSub = {
  publish: <T>(topic: string, payload: T) => Promise<void>;

  subscribe: <T>(topic: string, handler: (payload: T) => void) => Subscription;

  closeByPrefix: (prefix: string) => void;
};

export type Subscription = {
  unsubscribe: () => void;
};

export const PubSub = "PubSub" as const;
