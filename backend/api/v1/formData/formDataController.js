import { FormData } from "./formDataModel.js";
import { config, catchAsync, mssql, GlobalError } from "../router.js";

const updateFormData = (data) => {
  config.formData.dropdowns.storeNumbers = data.storeNumbers;
  config.formData.dropdowns.incidentTypes = data.incidentTypes;
  config.formData.dropdowns.incidentTransactionTypes =
    data.incidentTransactionTypes;
};

export const getAllFormDropdownSelectionFields = async () => {
  const {
    recordset: [FormDataDropdownSelectionFields],
  } = await mssql().query(FormData.query.allDropdownSelectionFields);
  return FormDataDropdownSelectionFields;
};

export const synchonizeFormData = catchAsync(async (req, res, next) => {
  const dropdowns = await getAllFormDropdownSelectionFields();

  updateFormData(dropdowns);

  res.locals.formData = config.formData;
  console.log(res.locals);

  res.status(200).json({
    status: "success",
    data: config.formData.dropdowns,
  });
});
