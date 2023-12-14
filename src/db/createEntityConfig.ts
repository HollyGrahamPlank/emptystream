import { EntityConfiguration } from "electrodb";
import dbClient from "./dbClient.js";
import getFullTableName from "./getFullTableName.js";

/**
 * Creates an EntityConfiguration for ElectroDB, but defaults the `client` and `table` values to use
 * our dbClient and the main table name.
 *
 * @param config The config that we want to create.
 * @returns The full config, with our defaults applied.
 */
export default function createEntityConfig(
  config: Partial<EntityConfiguration> = {},
): EntityConfiguration {
  return { client: dbClient, table: getFullTableName("mainTable"), ...config };
}
