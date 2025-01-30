import console from "node:console"
import { tick } from "@basef/utils";;
import { BasePathMatcher, type PathMatchResult } from "@basef/path-match";

export interface BasePubSubArgs {
  topic: string;
  [key: string]: unknown;
}

type MatchedTopics = Map<string, BasePubSubArgs>;
// deno-lint-ignore no-explicit-any
export type Subscriber = (args: BasePubSubArgs) => Promise<any | void>;

export interface Subscription {
  topic: string;
  matcher: BasePathMatcher;
  handler: Subscriber;
  once: boolean;
  matchedTopics: MatchedTopics;
}

interface SubscriptionMatch {
  subscription: Subscription;
  match: boolean;
  params?: BasePubSubArgs;
  wildcard?: string[];
}

export class BasePubSub {
  private static subscriptions: Set<Subscription> = new Set<Subscription>();
  private static _inflightCount: number = 0;

  static get inFlight(): number {
    return this._inflightCount;
  }

  constructor() {}

  static create(): BasePubSub {
    return new BasePubSub();
  }

  async pub(topic: string, args?: Partial<BasePubSubArgs>): Promise<void> {
    BasePubSub._inflightCount += 1;
    await tick();
    await Promise.all(
      BasePubSub.filterSubs(topic).map(async (m: SubscriptionMatch) => {
        await tick();
        const fullArgs = { ...args, ...(m.params || {}), _:m.wildcard || [], topic };
        m.subscription
          .handler(fullArgs)
          .catch(BasePubSub.handleError.bind(this));
        if (m.subscription.once)
          BasePubSub.subscriptions.delete(m.subscription);
      }),
    );
    BasePubSub._inflightCount -= 1;
  }

  static unsub(topic: string | Subscription): void {
    if (typeof topic === "string") {
      BasePubSub.filterSubs(topic).forEach((m: SubscriptionMatch) => {
        BasePubSub.subscriptions.delete(m.subscription);
      });
      return;
    }
    BasePubSub.subscriptions.delete(topic);
  }

  static async once(topic: string): Promise<void> {
    return new Promise<void>((resolve) => {
      this.sub(topic, async () => resolve(), true);
    });
  }

  static sub(
    topic: string,
    handler: Subscriber,
    once: boolean = false,
  ): Subscription {
    const matcher = new BasePathMatcher(topic);
    const subscription: Subscription = {
      topic,
      handler,
      matcher,
      once,
      matchedTopics: new Map<string, BasePubSubArgs>(),
    };
    this.subscriptions.add(subscription);
    return subscription;
  }

  private static filterSubs(topic: string): SubscriptionMatch[] {
    return Array.from(this.subscriptions)
      .map((subscription: Subscription): SubscriptionMatch => {
        if (subscription.matchedTopics.has(topic)) {
          return {
            subscription,
            match: true,
            params: subscription.matchedTopics.get(topic),
          };
        }

        const matchResult: PathMatchResult = subscription.matcher.match(topic);

        return {
          subscription,
          match: matchResult.matched,
          params: matchResult.params as BasePubSubArgs,
          wildcard: matchResult.wildcard,
        };
      })
      .filter((m: SubscriptionMatch) => !!m.match);
  }

  private static handleError(err: Error): void {
    console.error(err);
  }
}