import {
  mssql,
  mssqlDataTypes,
  config,
  dateISO8601,
  dateMSSharePoint,
  GlobalError,
} from "../router.js";

const { NVARCHAR } = mssqlDataTypes;

export const Stats = {
  // GET ALL STATS
  async all() {
    const {
      output: { stats },
    } = await mssql()
      .request.output("stats", NVARCHAR)
      .execute("api_v1_stats_getAll");

    return JSON.parse(stats);
  },
};
