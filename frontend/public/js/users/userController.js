import * as model from "./userModel.js";

import { isRequestInProgress } from "../api.js";

import { MultiselectDropdown } from "../multiselect-dropdown.js";
import userTabsView from "./views/userTabsView.js";
import userTableView from "./views/userTableView.js";

import paginationView from "../_views/paginationView.js";
import searchView from "../_views/searchView.js";
import notificationsView from "../_views/notificationsView.js";

import ModalFormView from "../_views/modalFormView.js";
import ModalView from "../_views/modalView.js";

const modalView = new ModalView();

let modalFormView = new ModalFormView(),
  userFormView,
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
  const formHasChanges = currentUserView._changes.length > 0;

  if (formHasChanges) {
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
    if (tab.data.id && tab.data.id === Number(id)) {
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

const controlTransferAll = async function (toUsername) {
  if (isRequestInProgress)
    return notificationsView.warning("A request is already in progress.");

  try {
    const tabIndex = model.state.tab;
    const fromUser = model.state.tabs.get(tabIndex).data;
    const fromUsername = fromUser.username;

    const [userFound, toUser] =
      await model.DB.transferAllReportRelationshipsToUser(
        fromUser,
        fromUsername,
        toUsername
      );

    if (fromUser.tableRowEl) userTableView.update(fromUser);
    if (userFound && toUser.tableRowEl) userTableView.update(toUser);

    notificationsView.success(
      `All report relationships of user: ${fromUsername} successfully transfered to user: ${toUsername}`
    );
    modalView.closeModal();
  } catch (error) {
    console.error(error);
    notificationsView.error(error.message, 60);
  }
};

// prettier-ignore
const controlCopy = function (inputs = undefined) {
  inputs.delete("password")
  inputs.delete("password-confirmation")

  model.state.clipboard = inputs;
  if (model.state.clipboard.size > 0)
    userTabsView.tabs.forEach((userFormView) => userFormView._btnPaste.disabled = false);
};

const controlUnhighlightUser = function (tabIndex) {
  const user = model.state.tabs.get(tabIndex).data;
  if (user.tableRowEl) userTableView.unhighlight(user.tableRowEl);
};

const controlNewUser = function () {
  controlUnhighlightUser(model.state.tab);

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

    const index = model.findObjectIndexById(model.state.users, id, false);
    const userFound = index !== -1;
    let user;

    if (!userFound) return userTabsView.removeLocationHash();

    if (userFound) {
      controlUnhighlightUser(model.state.tab);

      user = model.loadTab(model.state.users[index], model.state.tab);
      userFormView.render(user);

      userTableView.highlight(user.tableRowEl);
    }
  } catch (error) {
    console.error(error);
    controlNewUser();
    notificationsView.error(error.message, 60);
  }
};

const controlSearchResults = function () {
  model.state.search.page = 1;

  const users = model.state.users;

  const query = searchView.query();
  if (!query) return controlClearSearchResults(query);

  const filterBy = searchView.filterBy();
  model.filterSearch(users, query, filterBy);

  controlRenderAllUsers();
  userTableView.updateResultCount(model.state.search.results);
};

const controlClearSearchResults = function (query) {
  const isAlreadyEmptyQuery = model.state.search.query === "" || query !== "";
  if (isAlreadyEmptyQuery) return;

  // Clear the query
  model.state.search.query = "";
  model.state.search.results = [];
  searchView.clearQuery();
  userTableView.updateResultCount(0);

  return controlRenderAllUsers();
};

const controlRenderAllUsers = function () {
  const query = model.state.search.query;
  const users = query
    ? {
        array: model.state.search.results,
        total: model.state.search.results.length,
      }
    : {
        array: model.state.users,
        total: model.state.usersTotal,
      };

  const pageBtns = model.pages(users.total);

  paginationView.renderAll(pageBtns);
  userTableView.renderAll(users.array);
  query
    ? userTableView.updateResultCount(users.total)
    : userTableView.updateTotalCount(users.total);

  return users.array;
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

// prettier-ignore
const controlSaveUser = async function (userId) {
  if (isRequestInProgress) return notificationsView.warning("A request is already in progress.");

  const id = userId ? userId : window.location.hash.slice(1);
  let user, userFound = true;
  try {
    userFormView.renderSpinner(userFormView._btnSubmit);

    // Create user
    if (!id) {
      user = await model.DB.createUser(userFormView._form);
      userTableView.render(user);
      userTableView.highlight(user.tableRowEl);
      model.state.usersTotal++;
      userTableView.updateTotalCount(model.state.usersTotal);
    }

    // Update User
    if (id) {
      [userFound, user] = await model.DB.updateUser(id, userFormView._form);
      if (user.tableRowEl) userTableView.update(user);
    }

    notificationsView.success(`User successfully ${id ? "updated" : "created"}: [${user.id}]`);

    // Update form state
    userFormView.clearPasswordFields();
    userFormView.render(user);
    userFormView.takeSnapshot(userFormView.newClone());

    // Update tab state
    userTabsView.render(model.state.tab, user.fullName, user.id);
    if (!userFound) model.loadTab(user, model.state.tab);
    if (userFound) model.loadTabWith(model.state.users, model.state.tab, user.id);
    
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

/*
 ***********************************************************
 * INITIALIZE ALL HANDLERS, AND RENDER ALL EXISTING USERS  *
 ***********************************************************
 */
const init = async function () {
  try {
    await model.init();

    // Initialize list of users
    userTabsView.users = model.state.users;

    // Custom form data validation
    model.state.formData.selects.users = model.state.users.map((user) => {
      return { id: user.id, fullName: user.fullName, username: user.username };
    });

    // Initialize all tabs
    userTabsView.renderAll(
      model.state.formData.selects,
      model.initNumberOfTabs(5)
    );

    console.log(model.state.formData.selects);
    userFormView = userTabsView.tabs.get(model.state.tab);

    // Initialize all table rows per page
    model.state.rowsPerPage = paginationView.rowsPerPage();
    controlRenderAllUsers();

    // If id in hash render user
    if (window.location.hash.slice(1)) controlRenderUser();

    // Tab view handlers
    userTabsView.addHandlerClickTab(controlTabs);
    userTabsView.addHandlerKeydown(controlTabs);
    userTabsView.addHandlerBeforeUnload(controlBeforeUnload);

    // User view handler render. Applies to every user views (targeting Window object)
    userFormView.addHandlerRender(controlUnsavedUser, controlRenderUser);
    // ^^^ ERROR WHEN EDITING URL, OVERWRITING AN EXISTING USER ^^^

    // User view handlers per tabs
    userTabsView.tabs.forEach((userFormView) => {
      // Initialize list of users, current user, and set new report
      userFormView.users = userTabsView.users;

      modalFormView.addHandlerClickTransferAllReportRelationships(
        controlTransferAll,
        userFormView,
        model.state.formData.selects.users
      );

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

    // Search view handler
    searchView.addHandlerSearch(controlSearchResults);
    searchView.addHandlerClearSearch(controlClearSearchResults);

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
