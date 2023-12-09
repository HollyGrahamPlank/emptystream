/**
 * Originally written by Marco Luthy for "Using DynamoDB Locally in a Serverless Framework Project"
 * this file has been ported to TypeScript and re-written by Holly Plank.
 *
 * This script uses part of the project's Serverless Framework config to connect to a locally-hosted
 * DynamoDB instance. Once connected, it will go through all DynamoDB Tables defined in the config
 * and attempt to create them in the local DynamoDB instance if they do not already exist.
 *
 * This file should be executed using ts-node from the project ROOT - otherwise it will not be able
 * to locate the serverless-resources.yml.
 *
 * @todo Use CLI args to determine the path to `serverless-resources.yml`.
 *
 * @todo Use CLI args to determine the connection details to DynamoDB local.
 */

import { promises as fs } from "fs";
import { DynamoDBClient, ListTablesCommand, CreateTableCommand } from "@aws-sdk/client-dynamodb";
import * as yaml from "js-yaml";

/**
 * A shorthand function for loading details about DynamoDB tables to be created, from a Serverless
 * Framework config file.
 *
 * @param serverlessResourcesConfigPath The path to the Serverless Resources yml file.
 * @returns An array of Objects representing entries in `serverless-resources.yml` that contain the
 *   resource type of a DynamoDB table.
 */
async function getDynamoDBTableResources(serverlessResourcesConfigPath: string) {
  // Load the serverless.yml file, and restrict it to the sls schema
  const configYaml = yaml.loadAll(await fs.readFile(serverlessResourcesConfigPath))[0];

  // Filter the resources that are a DynamoDB table into an array
  return Object.entries<any>(configYaml.Resources).filter(
    ([, resource]) => resource.Type === "AWS::DynamoDB::Table",
  );
}

/**
 * A shorthand command that simply gets a list of all tables.
 *
 * @param client The DynamoDBClient to get the tables from
 * @returns A list of DynamoDBTable entries
 */
async function getExistingDynamoDBTables(client: DynamoDBClient) {
  return client.send(new ListTablesCommand({}));
}

/**
 * Create any non-existing DynamoDB tables provided by the SLS config, using the provided DynamoDB
 * client.
 *
 * @param serverlessResourcesConfigPath
 * @param client
 */
async function createLocalDynamoDBTables(
  serverlessResourcesConfigPath: string,
  client: DynamoDBClient,
) {
  console.log(`Loading DynamoDB resources from "${serverlessResourcesConfigPath}"...`);
  const tables = await getDynamoDBTableResources(serverlessResourcesConfigPath);
  const existingTables = (await getExistingDynamoDBTables(client)).TableNames || [];

  console.log(`Setting up ${tables.length} local DynamoDB tables...`);

  // Loop through every table in parallel...
  await Promise.all(
    tables.map(async ([logicalId, definition]) => {
      // Get relevant properties from this table
      const {
        BillingMode,
        TableName,
        AttributeDefinitions,
        KeySchema,
        GlobalSecondaryIndexes,
        LocalSecondaryIndexes,
      } = definition.Properties;

      // If this table already exists, skip it.
      if (existingTables.find((table) => table === TableName)) return;

      // OTHERWISE... create a new emulated table based on it's definition.
      console.info(`${logicalId}: DynamoDB Local - Creating: ${TableName} ...`);
      const createCommand = new CreateTableCommand({
        AttributeDefinitions,
        BillingMode,
        KeySchema,
        LocalSecondaryIndexes,
        GlobalSecondaryIndexes,
        TableName,
      });
      await client.send(createCommand);

      // Once we have created the table, tell us about it!
      console.info(`${logicalId}: DynamoDB Local - Created table: ${TableName}`);
    }),
  );
}

//
//  RUN
//

// Where the serverless.yml file is store relative to this file.
const resourcesPath = `${process.cwd()}\\serverless-resources.yml`;

// A client to connect to our emulated DynamoDB instance.
const fakeDBClient = new DynamoDBClient({
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

// Create the local DynamoDB tables!
await createLocalDynamoDBTables(resourcesPath, fakeDBClient);
