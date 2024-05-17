import { FormData } from "./formDataModel.js";
import { config, catchAsync, mssql, GlobalError } from "../router.js";
import reportValidationSchema from "../reports/reportValidationSchema.js";

// prettier-ignore
export const synchonizeReportValidation = catchAsync(async (req, res, next) => {
  // Store Numbers
  const storeNumbers = reportValidationSchema.create["store.number"];
  storeNumbers.isIn.options = [config.validation.selects.storeNumbers];
  storeNumbers.isIn.errorMessage =
    `only '${config.validation.selects.storeNumbers.join("', '")}' are allowed.`;

  // Incident Types
  const incidentTypes = reportValidationSchema.create["incident.type"];
  incidentTypes.isIn.options = [config.validation.selects.incidentTypes];
  incidentTypes.isIn.errorMessage = 
    `only '${config.validation.selects.incidentTypes.join("', '")}' are allowed.`;

  // Incident Transaction Types
  const incidentTransactionTypes =
    reportValidationSchema.create["incident.transaction.type"];
  incidentTransactionTypes.isIn.options = [config.validation.selects.incidentTransactionTypes];
  incidentTransactionTypes.isIn.errorMessage = 
    `only '${config.validation.selects.incidentTransactionTypes.join("', '")}' are allowed.`;

  next();
});

const getFormDataSelectionOptions = async (type = "all") => {
  const {
    recordset: [formData],
  } = await mssql().query(FormData.query.getSelectionOptions(type));

  return formData;
};

export const updateFormDataConfig = async () => {
  const {
    storeNumbers,
    districtManagers,
    incidentTypes,
    incidentTransactionTypes,
  } = await getFormDataSelectionOptions();

  const other = "Other";

  // If type includes "Other" push the element to the end of the array
  [incidentTypes, incidentTransactionTypes].forEach((elementArr) =>
    elementArr.includes(other)
      ? elementArr.push(elementArr.splice(elementArr.indexOf(other), 1)[0])
      : elementArr
  );

  config.validation.selects.storeNumbers = storeNumbers;
  config.validation.selects.districtManagers = districtManagers;
  config.validation.selects.incidentTypes = incidentTypes;
  config.validation.selects.incidentTransactionTypes = incidentTransactionTypes;

  return config.validation;
};

export const synchonizeFormData = catchAsync(async (req, res, next) => {
  await updateFormDataConfig();

  res.status(200).json({
    status: "success",
    data: config.validation,
  });
});
