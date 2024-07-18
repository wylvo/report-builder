import {
  state,
  initNumberOfTabs,
  clearTab,
  loadTabWith,
  loadTab,
  pages,
  rowsPerPage,
  filterSearch,
  findObjectById,
  findObjectIndexById,
  findTabIndexByObjectId,
  initThemeInLocalStorage,
} from "../model.js";
import {
  DEFAULT_USER_CREATE,
  DEFAULT_USER_UPDATE,
  DEFAULT_PROFILE_PICTURE,
} from "../config.js";
import api from "../api.js";
import utils from "../utils.js";

import * as accountModel from "../account/accountModel.js";

// 1st function to be ran by ./userController.js
const init = async () => {
  await Promise.all([DB.getUsers(), accountModel.DB.getCurrentUserAccount()]);
  state.version = await api.v1.version.getVersion();
  initThemeInLocalStorage();
};

// API requests linked to the backend database
const DB = {
  getUsers: async () => {
    // API request to get all users from the database
    const {
      data: { data, total },
    } = await api.v1.users.getUsers(state.search.page, state.rowsPerPage);

    // Add all users in the model state
    state.users = data;
    state.usersTotal = total;

    state.users.forEach((user) => {
      if (!user.profilePictureURI)
        user.profilePictureURI = DEFAULT_PROFILE_PICTURE;
    });

    return data;
  },

  getUsersFrontend: async () => {
    // API request to get all users from the database with limited data
    const {
      data: { data },
    } = await api.v1.users.getUsersFrontend(
      state.search.page,
      state.rowsPerPage
    );

    // Add all users for the frontend in the model state
    state.usersFrontend = data;

    state.usersFrontend.forEach((user) => {
      if (!user.profilePictureURI)
        user.profilePictureURI = DEFAULT_PROFILE_PICTURE;
    });

    return data;
  },

  createUser: async (form) => {
    // Create a user object
    const userObject = createUserObject(form);

    // Check validity of the user object
    checkUserValidity(DEFAULT_USER_CREATE, userObject);

    if (!userObject.profilePictureURI) delete userObject.profilePictureURI;

    // API request to create a user in the database
    const {
      data: { data: user },
    } = await api.v1.users.createUser(userObject);

    console.log(user);

    // Add the user in the model state
    state.users.unshift(user);

    return user;
  },

  getUser: async (id) => {
    const {
      data: { data: user },
    } = await api.v1.users.getUser(id);

    return user;
  },

  updateUser: async (id, form) => {
    // Update a user object
    const [userFound, user] = await updateUserObject(id, form);
    const tableRowEl = user.tableRowEl;
    delete user.tableRowEl;

    if (!user.profilePictureURI) delete user.profilePictureURI;

    // API request to update a user from the database
    await api.v1.users.updateUser(id, user);

    user.tableRowEl = tableRowEl;

    return [userFound, user];
  },

  deleteUser: async (id) => {
    // API request to delete a user from the database
    const { response } = await api.v1.users.deleteUser(id);

    // Find & check if user is in the state object
    const index = findObjectIndexById(state.users, id, false);

    // If found, remove the row element and user object
    if (index !== -1) {
      state.users[index].tableRowEl.remove();
      state.users.splice(index, 1);
    }

    return response;
  },

  enableUser: async (id, userObject) => {
    // API request to enable a user from the database
    const {
      data: { data: user },
    } = await api.v1.users.enableUser(id);

    // Update the status in the user object
    userObject.active = user.active;

    return userObject;
  },

  disableUser: async (id, userObject) => {
    // API request to disable a user from the database
    const {
      data: { data: user },
    } = await api.v1.users.disableUser(id);

    // Update the status in the user object
    userObject.active = user.active;

    return userObject;
  },

  // prettier-ignore
  resetUserPassword: async (id, form) => {
    const password = form.password?.value.trim();
    const passwordConfirmation = form["password-confirmation"]?.value.trim();

    // API request to reset the password of an existing user from the database
    const {
      data: { data: user },
    } = await api.v1.users.resetUserPassword(id, password, passwordConfirmation);

    return user;
  },
};

// prettier-ignore
const createUserObject = function (form) {
  const username = form.email.value.trim().split("@")[0];
  let initials = null;

  if (username.includes(".")) {
    const firstName = username.split(".")[0];
    const lastName = username.split(".")[1];
    initials = `${firstName[0]}${lastName[0]}`.toUpperCase();
  }

  return {
    role: form.role?.value.trim(),
    active: form.status?.value.trim() === "1" ? true : false,
    email: form.email?.value.trim(),
    fullName: form["full-name"]?.value.trim(),
    username: form.username?.value.trim(),
    initials: form.initials?.value.trim(),
    password: form.password?.value.trim(),
    passwordConfirmation: form["password-confirmation"]?.value.trim(),
    profilePictureURI: form["profile-picture-uri"]?.value.trim(),
    tableRowEl: {},
  };
};

// Update existing user.
const updateUserObject = async (userObjectOrId, form) => {
  let user, tableRowEl;

  const index = findObjectIndexById(state.users, userObjectOrId, false);
  const userFound = index !== -1;

  if (userFound) {
    user = state.users[index];
    tableRowEl = user.tableRowEl;
    user.tableRowEl = {};
  }

  if (!userFound) user = await DB.getUser(userObjectOrId);

  delete user.createdAt;
  delete user.updatedAt;

  // Create a clone of the user object to update
  let clone = structuredClone(user);

  // Update the clone separately with new data from the form
  clone.role = form.role?.value.trim();
  clone.active = form.status?.value.trim() === "1" ? true : false;
  clone.email = form.email?.value.trim();
  clone.fullName = form["full-name"]?.value.trim();
  clone.username = form.username?.value.trim();
  clone.initials = form.initials?.value.trim();
  clone.profilePictureURI = form["profile-picture-uri"]?.value.trim();
  clone.tableRowEl = {};

  // Check validity of the clone. If not valid, an error will be thrown here.
  checkUserValidity(DEFAULT_USER_UPDATE, clone);

  // Update the user
  user.role = clone.role;
  user.active = clone.active;
  user.email = clone.email;
  user.fullName = clone.fullName;
  user.username = clone.username;
  user.initials = clone.initials;
  user.profilePictureURI = clone.profilePictureURI;
  user.tableRowEl = tableRowEl;

  return [userFound, user];
};

// Check validity of a user object by looking at data types
const checkUserValidity = (configObject, user) => {
  const missingKeys = [];
  const invalidTypes = [];

  // prettier-ignore
  const hasSameValueTypes = (defaultObject, targetObject, key, currentObject) => {
    const target = typeof currentObject === "undefined" ? "root" : currentObject;

    // If the target object does not exist, throw an error. (For nested objects)
    if (typeof targetObject === "undefined") throw new Error(`Failed to validate user. The "${target}" object was not found.`)

    // Key Names. Sort by alphabetical order to compare them
    const defaultKeys = Object.keys(defaultObject).sort();
    const userKeys = Object.keys(targetObject).sort();

    // If the given number keys inside the default object !== the number keys inside the target object (user)
    if (defaultKeys.length !== userKeys.length) {

      // Throw an error. In this case, it means that the 2 objects have different lengths.
      throw new Error(`Failed to validate a user object. The number of keys found inside the "${target}" object is invalid.`);
    }

    // Key Values
    const defaultKeyValue = defaultObject[key];
    const targetKeyValue = targetObject[key];

    // If the target (user) object key value does not exist
    if (typeof targetKeyValue === "undefined") {

      // Keep it in memory, and return nothing to stop the iteration.
      return missingKeys.push(key);
    }

    // If the default object key value types !== the target (user) object key value types
    if (typeof defaultKeyValue !== typeof targetKeyValue) {

      // if key "initials" & "profilePictureURI" is null stop the iteration by returning nothing. "initials" & "profilePictureURI" can === null.
      if(key === "initials" || "profilePictureURI") {
        if (targetKeyValue === null || typeof targetKeyValue === "string") return;

        // Else keep it in memory, and return nothing to stop the iteration.
        return invalidTypes.push({ key: key, type: typeof defaultKeyValue, target: target });
      }

      // Else keep it in memory, and return nothing to stop the iteration.
      return invalidTypes.push({ key: key, type: typeof defaultKeyValue, target: target });
    }
  };

  // Traverse default user object, and compare data types with user object passed in parameter
  utils.traverse(hasSameValueTypes, configObject, user);

  const hasMissingKeys = missingKeys.length > 0;
  const hasinvalidTypes = invalidTypes.length > 0;

  // prettier-ignore
  // Parse errors into a single string message
  if (hasMissingKeys || hasinvalidTypes) {
    throw new Error(
      `Failed to validate a user object${
        hasMissingKeys
          ? `. You have ${missingKeys.length} missing key(s) "${missingKeys.join(", ")}"`
          : ""
      }${
        hasinvalidTypes
          ? `. You have ${invalidTypes.length} invalid data type(s). ${invalidTypes.map((el) => 
            `"${el.key}" should be of type "${el.type}" inside the "${el.target}" object`).join(", ")}`
          : ""
      }.`
    );
  }

  const invalidInputLengths = [];

  if (user.initials.length > 2) invalidInputLengths.push("initials");
  if (user.username.length > 19) invalidInputLengths.push("username");

  const hasInvalidInputLength = invalidInputLengths.length > 0;
  // prettier-ignore
  if (hasInvalidInputLength) {
    throw new Error(`The following fields have invalid lengths: ${invalidInputLengths.join(", ")}.`);
  }
};

export {
  // from -> ../model.js
  state,
  initNumberOfTabs,
  clearTab,
  loadTabWith,
  loadTab,
  pages,
  rowsPerPage,
  filterSearch,
  findObjectById,
  findObjectIndexById,
  findTabIndexByObjectId,

  // from this local file -> ./userModel.js
  DB,
  createUserObject,
  updateUserObject,
  checkUserValidity,
  init,
};
