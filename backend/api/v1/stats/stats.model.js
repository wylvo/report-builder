import {
  mssql,
  mssqlDataTypes,
  config,
  dateISO8601,
  dateMSSharePoint,
  GlobalError,
} from "../router.js";

const { NVARCHAR, VARCHAR, INT, BIT, DATETIMEOFFSET, DATE, TIME } =
  mssqlDataTypes;

export const Stats = {
  async all() {},
};
