import { Entity } from "electrodb";
import createEntityConfig from "../createEntityConfig.js";
import createEntityModel from "../createEntityModel.js";

const Transmission = new Entity(
  {
    model: createEntityModel({
      entityName: "transmission",
      entityVersion: "1",
    }),
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
  createEntityConfig(),
);
export default Transmission;
