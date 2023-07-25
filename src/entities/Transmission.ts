import { DynamoDB } from "aws-sdk";
import { Entity, EntityConfiguration, Service } from "electrodb";

const client = new DynamoDB.DocumentClient();
const tableName = "placeholder";
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
