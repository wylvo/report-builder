export const FormData = {
  query: {
    getSelectionOptions(type = "all") {
      return `
        SELECT
          ${
            type === "all"
              ? this.allSelectionOptions()
              : type === "storeNumbers"
              ? this.storeNumbersSelectionOptions
              : type === "districtManagers"
              ? this.districtManagersSelectionOptions
              : type === "incidentTypes"
              ? this.incidentTypesSelectionOptions
              : type === "incidentTransactionTypes"
              ? this.incidentTransactionTypesSelectionOptions
              : this.allSelectionOptions()
          }
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;
      `;
    },

    allSelectionOptions() {
      return `
        ${this.storeNumbersSelectionOptions},
        ${this.districtManagersSelectionOptions},
        ${this.incidentTypesSelectionOptions},
        ${this.incidentTransactionTypesSelectionOptions}
      `;
    },

    storeNumbersSelectionOptions: `
      (
        SELECT 
          JSON_QUERY(CONCAT('["',STRING_AGG(JSON_VALUE(value, '$.number'), '","'),'"]'))
        FROM (
          SELECT value
          FROM OPENJSON((SELECT number FROM stores FOR JSON PATH)) AS j
        ) j
      ) AS [storeNumbers]
    `,

    districtManagersSelectionOptions: `
      (
        JSON_QUERY((
          SELECT fullName, username
          FROM districtManagers
          FOR JSON PATH
        ))
      ) AS [districtManagers]
    `,

    incidentTypesSelectionOptions: `
      (
        SELECT 
          JSON_QUERY(CONCAT('["',STRING_AGG(JSON_VALUE(value, '$.type'), '","'),'"]'))
        FROM (
          SELECT value
          FROM OPENJSON((SELECT type FROM incidentTypes FOR JSON PATH)) AS j
        ) j
      ) AS [incidentTypes]
    `,

    incidentTransactionTypesSelectionOptions: `
      (
        SELECT 
          JSON_QUERY(CONCAT('["',STRING_AGG(JSON_VALUE(value, '$.type'), '","'),'"]'))
        FROM (
          SELECT value
          FROM OPENJSON((SELECT type FROM incidentTransactionTypes FOR JSON PATH)) AS j
        ) j
      ) AS [incidentTransactionTypes]
    `,
  },
};
