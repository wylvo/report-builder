import config from "../../../config/config.js";

export const getVersion = async (_, res) => {
  res.json({ version: config.version });
};
