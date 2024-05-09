export const FormData = {
  query: {
    allDropdownSelectionFields: `
      SELECT
        (
          SELECT 
            JSON_QUERY(CONCAT('["',STRING_AGG(JSON_VALUE(value, '$.number'), '","'),'"]'))
          FROM (
            SELECT value
            FROM OPENJSON((SELECT number FROM stores FOR JSON PATH)) AS j
          ) j
        ) AS [storeNumbers],
        (
          SELECT 
            JSON_QUERY(CONCAT('["',STRING_AGG(JSON_VALUE(value, '$.type'), '","'),'"]'))
          FROM (
            SELECT value
            FROM OPENJSON((SELECT type FROM incidentTypes FOR JSON PATH)) AS j
          ) j
        ) AS [incidentTypes],
        (
          SELECT 
            JSON_QUERY(CONCAT('["',STRING_AGG(JSON_VALUE(value, '$.type'), '","'),'"]'))
          FROM (
            SELECT value
            FROM OPENJSON((SELECT type FROM incidentTransactionTypes FOR JSON PATH)) AS j
          ) j
        ) AS [incidentTransactionTypes]
      FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;
    `,
  },
};
