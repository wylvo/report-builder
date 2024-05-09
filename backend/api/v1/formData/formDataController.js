import { FormData } from "./formDataModel.js";
import { config, catchAsync, mssql, GlobalError } from "../router.js";

export const synchonizeFormData = catchAsync(async (req, res, next) => {
  await getAllFormDropdownSelectionFields(res);
  next();
});

const getAllFormDropdownSelectionFields = async (res) => {
  const {
    recordset: [FormDataDropdownSelectionFields],
  } = await mssql().query(FormData.query.allDropdownSelectionFields);

  // Update local config
  config.formData.selects.storeNumbers =
    FormDataDropdownSelectionFields.storeNumbers;
  config.formData.selects.incidentTypes =
    FormDataDropdownSelectionFields.incidentTypes;
  config.formData.selects.incidentTransactionTypes =
    FormDataDropdownSelectionFields.incidentTransactionTypes;

  res.locals.formData = config.formData;
  return FormDataDropdownSelectionFields;
};

export const getFormData = catchAsync(async (req, res, next) => {
  await getAllFormDropdownSelectionFields(res);

  res.status(200).json({
    status: "success",
    data: config.formData,
  });
});
