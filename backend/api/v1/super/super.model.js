import superSchema from "./super.schema.js";
import { hashPassword, mssql, mssqlDataTypes } from "../router.js";

const { INT, VARCHAR } = mssqlDataTypes;

export const Super = {
  /**
   * MIDDLEWARE VALIDATION BEFORE:
   * RESETTING THE SUPER PASSWORD    /api/v1/super/resetSuperPassword  (POST)
   **/
  schema: {
    resetSuperPassword: superSchema.resetSuperPassword,
  },

  async resetSuperPassword(userId, newPassword) {
    await mssql()
      .request.input("userId", INT, userId)
      .input("password", VARCHAR, await hashPassword(newPassword))
      .execute("api_v1_super_update_superPassword");
  },

  // GET SUPER PASSWORD
  async getSuperPassword(userId, transaction = undefined) {
    const request = transaction ? mssql(transaction).request : mssql().request;

    const {
      output: { hash: password },
    } = await request
      .input("userId", INT, userId)
      .output("hash", VARCHAR)
      .execute("api_v1_super_getPassword");

    return password;
  },
};
