import * as model from "./model.js";

// JSON Fetch requests
const fetchJSON = async (url, method = undefined, jsonData = undefined) => {
  try {
    const response =
      method && jsonData
        ? await fetch(url, {
            method: method,
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify(jsonData),
          })
        : await fetch(url);

    let data;
    if (method === "DELETE") data = null;
    else data = await response.json();

    if (!response.ok)
      throw new Error(
        `${data.message} Request failed with status code ${response.status} (${response.statusText}).`
      );
    return { response, data };
  } catch (error) {
    throw error;
  }
};

export default {
  v1: {
    reports: {
      url: "/api/v1/reports",

      async getReports() {
        return await fetchJSON(this.url);
      },
      async getAllSoftDeletedReports() {
        return await fetchJSON(`${this.url}/softDeleted`);
      },
      async createReport(report) {
        return await fetchJSON(this.url, "POST", report);
      },
      async getReport(id) {
        return await fetchJSON(`${this.url}/${id}`);
      },
      async updateReport(id, report) {
        return await fetchJSON(`${this.url}/${id}`, "PUT", report);
      },
      async deleteReport(id) {
        return await fetchJSON(`${this.url}/${id}`, "DELETE", {});
      },
      async undoSoftDeleteReport(id) {
        return await fetchJSON(`${this.url}/${id}/undoSoftDelete`, "PUT", {});
      },
    },

    users: {
      url: "/api/v1/users",

      async resetUserPassword(id, password, passwordConfirmation) {
        return await fetchJSON(`${this.url}/${id}/resetPassword`, "POST", {
          password,
          passwordConfirmation,
        });
      },
      async getUsers() {
        return await fetchJSON(this.url);
      },
      async createUser(user) {
        return await fetchJSON(this.url, "POST", user);
      },
      async getUser(id) {
        return await fetchJSON(`${this.url}/${id}`);
      },
      async updateUser(id, user) {
        return await fetchJSON(`${this.url}/${id}`, "PUT", user);
      },
      async deleteUser(id) {
        return await fetchJSON(`${this.url}/${id}`, "DELETE", {});
      },
      async enableUser(id) {
        return await fetchJSON(`${this.url}/${id}/enable`, "PUT", {});
      },
      async disableUser(id) {
        return await fetchJSON(`${this.url}/${id}/disable`, "PUT", {});
      },
      async getCurrentUser() {
        return await fetchJSON(`${this.url}/me`);
      },
    },

    version: {
      url: "/api/v1/version",

      // Get app version
      async getVersion() {
        return (model.state.version = (await fetchJSON(this.url)).data.version);
      },
    },

    webhook: {
      url: "/api/v1/webhook",

      async sendReportToIncomingWebhook(id) {
        return await fetchJSON(`${this.url}/${id}`, "POST", {});
      },
    },
  },

  // Send Teams webhook data to local server. Local server will send webhook & handle webhook response
  sendTeamsWebhook: async function (report) {
    return await fetchJSON(`/api/v1/webhook/${report.id}`, report);
  },

  // Send a copy of reports to local server. Local server will write reports into a JSON file for backup
  sendBackupReports: async function (reports) {
    return await fetchJSON("/api/backup", reports);
  },
};
