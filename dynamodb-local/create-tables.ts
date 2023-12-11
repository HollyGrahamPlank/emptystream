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
import * as path from "path";
import {
  DynamoDBClient,
  ListTablesCommand,
  CreateTableCommand,
  CreateTableCommandInput,
} from "@aws-sdk/client-dynamodb";
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
 * Takes the potentially templated name of a DynamoDB table in the serverless config, and resolves
 * the templates in it so that we can actually USE the table name. This does not scan the serverless
 * yml for info about how to resolve - it's just hardcoded to handle a few common cases.
 *
 * For example - this turns "${sls:stage}-${self:service}-transmissions" into
 * "dev-emptystream-transmissions".
 *
 * @param unresolvedTableName The raw string of a DynamoDB table's name in the
 *   serverless-resources.yml file.
 * @param serviceName The name of the application that we are creating tables for.
 * @returns
 */
function resolveServerlessResourceTableName(
  unresolvedTableName: string,
  serviceName: string,
): string {
  // eslint-disable-next-line no-template-curly-in-string
  return unresolvedTableName.replace("${sls:stage}", "dev").replace("${self:service}", serviceName);
}

/**
 * Create any non-existing DynamoDB tables provided by the SLS config, using the provided DynamoDB
 * client.
 *
 * @param serverlessResourcesConfigPath
 * @param client
 */
async function createLocalDynamoDBTables(
  serviceName: string,
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
        ProvisionedThroughput,
      } = definition.Properties;

      const resolvedTableName: string = resolveServerlessResourceTableName(TableName, serviceName);
      console.info(`${logicalId}: DynamoDB Local - Creating: ${resolvedTableName} ...`);

      // If this table already exists, skip it.
      if (existingTables.find((table) => table === resolvedTableName)) {
        console.info("\tOK - ALREADY EXISTS");
        return;
      }

      // OTHERWISE... create a new emulated table based on it's definition.
      const createTableConfig: CreateTableCommandInput = {
        AttributeDefinitions,
        KeySchema,
        TableName: resolvedTableName,
        BillingMode,
        LocalSecondaryIndexes,
        GlobalSecondaryIndexes,
        ProvisionedThroughput,
      };

      try {
        const createCommand = new CreateTableCommand(createTableConfig);
        await client.send(createCommand);
        console.info("\tOK");
      } catch (e) {
        console.error(`\tERR: ${e}`);
      }
    }),
  );
}

//
//  RUN
//

// Where the serverless.yml file is store relative to this file.
const resourcesPath = path.join(process.cwd(), "serverless-resources.yml");

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
await createLocalDynamoDBTables("emptystream", resourcesPath, fakeDBClient);
