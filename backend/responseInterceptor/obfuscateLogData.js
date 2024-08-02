const sensitiveKeysList = Object.values({
  passwordConfirmation: "passwordConfirmation",
  password: "password",
});

// Used to obfuscate senstitive information from logs, such as passwords
const obfuscateLogData = (data) => {
  if (typeof data === "object" && data !== null) {
    if (Array.isArray(data)) return data.map((item) => obfuscateLogData(item));

    const obfuscatedData = {};

    for (const key in data) {
      // replace password with *
      if (sensitiveKeysList.includes(key)) obfuscatedData[key] = "*****";
      // Recursively redact sensitive keys within nested objects
      else obfuscatedData[key] = obfuscateLogData(data[key]);
    }

    return obfuscatedData;
  } else {
    return data;
  }
};

export default obfuscateLogData;
