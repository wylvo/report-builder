import * as model from "./model.js";

export let isRequestInProgress = false;

// JSON Fetch requests
const fetchJSON = async (url, method = "GET", jsonData = undefined) => {
  if (["POST", "PUT", "DELETE"].includes(method.toUpperCase())) {
    if (isRequestInProgress) {
      console.warn("A HTTP request is already in progress... Please wait.");
      return { response: {}, data: {} };
    }
    isRequestInProgress = true;
  }

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
    if (method === "DELETE" || response.status === 429) data = null;
    else data = await response.json();

    if (!response.ok) return formatError(data, response);
    return { response, data };
  } catch (error) {
    throw error;
  } finally {
    if (["POST", "PUT", "DELETE"].includes(method.toUpperCase())) {
      isRequestInProgress = false;
    }
  }
};

const formatError = (data, response) => {
  if (data)
    throw new Error(
      `${data.message} Request failed with status code ${response.status} (${response.statusText}).`
    );
  if (!data)
    throw new Error(
      `Request failed with status code ${response.status} (${response.statusText}).`
    );
};

export default {
  v1: {
    reports: {
      url: "/api/v1/reports",

      async getReports(pageNumber = 1, rowsPerPage = 500) {
        return await fetchJSON(
          `${this.url}?page=${pageNumber}&rows=${rowsPerPage}`
        );
      },
      async getAllSoftDeletedReports(pageNumber = 1, rowsPerPage = 500) {
        return await fetchJSON(
          `${this.url}/softDeleted?page=${pageNumber}&rows=${rowsPerPage}`
        );
      },
      // prettier-ignore
      async getAllReportsCreatedByUser(username, pageNumber = 1, rowsPerPage = 500) {
        return await fetchJSON(
          `${this.url}/createdBy/${username}?page=${pageNumber}&rows=${rowsPerPage}`
        );
      },
      // prettier-ignore
      async getAllSoftDeletedReportsCreatedByUser(username, pageNumber = 1, rowsPerPage = 500) {
        return await fetchJSON(
          `${this.url}/softDeleted/createdBy/${username}?page=${pageNumber}&rows=${rowsPerPage}`
        );
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
      async hardDeleteReport(id, password) {
        return await fetchJSON(`${this.url}/${id}`, "DELETE", { password });
      },
      async softDeleteReport(id) {
        return await fetchJSON(`${this.url}/${id}/softDelete`, "PUT", {});
      },
      async undoSoftDeleteReport(id) {
        return await fetchJSON(`${this.url}/${id}/softDeleteUndo`, "PUT", {});
      },

      import() {
        const url = `${this.url}/import`;

        return {
          async importReports(reports) {
            return await fetchJSON(url, "POST", reports);
          },
        };
      },

      migrate() {
        const url = `${this.url}/migrate`;

        return {
          async migrateReports(reports) {
            return await fetchJSON(url, "POST", reports);
          },
        };
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
      async getUsers(pageNumber = 1, rowsPerPage = 200) {
        return await fetchJSON(
          `${this.url}?page=${pageNumber}&rows=${rowsPerPage}`
        );
      },
      async getUsersFrontend(pageNumber = 1, rowsPerPage = 200) {
        return await fetchJSON(
          `${this.url}/frontend?page=${pageNumber}&rows=${rowsPerPage}`
        );
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
      async getCurrentUserAccount() {
        return await fetchJSON(`${this.url}/account`);
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

      // Send report to Microsoft Teams Incoming Webhook
      async sendReportToIncomingWebhook(id) {
        return await fetchJSON(`${this.url}/${id}`, "POST", {});
      },
    },

    formData: {
      url: "/api/v1/formData",

      // Get Form Data
      async synchonizeFormData() {
        return await fetchJSON(this.url);
      },
    },
  },
};
