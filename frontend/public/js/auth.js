import { formatError } from "./api.js";

// JSON Fetch requests
const fetchJSON = async (url, jsonData = undefined) => {
  try {
    const response = jsonData
      ? await fetch(url, {
          mode: "cors",
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(jsonData),
        })
      : await fetch(url);

    if (!response.ok) return formatError(response);

    const data = await response.json();

    return { response, data };
  } catch (error) {
    throw error;
  }
};

export default {
  // Sign in into the api
  signIn: async function (email, password) {
    return await fetchJSON("/auth/signin", { email, password });
  },

  // Sign out of the api
  signOut: async function () {
    return await fetchJSON("/auth/signout", {});
  },
};
