import { mssql, mssqlDataTypes } from "../router.js";
const { NVARCHAR } = mssqlDataTypes;

export const FormData = {
  async all() {
    const {
      output: { formData: rawJSON },
    } = await mssql()
      .request.output("formData", NVARCHAR)
      .execute("api_v1_formData_getAll");

    const formData = JSON.parse(rawJSON);

    return formData;
  },

  async storeNumbers() {
    const {
      output: { formData: rawJSON },
    } = await mssql()
      .request.output("formData", NVARCHAR)
      .execute("api_v1_formData_getStoreNumbers");

    const formData = JSON.parse(rawJSON);

    return formData;
  },

  async districtManagers() {
    const {
      output: { formData: rawJSON },
    } = await mssql()
      .request.output("formData", NVARCHAR)
      .execute("api_v1_formData_getDistrictManagers");

    const formData = JSON.parse(rawJSON);

    return formData;
  },

  async incidentTypes() {
    const {
      output: { formData: rawJSON },
    } = await mssql()
      .request.output("formData", NVARCHAR)
      .execute("api_v1_formData_getIncidentTypes");

    const formData = JSON.parse(rawJSON);

    return formData;
  },

  async incidentTransactionTypes() {
    const {
      output: { formData: rawJSON },
    } = await mssql()
      .request.output("formData", NVARCHAR)
      .execute("api_v1_formData_getIncidentTransactionTypes");

    const formData = JSON.parse(rawJSON);

    return formData;
  },

  async activeUsersByRoleUser() {
    const {
      output: { formData: rawJSON },
    } = await mssql()
      .request.output("formData", NVARCHAR)
      .execute("api_v1_formData_getActiveUsersByRoleUser");

    const formData = JSON.parse(rawJSON);

    return formData;
  },
};
