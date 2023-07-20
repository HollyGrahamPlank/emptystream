import LambdaTest from "./tools/lambda-test";
import { handler as exampleHandler } from "../src/handlers/example";

it("Ensures that hello world works", async () => {
  const result = await LambdaTest.run(exampleHandler, {});
  const { message } = JSON.parse(result.body);

  expect(message).toBe("Hello World!");
});
