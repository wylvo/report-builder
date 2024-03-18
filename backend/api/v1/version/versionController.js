import config from "../../../config/app.config.js";

export const getVersion = async (_, res) => {
  res.json({ version: config.version });
};
