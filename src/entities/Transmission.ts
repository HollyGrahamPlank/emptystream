import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { Entity, EntityConfiguration } from "electrodb";

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

const client = createDBClient();
const tableName = `${process.env.SLS_STAGE}-${process.env.SERVICE_NAME}-transmissions`;

const entityConfig: EntityConfiguration = {
  client,
  table: tableName,
};

const Transmission = new Entity(
  {
    model: {
      entity: "transmission",
      version: "1",
      service: "transmissions",
    },
    attributes: {
      id: {
        type: "string",
      },
      name: {
        type: "string",
        required: true,
      },
    },
    indexes: {
      byId: {
        pk: {
          field: "pk",
          composite: ["id"],
        },
        sk: {
          field: "sk",
          composite: [],
        },
      },
    },
  },
  entityConfig,
);
export default Transmission;
