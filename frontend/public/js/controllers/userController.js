import * as model from "../model/model.js";
import api from "../model/api.js";
import userTabsView from "../views/users/userTabsView.js";
import userTableView from "../views/users/userTableView.js";
import paginationView from "../views/paginationView.js";

import notificationView from "../views/notifications/notificationView.js";
import modalView from "../views/notifications/modalView.js";

let userFormView,
  takeSnapshot = false;

const controlTabs = function (tabIndex, id = undefined) {
  model.state.tab = tabIndex;
  userFormView = userTabsView.tabs.get(model.state.tab);
  const userId = id ? id : model.state.tabs.get(tabIndex).user.id;
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
    if (currentUserView._changes.length > 0) return controlSaveReport(id);
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
    if (tab.user.id && tab.user.id === id) {
      const reportFormView = reportTabsView.tabs.get(index);
      if (!event) reportFormView._tab.firstElementChild.click();
      return true;
    }
  }
  if (event) {
    controlTabs(model.state.tab, id);
    controlRenderReport();
  }
  return false;
};

// // prettier-ignore
// const controlPaste = function () {
//   model.state.clipboard.forEach((clipboardInput, index) => {
//     const userInput = userFormView._inputs.get("*").get(index);

//     if (userInput.getAttribute("type") === "checkbox") {
//       if (userInput.checked && !clipboardInput.checked) userInput.click();
//       if (!userInput.checked && clipboardInput.checked) userInput.click();
//     }

//     if (userInput.getAttribute("type") !== "checkbox")
//       userInput.value = clipboardInput.value;
//   });
//   notificationView.success(`User state pasted into tab ${model.state.tab + 1}`, 5);
//   userFormView._form.onchange();
// };

// prettier-ignore
const controlCopy = function (inputs = undefined) {
  model.state.clipboard = inputs;
  if (model.state.clipboard.size > 0)
    userTabsView.tabs.forEach((userFormView) => userFormView._btnPaste.disabled = false);
  notificationView.info(`User state copied from tab ${model.state.tab + 1}`, 5);
};

const controlNewReport = function () {
  model.newReport(model.state.tab);
  userFormView.newReport((takeSnapshot = true));
  userTabsView.removeLocationHash();
};

const controlRenderReport = function () {
  try {
    const id = window.location.hash.slice(1);
    if (!id) return controlNewReport();

    const isPresentInTab = controlUniqueUserPerTab(id);
    if (isPresentInTab) return;

    const user = model.loadReport(model.state.tab, id);
    userFormView.render(user);
    console.log(model.state);
  } catch (error) {
    controlNewReport();
    notificationView.error(error.message, 60);
    console.error(error);
  }
};

// prettier-ignore
const controlSaveReport = async function (reportId) {
  const id = reportId ? reportId : window.location.hash.slice(1);
  let user;
  try {
    // Save user
    if (!id) {
      user = await model.DB.createUser(model.state.tab, userFormView._form);
      userTableView.render(user);
      userTableView.updateTotalCount(model.state.users);
      notificationView.success(`User successfully created: [${user.id}]`);
    }

    // Save changes
    if (id) {
      user = await model.DB.updateUser(id, userFormView._form);
      userTableView.update(user);
      notificationView.success(`User changes were saved: [${user.id}]`);
    }

    userFormView.takeSnapshot(userFormView.newClone());
    userFormView.updateTags(user);
    userFormView._btnTeams.disabled = false;
    userTabsView.render(model.state.tab, user.incident.title, user.id);
    model.loadReport(model.state.tab, user.id);
  } catch (error) {
    notificationView.error(error.message, 60);
    console.error(error);
  }
};

const controlRenderAllReports = function () {
  const users = model.rowsPerPage();
  userTableView.renderAll(users);
  paginationView.renderAll(model.pages());
};

const controlRowsPerPage = function (rowsPerPage) {
  model.state.rowsPerPage = rowsPerPage;
  model.state.search.page = 1;

  controlRenderAllReports();
};

const controlPages = function (page) {
  if (isNaN(page)) return;
  paginationView.renderAll(model.pages(page));

  const users = model.rowsPerPage(page);
  userTableView.renderAll(users);
};

const init = async function () {
  await model.init();

  // Initialize all tabs
  userTabsView.renderAll(model.initNumberOfTabs(5));
  userFormView = userTabsView.tabs.get(model.state.tab);

  // If id in hash render user
  if (window.location.hash.slice(1)) controlRenderReport();

  // Initialize all table rows per page
  model.state.rowsPerPage = paginationView.rowsPerPage();
  userTableView.renderAll(model.rowsPerPage());
  userTableView.updateTotalCount(model.state.users);

  // Initialize all pagination buttons
  paginationView.renderAll(model.pages());

  // Tab view handlers
  userTabsView.addHandlerClickTab(controlTabs);
  userTabsView.addHandlerKeydown(controlTabs);
  userTabsView.addHandlerBeforeUnload(controlBeforeUnload);

  // User view handler render. Applies to every user views (targeting Window object)
  userFormView.addHandlerRender(controlUnsavedUser, controlRenderReport);
  // ^^^ ERROR WHEN EDITING URL, OVERWRITING AN EXISTING REPORT ^^^

  // User view handlers per tabs
  userTabsView.tabs.forEach((userFormView) => {
    // userFormView.addHandlerPaste(controlPaste);
    userFormView.addHandlerCopy(controlCopy);
    userFormView.addHandlerNew(controlUnsavedUser, controlNewReport);
    userFormView.addHandlerSave(controlSaveReport);
  });

  // Table view handlers
  userTableView.addHandlerUniqueUserPerTab(
    controlUnsavedUser,
    controlUniqueUserPerTab
  );
  // userTableView.addHandlerDelete(controlDeleteReport);

  // Pagination view handlers
  paginationView.addHandlerOnChangeRowsPerPage(controlRowsPerPage);
  paginationView.addHandlerClickPage(controlPages);

  // const version = await api.v1.version.getVersion();
  // console.log("Version", version);
  // tabsView._appVersion.textContent = version;
  console.log(model.state);
};

init();
