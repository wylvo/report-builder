import config from "../../../config/app.config.js";

export const getVersion = async (_, res) => {
  res.status(200).json({ version: config.version });
};
