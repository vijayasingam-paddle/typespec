import { it } from "vitest";
import { ApiTester } from "./test-host.js";
import { getOpenAPI3 } from "../src/openapi.js";
import { OpenAPI3QueryParameter } from "../src/types.js";
import { ok, strictEqual } from "assert";

it("should not generate duplicate extensions", async () => {
  const { program } = await ApiTester.compile(
    `
    import "@typespec/http";
    import "@typespec/openapi";
    import "@typespec/openapi3";
    
    using OpenAPI;
    using Http;
    
    @service
    namespace Foo;
    
    @get op get(...QueryParams): Item;
    
    model QueryParams {
      @extension("x-foo", "bar")
      @query
      id: string;
    }
    
    
    model Item { x: true }
  `,
    {
      compilerOptions: {
        emit: ["@typespec/openapi3"],
        options: {
          "@typespec/openapi3": {
            "openapi-versions": ["3.1.0"],
          },
        },
      },
    },
  );
  const output = await getOpenAPI3(program, {"openapi-versions": ["3.1.0"]});
  const documentRecord = output[0];
  ok(!documentRecord.versioned, "should not be versioned");

  const queryParams = documentRecord.document.components?.parameters!['QueryParams'] as OpenAPI3QueryParameter;

  // The extension `x-foo` is generated both at the root of the query parameter and in the schema.
  strictEqual(queryParams.schema['x-foo'], "bar");
  strictEqual(queryParams['x-foo'], "bar");
});
