import { mssql, mssqlDataTypes } from "../router.js";
const { Int, VarChar } = mssqlDataTypes;

export const Super = {
  // GET SUPER PASSWORD
  async getSuperPassword(userId, transaction = undefined) {
    const request = transaction ? mssql(transaction).request : mssql().request;

    const {
      output: { hash: password },
    } = await request
      .input("userId", Int, userId)
      .output("hash", VarChar)
      .execute("api_v1_super_getPassword");

    return password;
  },
};
