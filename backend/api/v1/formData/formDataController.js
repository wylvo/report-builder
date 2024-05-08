import { FormData } from "./formDataModel.js";
import { catchAsync, mssql } from "../router.js";

const updateFormData = () => {};

export const synchonizeFormData = catchAsync(async (req, res, next) => {});

export const getAllFormDropdownSelectionFields = catchAsync(
  async (req, res, next) => {
    const { recordset: FormDataDropdownSelectionFields } = await mssql().query(
      FormData.query.allDropdownSelectionFields
    );

    res.status(200).json({
      status: "success",
      data: FormDataDropdownSelectionFields,
    });
  }
);
