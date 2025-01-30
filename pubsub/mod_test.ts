import { assertEquals } from "jsr:@std/assert@^1.0.0";
import { BasePubSub, type BasePubSubArgs } from "./mod.ts";
import { delay, tick } from "@basef/utils";

// Helper function to reset the BasePubSub state before each test
function resetBasePubSub() {
  // Accessing private static properties using (BasePubSub as any)
  // deno-lint-ignore no-explicit-any
  (BasePubSub as any).subscriptions = new Set();
  // deno-lint-ignore no-explicit-any
  (BasePubSub as any)._inflightCount = 0;
}

Deno.test("BasePubSub - sub and pub basic functionality", async () => {
  resetBasePubSub();
  const pubSub = BasePubSub.create();
  let handlerCalled = false;

  BasePubSub.sub("/test/topic", async (args: BasePubSubArgs) => {
    handlerCalled = true;
    assertEquals(args.topic, "/test/topic");
    assertEquals(args.data, "payload");
  });

  await pubSub.pub("/test/topic", { data: "payload" });
  await delay(10);

  assertEquals(handlerCalled, true);
});

Deno.test("BasePubSub - subscription with wildcard patterns", async () => {
  resetBasePubSub();
  const pubSub = BasePubSub.create();
  let handlerCalled = false;

  BasePubSub.sub("/user/*", async (args: BasePubSubArgs) => {
    handlerCalled = true;
    assertEquals(args.topic, "/user/created");
    assertEquals(args.data, "new user");
  });

  await pubSub.pub("/user/created", { data: "new user" });
  await delay(10);
  assertEquals(handlerCalled, true);
});

Deno.test("BasePubSub - one-time subscription", async () => {
  resetBasePubSub();
  const pubSub = BasePubSub.create();
  let callCount = 0;

  BasePubSub.sub("/single/call", async () => {
    callCount += 1;
  }, true);

  await pubSub.pub("/single/call");
  await pubSub.pub("/single/call");

  assertEquals(callCount, 1);
});

Deno.test("BasePubSub - multiple subscriptions to the same topic", async () => {
  resetBasePubSub();
  const pubSub = BasePubSub.create();
  let handler1Called = false;
  let handler2Called = false;

  BasePubSub.sub("/multi/topic", async () => {
    handler1Called = true;
  });

  BasePubSub.sub("/multi/topic", async () => {
    handler2Called = true;
  });

  await pubSub.pub("/multi/topic");

  assertEquals(handler1Called, true);
  assertEquals(handler2Called, true);
});

Deno.test("BasePubSub - subscribing the same handler multiple times", async () => {
  resetBasePubSub();
  const pubSub = BasePubSub.create();
  let callCount = 0;
  const handler = async () => {
    callCount += 1;
  };

  BasePubSub.sub("/duplicate/topic", handler);
  BasePubSub.sub("/duplicate/topic", handler);

  await pubSub.pub("/duplicate/topic");

  assertEquals(callCount, 2);
});

Deno.test("BasePubSub - publication with multiple subscribers", async () => {
  resetBasePubSub();
  const pubSub = BasePubSub.create();
  let handler1Called = false;
  let handler2Called = false;

  BasePubSub.sub("/multiple/subs", async () => {
    handler1Called = true;
  });

  BasePubSub.sub("/multiple/subs", async () => {
    handler2Called = true;
  });

  await pubSub.pub("/multiple/subs");

  assertEquals(handler1Called, true);
  assertEquals(handler2Called, true);
});

Deno.test("BasePubSub - publication with handlers subscribing to patterns", async () => {
  resetBasePubSub();
  const pubSub = BasePubSub.create();
  let handlerCalled = false;

  BasePubSub.sub("/order/:status/:item", async (args: BasePubSubArgs) => {
    handlerCalled = true;
    assertEquals(args.topic, "/order/created/book");
    assertEquals(args.status, "created");
    assertEquals(args.item, "book");
  });

  await pubSub.pub("/order/created/book");
  assertEquals(handlerCalled, true);
});

Deno.test("BasePubSub - publication arguments are merged correctly", async () => {
  resetBasePubSub();
  const pubSub = BasePubSub.create();
  let receivedArgs: BasePubSubArgs | null = null;

  BasePubSub.sub("/arg/:test1/:test2/**", async (args: BasePubSubArgs) => {
    receivedArgs = args;
  });

  await pubSub.pub("/arg/test1/test2/test3/test4", { test5: "test5" });

  assertEquals(receivedArgs, {
    _: [
      "test3",
      "test4",
    ],
    test1: "test1",
    test2: "test2",
    test5: "test5",
    topic: "/arg/test1/test2/test3/test4",
  });
});

Deno.test("BasePubSub - one-time subscriptions are removed after invocation", async () => {
  resetBasePubSub();
  const pubSub = BasePubSub.create();
  let callCount = 0;

  BasePubSub.sub("/remove/once", async () => {
    callCount += 1;
  }, true);

  await pubSub.pub("/remove/once");
  await pubSub.pub("/remove/once");

  assertEquals(callCount, 1);
});

Deno.test("BasePubSub - concurrent publications and inFlight count", async () => {
  resetBasePubSub();
  const pubSub = BasePubSub.create();
  let handler1Called = false;
  let handler2Called = false;

  BasePubSub.sub("/concurrent/topic", async () => {
    await tick();
    handler1Called = true;
  });

  BasePubSub.sub("/concurrent/topic", async () => {
    await tick();
    handler2Called = true;
  });

  const pub1 = pubSub.pub("/concurrent/topic");
  const pub2 = pubSub.pub("/concurrent/topic");

  // Immediately check inFlight count
  assertEquals(BasePubSub.inFlight, 2);

  await Promise.all([pub1, pub2]);

  await delay(10);

  // After completion, inFlight should be 0
  assertEquals(BasePubSub.inFlight, 0);
  assertEquals(handler1Called, true);
  assertEquals(handler2Called, true);
});

Deno.test("BasePubSub - error handling in handlers does not affect other handlers", async () => {
  resetBasePubSub();
  const pubSub = BasePubSub.create();
  let handler2Called = false;

  BasePubSub.sub("/error/test", async () => {
    throw new Error("Handler error");
  });

  BasePubSub.sub("/error/test", async () => {
    handler2Called = true;
  });

  await pubSub.pub("/error/test");
  await delay(10);
  assertEquals(handler2Called, true);
});

Deno.test("BasePubSub - unsubscribing by topic removes all related subscriptions", async () => {
  resetBasePubSub();
  const pubSub = BasePubSub.create();
  let handler1Called = false;
  let handler2Called = false;

  BasePubSub.sub("/unsubscribe/topic", async () => {
    handler1Called = true;
  });

  BasePubSub.sub("/unsubscribe/topic", async () => {
    handler2Called = true;
  });

  BasePubSub.unsub("/unsubscribe/topic");
  await pubSub.pub("/unsubscribe/topic");

  assertEquals(handler1Called, false);
  assertEquals(handler2Called, false);
});

Deno.test("BasePubSub - unsubscribing by subscription instance", async () => {
  resetBasePubSub();
  const pubSub = BasePubSub.create();
  let handlerCalled = false;

  const subscription = BasePubSub.sub("/instance/unsubscribe", async () => {
    handlerCalled = true;
  });

  BasePubSub.unsub(subscription);
  await pubSub.pub("/instance/unsubscribe");

  assertEquals(handlerCalled, false);
});

Deno.test("BasePubSub - unsubscribing non-existent topic does not throw", () => {
  resetBasePubSub();
  // Should not throw any errors
  BasePubSub.unsub("/non/existent/topic");
});

Deno.test("BasePubSub - once method resolves on next publish", async () => {
  resetBasePubSub();
  const pubSub = BasePubSub.create();

  const oncePromise = BasePubSub.once("/once/topic");
  let resolved = false;

  oncePromise.then(() => {
    resolved = true;
  });

  await tick();
  assertEquals(resolved, false);

  await pubSub.pub("/once/topic");
  await tick();
  assertEquals(resolved, true);
});

Deno.test("BasePubSub - multiple once subscriptions resolve on a single publish", async () => {
  resetBasePubSub();
  const pubSub = BasePubSub.create();

  let resolveCount = 0;
  const once1 = BasePubSub.once("/multi/once");
  const once2 = BasePubSub.once("/multi/once");

  once1.then(() => {
    resolveCount += 1;
  });

  once2.then(() => {
    resolveCount += 1;
  });

  await pubSub.pub("/multi/once");
  await tick();

  assertEquals(resolveCount, 2);
});

Deno.test("BasePubSub - once promise does not resolve on previous publishes", async () => {
  resetBasePubSub();
  const pubSub = BasePubSub.create();

  await pubSub.pub("/late/once"); // Publish before calling once

  const oncePromise = BasePubSub.once("/late/once");
  let resolved = false;

  oncePromise.then(() => {
    resolved = true;
  });

  await tick();
  assertEquals(resolved, false);

  await pubSub.pub("/late/once");
  await tick();
  assertEquals(resolved, true);
});

Deno.test("BasePubSub - inFlight count accuracy", async () => {
  resetBasePubSub();
  const pubSub = BasePubSub.create();

  assertEquals(BasePubSub.inFlight, 0);

  const pub1 = pubSub.pub("/inflight/test");
  assertEquals(BasePubSub.inFlight, 1);

  const pub2 = pubSub.pub("/inflight/test");
  assertEquals(BasePubSub.inFlight, 2);

  await Promise.all([pub1, pub2]);
  assertEquals(BasePubSub.inFlight, 0);
});

Deno.test("BasePubSub - create method instantiates a new BasePubSub", () => {
  resetBasePubSub();
  const instance = BasePubSub.create();
  assertEquals(instance instanceof BasePubSub, true);
});

Deno.test("BasePubSub - multiple instances share the same subscriptions due to static properties", async () => {
  resetBasePubSub();
  const pubSub1 = BasePubSub.create();
  let handler1Called = false;
  let handler2Called = false;

  BasePubSub.sub("/shared/topic", async () => {
    handler1Called = true;
  });

  BasePubSub.sub("/shared/topic", async () => {
    handler2Called = true;
  });

  await pubSub1.pub("/shared/topic");

  assertEquals(handler1Called, true);
  assertEquals(handler2Called, true);
});

Deno.test("BasePubSub - publication to topics with no matching subscriptions", async () => {
  resetBasePubSub();
  const pubSub = BasePubSub.create();

  // Should complete without invoking any handlers
  await pubSub.pub("/no/match/topic");
  // No assertion needed as no handlers should be called
});

Deno.test("BasePubSub - unsubscribing during publication does not affect current handlers", async () => {
  resetBasePubSub();
  const pubSub = BasePubSub.create();
  let handler1Called = false;
  let handler2Called = false;

  // Subscribe the first handler which unsubscribes during publication
  BasePubSub.sub("/unsubscribe/during/pub", async () => {
    handler1Called = true;
    BasePubSub.unsub("/unsubscribe/during/pub");
  });

  // Subscribe the second handler
  BasePubSub.sub("/unsubscribe/during/pub", async () => {
    handler2Called = true;
  });

  await pubSub.pub("/unsubscribe/during/pub");
  // Publish again to ensure unsubscribed handlers are not called
  await pubSub.pub("/unsubscribe/during/pub");

  assertEquals(handler1Called, true);
  assertEquals(handler2Called, true);

  // After unsubscription, handlers should not be called again
  handler1Called = false;
  handler2Called = false;

  await pubSub.pub("/unsubscribe/during/pub");
  assertEquals(handler1Called, false);
  assertEquals(handler2Called, false);
});

Deno.test("BasePubSub - handlers modifying subscriptions during publish", async () => {
  resetBasePubSub();
  const pubSub = BasePubSub.create();
  let handler1Called = false;
  let handler2Called = false;

  // Subscribe the first handler which adds a new subscription during publication
  BasePubSub.sub("/modify/subs", async () => {
    handler1Called = true;
    BasePubSub.sub("/modify/subs", async () => {
      handler2Called = true;
    });
  });

  await pubSub.pub("/modify/subs");
  // Handler2 should not be called during the first publish
  assertEquals(handler1Called, true);
  assertEquals(handler2Called, false);

  // Handler2 should be called in the next publish
  await pubSub.pub("/modify/subs");
  assertEquals(handler2Called, true);
});

Deno.test("BasePubSub - multiple publishes do not interfere with each other", async () => {
  resetBasePubSub();
  const pubSub = BasePubSub.create();
  let handler1Count = 0;
  let handler2Count = 0;

  BasePubSub.sub("independent.pub1", async () => {
    handler1Count += 1;
  });

  BasePubSub.sub("independent.pub2", async () => {
    handler2Count += 1;
  });

  const pub1 = pubSub.pub("independent.pub1");
  const pub2 = pubSub.pub("independent.pub2");

  await Promise.all([pub1, pub2]);

  assertEquals(handler1Count, 1);
  assertEquals(handler2Count, 1);
});
