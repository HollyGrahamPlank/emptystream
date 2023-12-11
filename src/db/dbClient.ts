import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

/**
 * @returns A new client for connecting to DynamoDB. If we're running locally, this will connect us
 *   to the local database. If we're running in the cloud, this will connect us to the real
 *   database.
 */
function createDBClient(): DynamoDBClient {
  // If we're running in the cloud... just make the client as normal. AWS should provide us creds.
  if (!process.env.IS_OFFLINE) return new DynamoDBClient({});

  // OTHERWISE - we're running locally. Assume we're using dummy credentials.
  return new DynamoDBClient({
    region: "local",
    credentials: {
      accessKeyId: "XXXXXXXXXXXXXXX",
      secretAccessKey: "XXXXXXXXXXXXXXXXXXXXXX",
    },
    endpoint: {
      hostname: "localhost",
      port: 30333,
      path: "",
      protocol: "http:",
    },
  });
}

const dbClient = createDBClient();
export default dbClient;
