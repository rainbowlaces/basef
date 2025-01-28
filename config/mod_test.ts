import { assertEquals } from "jsr:@std/assert@^1.0.0";
import { BaseConfig } from "./mod.ts"; // Adjust the path as needed.

Deno.test("BaseConfig - Load default.ts only (no environment)", async () => {
  const mockConfigDir = "./test/test-config";
  await BaseConfig.init(mockConfigDir);

  const namespace1 = BaseConfig.getNamespace("namespace1");
  assertEquals(namespace1, {
    key1: "value1",
    key2: "value2",
  });
});

Deno.test("BaseConfig - Merge default.ts with dev.ts", async () => {
  const mockConfigDir = "./test/test-config";
  await BaseConfig.init(mockConfigDir, "dev");

  const namespace1 = BaseConfig.getNamespace("namespace1");
  assertEquals(namespace1, {
    key1: "value1",
    key2: "dev-specific-value",
    key3: "dev-only-value",
  });
});

Deno.test("BaseConfig - Handle missing environment file gracefully", async () => {
  const mockConfigDir = "./test/test-config";
  await BaseConfig.init(mockConfigDir, "nonexistent");

  const namespace1 = BaseConfig.getNamespace("namespace1");
  assertEquals(namespace1, {
    key1: "value1",
    key2: "value2",
  });
});

Deno.test("BaseConfig - Apply templates from templates.ts", async () => {
  const mockConfigDir = "./test/test-config";
  await BaseConfig.init(mockConfigDir);

  const namespace1 = BaseConfig.getNamespace("namespace2");
  assertEquals(namespace1, {
    key1: "value1",
    key2: "template-value",
  });
});

Deno.test("BaseConfig - Handle missing templates.ts gracefully", async () => {
  const mockConfigDir = "./test/no-templates";
  await BaseConfig.init(mockConfigDir);
  const templates = BaseConfig["_templates"];
  assertEquals(templates, {});
});

Deno.test("BaseConfig - Get namespace configuration", async () => {
  const mockConfigDir = "./test/test-config";
  await BaseConfig.init(mockConfigDir);

  const namespace1 = BaseConfig.getNamespace("namespace2");
  assertEquals(namespace1, {
    key1: "value1",
    key2: "template-value",
  });
});

Deno.test("BaseConfig - Handle missing namespace", async () => {
  const mockConfigDir = "./test/test-config";
  await BaseConfig.init(mockConfigDir);

  const missingNamespace = BaseConfig.getNamespace("missingNamespace");
  assertEquals(missingNamespace, {});
});

Deno.test("BaseConfig - Get existing key", async () => {
  const mockConfigDir = "./test/test-config";
  await BaseConfig.init(mockConfigDir);

  const config = new BaseConfig("namespace2");
  assertEquals(config.get("key2"), "template-value");
});

Deno.test("BaseConfig - Get missing key without default value", async () => {
    const mockConfigDir = "./test/test-config";
    await BaseConfig.init(mockConfigDir);
  
    const config = new BaseConfig("namespace1");
    assertEquals(config.get("missingKey"), undefined);
  });

  Deno.test("BaseConfig - Get missing key with default value", async () => {
    const mockConfigDir = "./test/test-config";
    await BaseConfig.init(mockConfigDir);
  
    const config = new BaseConfig("namespace1");
    assertEquals(config.get("missingKey", "defaultValue"), "defaultValue");
  });

  Deno.test("BaseConfig - Apply nested templates", async () => {
    const mockConfigDir = "./test/test-config";
    await BaseConfig.init(mockConfigDir);
  
    const namespace1 = BaseConfig.getNamespace("namespace3");
    assertEquals(namespace1, {
      key1: "value1",
      key2: "template-value",
      key3: "template-key3-value",
    });
  });

  Deno.test("BaseConfig - Throw error for circular templates", async () => {
    const mockConfigDir = "./test/circular";

    try {
        await BaseConfig.init(mockConfigDir);
    }
    catch (e) {
        assertEquals((e as Error).message, "Template application exceeded maximum depth of 20. Possible circular reference.");
    }
  });