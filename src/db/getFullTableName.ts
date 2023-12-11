import getCriticalEnvVariable from "../getCriticalEnvVariable.js";

/**
 * Given a table name, constructs the string for a full table name.
 *
 * @example
 *   // When running locally...
 *   getFullTableName("transmissions") => "dev-emptystream-transmissions"
 *
 * @param tableName The short name of the table.
 * @returns The full name for a table.
 */
export default function getFullTableName(tableName: string) {
  return `${getCriticalEnvVariable("SLS_STAGE")}-${getCriticalEnvVariable(
    "SERVICE_NAME",
  )}-${tableName}`;
}
