import getCriticalEnvVariable from "../getCriticalEnvVariable.js";

/**
 * Given some information about an ElectroDB entity, create it's entity model
 *
 * @param entity The name of the entity
 * @param version The version of this entity schema
 * @returns A full entity model object setup for this service.
 */
export default function createEntityModel(config: { entityName: string; entityVersion: string }) {
  return {
    entity: config.entityName,
    version: config.entityVersion,
    service: getCriticalEnvVariable("SERVICE_NAME"),
  };
}
