import { FormData } from "./formDataModel.js";
import { config, catchAsync, mssql, GlobalError } from "../router.js";
import reportValidationSchema from "../reports/reportValidationSchema.js";

// prettier-ignore
export const synchonizeReportValidation = catchAsync(async (req, res, next) => {
  // Store Numbers
  const storeNumbers = reportValidationSchema.create["store.number"].isIn;
  storeNumbers.options = [config.formData.selects.storeNumbers];
  console.log(storeNumbers.options);
  storeNumbers.errorMessage =
    `only '${config.formData.selects.storeNumbers.join("', '")}' are allowed.`;

  // Incident Types
  const incidentTypes = reportValidationSchema.create["incident.type"].isIn;
  incidentTypes.options = [config.formData.selects.incidentTypes];
  incidentTypes.errorMessage = 
    `only '${config.formData.selects.incidentTypes.join("', '")}' are allowed.`;

  // Incident Transaction Types
  const incidentTransactionTypes =
    reportValidationSchema.create["incident.transaction.type"].isIn;
  incidentTransactionTypes.options = [config.formData.selects.incidentTransactionTypes];
  incidentTransactionTypes.errorMessage = 
    `only '${config.formData.selects.incidentTransactionTypes.join("', '")}' are allowed.`;

  next();
});

const getFormDataSelectionOptions = async (type = "all") => {
  const {
    recordset: [formData],
  } = await mssql().query(FormData.query.getSelectionOptions(type));

  return formData;
};

export const updateFormDataConfig = async () => {
  // prettier-ignore
  const { storeNumbers, districtManagers, incidentTypes, incidentTransactionTypes, } =
   await getFormDataSelectionOptions();
  config.formData.selects.storeNumbers = storeNumbers;
  config.formData.selects.districtManagers = districtManagers;
  config.formData.selects.incidentTypes = incidentTypes;
  config.formData.selects.incidentTransactionTypes = incidentTransactionTypes;

  return config.formData;
};

export const synchonizeFormData = catchAsync(async (req, res, next) => {
  const formData = await updateFormDataConfig();

  res.status(200).json({
    status: "success",
    data: formData,
  });
});
