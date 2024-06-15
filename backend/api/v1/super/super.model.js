import { mssql, mssqlDataTypes } from "../router.js";
const { INT, VARCHAR } = mssqlDataTypes;

export const Super = {
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
