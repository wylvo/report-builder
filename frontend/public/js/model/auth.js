// JSON Fetch requests
const fetchJSON = async (url, method = undefined, jsonData = undefined) => {
  try {
    const response =
      method && jsonData
        ? await fetch(url, {
            method: method,
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify(jsonData),
          })
        : await fetch(url);

    const data = await response.json();

    if (!response.ok)
      throw new Error(
        `Request failed with status code ${response.status} (${response.statusText}).`
      );
    return { response, data };
  } catch (error) {
    throw error;
  }
};

export default {
  // Sign in into the api
  signIn: async function (email, password) {
    return await fetchJSON("/signin", { email, password });
  },

  // Sign out of the api
  signOut: async function () {
    return await fetchJSON("/signin", {});
  },
};
