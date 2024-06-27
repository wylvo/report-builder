import * as model from "./userModel.js";

import { isRequestInProgress } from "../api.js";

import userTabsView from "./views/userTabsView.js";
import userTableView from "./views/userTableView.js";

import paginationView from "../_views/paginationView.js";
import notificationsView from "../_views/notificationsView.js";

import ModalFormView from "../_views/modalFormView.js";
import ModalView from "../_views/modalView.js";

const modalView = new ModalView();

let userFormView,
  takeSnapshot = false;

const controlTabs = function (tabIndex, id = undefined) {
  model.state.tab = tabIndex;
  userFormView = userTabsView.tabs.get(model.state.tab);
  const userId = id ? id : model.state.tabs.get(tabIndex).data.id;
  userTabsView.updateLocationHash(userId);
};

const controlBeforeUnload = function () {
  let hasChanges;
  for (const [_, userFormView] of userTabsView.tabs) {
    if (userFormView._changes.length > 0) {
      hasChanges = true;
      break;
    }
  }
  return hasChanges;
};

// prettier-ignore
const controlUnsavedUser = async (controlFunction, handler = undefined, event = undefined) => {
  let isSaveConfirmed = false;
  const currentUserView = userTabsView.tabs.get(model.state.tab);

  if (currentUserView._changes.length > 0) {
    if (event) event.preventDefault();
    isSaveConfirmed = await modalView.confirmSave();
  }
  if (isSaveConfirmed) {
    const id = window.location.hash.slice(1);
    if (currentUserView._changes.length > 0) return controlSaveUser(id);
  }

  if (typeof handler === "function") {
    const returnedValue = handler();
    if (returnedValue !== null || typeof returnedValue !== "undefined")
      return controlFunction(returnedValue, event);
  }
  return controlFunction(handler, event);
};

// prettier-ignore
const controlUniqueUserPerTab = function (id, event = undefined) {
  for (const [index, tab] of model.state.tabs) {
    if (tab.data.id && tab.data.id === id) {
      const userFormView = userTabsView.tabs.get(index);
      if (!event) userFormView._tab.firstElementChild.click();
      return true;
    }
  }
  if (event) {
    controlTabs(model.state.tab, id);
    controlRenderUser();
  }
  return false;
};

// prettier-ignore
const controlPaste = function () {
  model.state.clipboard.forEach((clipboardInput, index) => {
    const userInput = userFormView._inputs.get("*").get(index);

    if (userInput.getAttribute("type") === "checkbox") {
      if (userInput.checked && !clipboardInput.checked) userInput.click();
      if (!userInput.checked && clipboardInput.checked) userInput.click();
    }

    if (userInput.getAttribute("type") !== "checkbox")
      userInput.value = clipboardInput.value;
  });
  notificationsView.success(`User state pasted into tab ${model.state.tab + 1}`, 5);
  userFormView._form.onchange();
};

// prettier-ignore
const controlCopy = function (inputs = undefined) {
  inputs.delete("password")
  inputs.delete("password-confirmation")

  model.state.clipboard = inputs;
  if (model.state.clipboard.size > 0)
    userTabsView.tabs.forEach((userFormView) => userFormView._btnPaste.disabled = false);
};

const controlNewUser = function () {
  model.clearTab(model.state.tab);
  userFormView.newUser((takeSnapshot = true));
  userTabsView.removeLocationHash();
};

const controlRenderUser = function () {
  try {
    const id = window.location.hash.slice(1);
    if (!id) return controlNewUser();

    const isPresentInTab = controlUniqueUserPerTab(id);
    if (isPresentInTab) return;

    const user = model.loadTabWith(model.state.users, model.state.tab, id);
    userFormView.render(user);
    console.log(model.state);
  } catch (error) {
    console.error(error);
    controlNewUser();
    notificationsView.error(error.message, 60);
  }
};

// prettier-ignore
const controlSaveUser = async function (userId) {
  if (isRequestInProgress) return notificationsView.warning("A request is already in progress.");

  const id = userId ? userId : window.location.hash.slice(1);
  let user;
  try {
    userFormView.renderSpinner(userFormView._btnSubmit);

    // Create user
    if (!id) {
      user = await model.DB.createUser(userFormView._form);
      userFormView.render(user);
      userTableView.render(user);
      model.state.usersTotal++;
      userTableView.updateTotalCount(model.state.usersTotal);
      notificationsView.success(`User successfully created: [${user.id}]`);
    }

    // Update User
    if (id) {
      user = await model.DB.updateUser(id, userFormView._form);
      userTableView.update(user);
      notificationsView.success(`User successfully updated: [${user.id}]`);
    }

    // Update form state
    userFormView.clearPasswordFields();
    userFormView.takeSnapshot(userFormView.newClone());
    userFormView.updateTags(user);
    userFormView._btnResetPassword.disabled = true;

    // Update tab state
    userTabsView.render(model.state.tab, user.fullName, user.id);
    model.loadTabWith(model.state.users, model.state.tab, user.id);
    
    userFormView.clearSpinner(userFormView._btnSubmit, "success", id ? "update" : "save");

  } catch (error) {
    console.error(error);
    notificationsView.error(error.message, 60);
    userFormView.clearSpinner(userFormView._btnSubmit, "error", id ? "update" : "save");
  }
};

// prettier-ignore
const controlResetUserPassword = async (userId) => {
  if (isRequestInProgress) return notificationsView.warning("A request is already in progress.");

  try {
    const id = userId ? userId : window.location.hash.slice(1);

    if (id) {
      userFormView.renderSpinner(userFormView._btnResetPassword);

      const user = await model.DB.resetUserPassword(id, userFormView._form);
      
      notificationsView.success(`User password successfully reset: ${user.email}`);
      userFormView.clearPasswordFields();
      userFormView._btnResetPassword.disabled = true;
      
      userFormView.clearSpinner(userFormView._btnResetPassword, "success", "password");
    }
  } catch (error) {
    console.error(error);
    notificationsView.error(error.message, 60);
    userFormView.clearSpinner(userFormView._btnResetPassword, "error", "password");
  }
};

// prettier-ignore
const controlDeleteUser = async function (id) {
  if (isRequestInProgress) return notificationsView.warning("A request is already in progress.");

  let userTableRowDeleteBtn;

  try {    
    const user = model.findObjectById(model.state.users, id);
    const hasIdInHash = id === window.location.hash.slice(1)
    userTableRowDeleteBtn = user.tableRowEl.querySelector(".delete");
  
    let isDeleteConfirmed = true;
    isDeleteConfirmed = await modalView.confirmDelete(user);
    if(!isDeleteConfirmed) return;

    // Remove id if in hash
    if (hasIdInHash) userTabsView.removeLocationHash();
  
    const tabIndex = model.findTabIndexByObjectId(id);
    const tabFound = tabIndex !== -1;
    if (tabFound) {
      model.clearTab(tabIndex)
      userTabsView.tabs.get(tabIndex).newUser((takeSnapshot = true))
    }

    userTableView.renderSpinner(userTableRowDeleteBtn);
  
    await model.DB.deleteUser(id);

    model.state.usersTotal--;
    userTableView.updateTotalCount(model.state.usersTotal);
    notificationsView.success(`User successfully deleted: ${user.email} [${user.id}]`);

  } catch (error) {
    console.error(error);
    notificationsView.error(error.message, 60);
    userTableView.clearSpinner(userTableRowDeleteBtn, null, "delete");
  }
};

// prettier-ignore
const controlUserStatus = async function (id) {
  if (isRequestInProgress) return notificationsView.warning("A request is already in progress.");

  let userTableRowStatusBtn;
  let user = model.findObjectById(model.state.users, id);
    
  try {
    userTableRowStatusBtn = user.tableRowEl.querySelector(".status");

    userTableView.renderSpinner(userTableRowStatusBtn);
    if (user.active) user = await model.DB.disableUser(id, user);
    else user = await model.DB.enableUser(id, user);

    const statusMsg = user.active ? "activated" : "inactivated"
    notificationsView.success(`User successfully ${statusMsg}: ${user.email} [${user.id}]`, 3);

    userTableView.update(user);
  } catch (error) {
    console.error(error);
    notificationsView.error(error.message, 60);
    userTableView.clearSpinner(userTableRowStatusBtn, null, user.active ? "inactive" : "active");
  }
};

const controlRenderAllUsers = function () {
  // const users = model.rowsPerPage(model.state.users);
  const pageBtns = model.pages(model.state.usersTotal);

  paginationView.renderAll(pageBtns);
  userTableView.renderAll(model.state.users);
  userTableView.updateTotalCount(model.state.usersTotal);

  return model.state.users;
};

const controlRowsPerPage = async function (rowsPerPage) {
  model.state.rowsPerPage = rowsPerPage;
  model.state.search.page = 1;

  try {
    userTableView.renderTableSpinner();

    await model.DB.getUsers();

    controlRenderAllUsers();
  } catch (error) {
    console.error(error);
    notificationsView.error(error.message);
  }
};

const controlPages = async function (page) {
  if (isNaN(page)) return;

  try {
    userTableView.renderTableSpinner();
    model.state.search.page = page;

    await model.DB.getUsers();

    controlRenderAllUsers();
  } catch (error) {
    console.error(error);
    notificationsView.error(error.message);
  }
};

export const init = async function () {
  try {
    await model.init();

    // Initialize all tabs
    userTabsView.renderAll(null, model.initNumberOfTabs(5));
    userFormView = userTabsView.tabs.get(model.state.tab);

    // If id in hash render user
    if (window.location.hash.slice(1)) controlRenderUser();

    // Initialize all table rows per page
    model.state.rowsPerPage = paginationView.rowsPerPage();
    controlRenderAllUsers();

    // Tab view handlers
    userTabsView.addHandlerClickTab(controlTabs);
    userTabsView.addHandlerKeydown(controlTabs);
    userTabsView.addHandlerBeforeUnload(controlBeforeUnload);

    // User view handler render. Applies to every user views (targeting Window object)
    userFormView.addHandlerRender(controlUnsavedUser, controlRenderUser);
    // ^^^ ERROR WHEN EDITING URL, OVERWRITING AN EXISTING USER ^^^

    // User view handlers per tabs
    userTabsView.tabs.forEach((userFormView) => {
      userFormView.addHandlerPaste(controlPaste);
      userFormView.addHandlerCopy(controlCopy);
      userFormView.addHandlerNew(controlUnsavedUser, controlNewUser);
      userFormView.addHandlerSave(controlSaveUser);
      userFormView.addHandlerResetPassword(controlResetUserPassword);
    });

    // Table view handlers
    userTableView.addHandlerUniqueUserPerTab(
      controlUnsavedUser,
      controlUniqueUserPerTab
    );
    userTableView.addHandlerStatus(controlUserStatus);
    userTableView.addHandlerDelete(controlDeleteUser);

    // Pagination view handlers
    paginationView.addHandlerOnChangeRowsPerPage(controlRowsPerPage);
    paginationView.addHandlerClickPage(controlPages);

    console.log(model.state);
  } catch (error) {
    console.error(error);
    notificationsView.error(error.message);
  }
};

init();
