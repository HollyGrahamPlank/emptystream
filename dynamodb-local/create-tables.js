/* eslint-disable import/no-extraneous-dependencies */
const fs = require("fs");
const DynamoDB = require("aws-sdk/clients/dynamodb");
const yaml = require("js-yaml");
const cloudformationSchema = require("@serverless/utils/cloudformation-schema");

/**
 * A shorthand function for loading details about DynamoDB tables to be created, from a Serverless
 * Framework config file.
 *
 * @returns An array of Objects representing entries in `serverless.yml` that contain the resource
 *   type of a DynamoDB table.
 */
async function getDynamoDBTableResources(serverlessConfigPath) {
  // Load the serverless.yml file, and restrict it to the sls schema
  const configYaml = yaml.loadAll(await fs.readFile(serverlessConfigPath), {
    schema: cloudformationSchema,
  })[0];

  // Filter the resources that are a DynamoDB table into an array
  return Object.entries(configYaml.resources.Resources).filter(
    ([, resource]) => resource.Type === "AWS::DynamoDB::Table",
  );
}

/**
 * Create any non-existing DynamoDB tables provided by the SLS config, using the provided DynamoDB
 * client.
 *
 * @param {string} serverlessConfigPath
 * @param {DynamoDB} dynamoDBClient
 */
async function createLocalDynamoDBTables(serverlessConfigPath, dynamoDBClient) {
  console.log(`Loading DynamoDB resources from "${serverlessConfigPath}"...`);
  const tables = await getDynamoDBTableResources(serverlessConfigPath);

  console.log(`Setting up ${tables.length} local DynamoDB tables...`);
  const existingTables = (await dynamoDBClient.listTables().promise()).TableNames;

  // Loop through every table in parallel...
  await Promise.all(
    tables.map(async ([logicalId, definition]) => {
      // Get relevant properties from this table
      const {
        Properties: {
          BillingMode,
          TableName,
          AttributeDefinitions,
          KeySchema,
          GlobalSecondaryIndexes,
          LocalSecondaryIndexes,
        },
      } = definition;

      // If this table already exists, skip it.
      if (existingTables.find((table) => table === TableName)) return;

      // OTHERWISE... create a new emulated table based on it's definition.
      await dynamoDBClient
        .createTable({
          AttributeDefinitions,
          BillingMode,
          KeySchema,
          LocalSecondaryIndexes,
          GlobalSecondaryIndexes,
          TableName,
        })
        .promise();

      // Once we have created the table, tell us about it!
      console.info(`${logicalId}: DynamoDB Local - Created table: ${TableName}`);
    }),
  );
}

//
//  RUN
//

// Where the serverless.yml file is store relative to this file.
const serverlessConfigPath = `${__dirname}../serverless.yml`;

// A client to connect to our emulated DynamoDB instance.
const fakeDBClient = new DynamoDB({
  accessKeyId: "fake-key",
  endpoint: "http://localhost:30333",
  region: "local",
  secretAccessKey: "fake-secret",
});

// Create the local DynamoDB tables!
await createLocalDynamoDBTables(serverlessConfigPath, fakeDBClient);
