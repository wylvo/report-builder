import { FormData } from "./formData.model.js";
import { config, catchAsync, mssql, GlobalError } from "../router.js";
import reportSchema from "../reports/report.schema.js";

// prettier-ignore
export const synchonizeReportValidation = catchAsync(async (req, res, next) => {
  // Store Numbers
  const storeNumbers = reportSchema.create["store.numbers"];
  const storeNumbersImport = reportSchema.import["*.store.numbers"];

  storeNumbers.isIn.options = [config.validation.selects.storeNumbers];
  storeNumbers.isIn.errorMessage = `only '${config.validation.selects.storeNumbers.join("', '")}' are allowed.`;

  storeNumbersImport.isIn.options = [config.validation.selects.storeNumbers];
  storeNumbersImport.isIn.errorMessage = `only '${config.validation.selects.storeNumbers.join("', '")}' are allowed.`;

  // Incident Types
  const incidentTypes = reportSchema.create["incident.types"];
  const incidentTypesImport = reportSchema.import["*.incident.types"];

  incidentTypes.isIn.options = [config.validation.selects.incidentTypes];
  incidentTypes.isIn.errorMessage = `only '${config.validation.selects.incidentTypes.join("', '")}' are allowed.`;

  incidentTypesImport.isIn.options = [config.validation.selects.incidentTypes];
  incidentTypesImport.isIn.errorMessage = `only '${config.validation.selects.incidentTypes.join("', '")}' are allowed.`;

  // Incident Transaction Types
  const incidentTransactionTypes = reportSchema.create["incident.transaction.types"];
  const incidentTransactionTypesImport = reportSchema.import["*.incident.transaction.types"];

  incidentTransactionTypes.isIn.options = [config.validation.selects.incidentTransactionTypes];
  incidentTransactionTypes.isIn.errorMessage = `only '${config.validation.selects.incidentTransactionTypes.join("', '")}' are allowed.`;

  incidentTransactionTypesImport.isIn.options = [config.validation.selects.incidentTransactionTypes];
  incidentTransactionTypesImport.isIn.errorMessage = `only '${config.validation.selects.incidentTransactionTypes.join("', '")}' are allowed.`;

  next();
});

export const updateFormDataConfig = async () => {
  const {
    storeNumbers,
    districtManagers,
    incidentTypes,
    incidentTransactionTypes,
    users,
  } = await FormData.all();

  const other = "Other";

  // If type includes "Other" push the element to the end of the array
  [incidentTypes, incidentTransactionTypes].forEach((elementArr) =>
    elementArr.includes(other)
      ? elementArr.push(elementArr.splice(elementArr.indexOf(other), 1)[0])
      : elementArr
  );

  storeNumbers.unshift("*");
  incidentTypes.unshift("*");
  incidentTransactionTypes.unshift("*");

  config.validation.selects.storeNumbers = storeNumbers;
  config.validation.selects.districtManagers = districtManagers;
  config.validation.selects.incidentTypes = incidentTypes;
  config.validation.selects.incidentTransactionTypes = incidentTransactionTypes;
  config.validation.selects.users = users;

  return config.validation;
};

export const synchonizeFormData = catchAsync(async (req, res, next) => {
  await updateFormDataConfig();

  res.status(200).json({
    status: "success",
    data: config.validation,
  });
});
