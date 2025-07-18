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

    if (!response.ok) return formatError(response);

    let data;

    if (method === "DELETE") data = null;
    else data = await response.json();

    return { response, data };
  } catch (error) {
    throw error;
  } finally {
    if (["POST", "PUT", "DELETE"].includes(method.toUpperCase())) {
      isRequestInProgress = false;
    }
  }
};

export const formatError = async (response) => {
  let errorData;

  try {
    errorData = await response.json();
  } catch (error) {
    console.error(error);
    throw new Error(
      `Request failed with status code ${response.status} (${response.statusText}).`
    );
  }

  if (!errorData)
    throw new Error(
      `Request failed with status code ${response.status} (${response.statusText}).`
    );

  if (errorData && errorData.message)
    throw new Error(
      `${
        errorData.message.endsWith(".")
          ? errorData.message
          : `${errorData.message}.`
      } Request failed with status code ${response.status} (${
        response.statusText
      }).`
    );
};

// prettier-ignore
export default {
  v1: {
    reports: {
      url: "/api/v1/reports",

      async getAllReports(pageNumber = 1, rowsPerPage = 500) {
        return await fetchJSON(`${this.url}?page=${pageNumber}&rows=${rowsPerPage}`);
      },
      async getAllSoftDeletedReports(pageNumber = 1, rowsPerPage = 500) {
        return await fetchJSON(`${this.url}/softDeleted?page=${pageNumber}&rows=${rowsPerPage}`);
      },
      async getAllReportsCreatedByUser(username, pageNumber = 1, rowsPerPage = 500) {
        return await fetchJSON(`${this.url}/createdBy/${username}?page=${pageNumber}&rows=${rowsPerPage}`);
      },
      async getAllSoftDeletedReportsCreatedByUser(username, pageNumber = 1, rowsPerPage = 500) {
        return await fetchJSON(`${this.url}/softDeleted/createdBy/${username}?page=${pageNumber}&rows=${rowsPerPage}`);
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
      async transferReportOwnershipToUser(id, username) {
        return await fetchJSON(`${this.url}/${id}/transferTo/${username}`, "PUT", {});
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

      async resetUserPassword(username, password, passwordConfirmation) {
        return await fetchJSON(`${this.url}/${username}/resetPassword`, "POST", {
          password,
          passwordConfirmation,
        });
      },
      async getUsers(pageNumber = 1, rowsPerPage = 200) {
        return await fetchJSON(`${this.url}?page=${pageNumber}&rows=${rowsPerPage}`);
      },
      async getUsersFrontend(pageNumber = 1, rowsPerPage = 200) {
        return await fetchJSON(`${this.url}/frontend?page=${pageNumber}&rows=${rowsPerPage}`);
      },
      async createUser(user) {
        return await fetchJSON(this.url, "POST", user);
      },
      async getUser(username) {
        return await fetchJSON(`${this.url}/${username}`);
      },
      async updateUser(username, user) {
        return await fetchJSON(`${this.url}/${username}`, "PUT", user);
      },
      async deleteUser(username) {
        return await fetchJSON(`${this.url}/${username}`, "DELETE", {});
      },
      async enableUser(username) {
        return await fetchJSON(`${this.url}/${username}/enable`, "PUT", {});
      },
      async disableUser(username) {
        return await fetchJSON(`${this.url}/${username}/disable`, "PUT", {});
      },
      async getCurrentUserAccount() {
        return await fetchJSON(`${this.url}/account`);
      },
      async transferAllReportRelationshipsToUser(fromTo) {
        return await fetchJSON(`${this.url}/transferAllReportRelationships`, "POST", fromTo);
      }
    },

    version: {
      url: "/api/v1/version",

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

    formData: {
      url: "/api/v1/formData",

      async synchonizeFormData() {
        return await fetchJSON(this.url);
      },
    },

    stats: {
      url: "/api/v1/stats",

      async getStats() {
        return await fetchJSON(this.url);
      },
    },

    activityLog: {
      url: "/api/v1/activityLog",

      async getActivityLogs(pageNumber = 1, rowsPerPage = 500) {
        return await fetchJSON(`${this.url}?page=${pageNumber}&rows=${rowsPerPage}`);
      },

      async getActivityLogsFrontend(pageNumber = 1, rowsPerPage = 500) {
        return await fetchJSON(`${this.url}/frontend?page=${pageNumber}&rows=${rowsPerPage}`);
      },
    },
    authenticationLog: {
      url: "/api/v1/authenticationLog",

      async getAuthenticationLogs(pageNumber = 1, rowsPerPage = 500) {
        return await fetchJSON(`${this.url}?page=${pageNumber}&rows=${rowsPerPage}`);
      },
    },

    stores: {
      url: "/api/v1/stores",

      async getAllStores(pageNumber = 1, rowsPerPage = 500) {
        return await fetchJSON(`${this.url}?page=${pageNumber}&rows=${rowsPerPage}`);
      },
    },
  },
};
