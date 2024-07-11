import api from "./api.js";

export const state = {
  version: null,
  theme: localStorage.getItem("theme") || "light",

  // Current signed in user
  user: {},

  // All users
  users: [],
  usersTotal: 0,

  // All active users
  usersFrontend: [],

  // Current tab
  tab: 0,

  // Other available tabs
  tabs: new Map(),

  // Clipboard for copying data from forms in tabs (only)
  clipboard: new Map(),

  // All reports
  reports: [],
  reportsTotal: 0,

  // All deleted reports reports
  reportsDeleted: [],
  reportsDeletedTotal: 0,

  rowsPerPage: 50,
  search: {
    query: "",
    filterBy: "",
    results: [],
    page: 1,
  },

  formData: {
    selects: {
      statuses: [],
      storeNumbers: [],
      incidentTypes: [],
      pos: [],
      incidentTransactionTypes: [],
      users: [],
    },
  },
};

// Find report index or user index by ID
// prettier-ignore
export const findObjectIndexById = (array, targetObject, raiseErrorIfNotFound = true) => {
  const index = array.findIndex((object) =>
    String(object.id) === (typeof targetObject === "object" ? targetObject.id : targetObject)
  );
  if(index === -1 && raiseErrorIfNotFound)
    throw new TypeError(`Invalid target. Object index is undefined in provided array.`);
  return index;
}

// Find report or user by ID
export const findObjectById = (array, id, raiseErrorIfNotFound = true) => {
  const object = array.find((object) => object.id === Number(id));
  if (typeof object === "undefined" && raiseErrorIfNotFound)
    throw new TypeError(`Invalid id "${id}". Data object is undefined.`);
  return object;
};

// Load a tab with data (report or user) locally accessible
export const loadTabWith = function (array, tabIndex, id) {
  const tab = findTab(tabIndex);
  tab.data = findObjectById(array, id);
  return tab.data;
};

// Load a tab with data (report or user) directly coming from the DB.
// This can happen when a set of data is not loaded locally
export const loadTab = function (data, tabIndex) {
  const tab = findTab(tabIndex);
  tab.data = data;
  return tab.data;
};

// Clear data in current tab
export const clearTab = function (tabIndex) {
  const tab = findTab(tabIndex);
  tab.data = {};
  return tab.data;
};

// Find tab by the Map() object key
const findTab = (index) => state.tabs.get(index);

// Find tab index by ID
export const findTabIndexByObjectId = (id) => {
  let activeTabIndex = -1;
  state.tabs.forEach((tab, index) => {
    if (tab.data.id === id) activeTabIndex = index;
  });
  return activeTabIndex;
};

// Initialize single tab
const initTab = (tabIndex) =>
  state.tabs.set(tabIndex, {
    data: {},
  });

// prettier-ignore
export const filterSearch = (array, query, filterBy) => {
  state.search.results = [];
  state.search.query = query.toLowerCase();
  state.search.filterBy = filterBy;

  const keys = state.search.filterBy.split(".");
  if (!keys[0] && !keys[0] !== "") return;

  array.map((report) =>
    keys.reduce((acc, key) => {
      // Check if acc[key] exists and is an object
      if (acc && typeof acc[key] === "object") {
        // Continue traversing the object
        acc = acc[key];
      }

      // If the current value is the last key
      if (key === keys[keys.length - 1]) {
        
        // If last key is of type string
        if (typeof acc[key] === "string") {

          // And if string value includes query, push report into results array
          if (acc[key].toLowerCase().includes(state.search.query))
            return state.search.results.push(report);
        }

        // Else if last key is of type boolean
        if (typeof acc[key] === "boolean") {

          // And if value is true, allow "yes" into the query. Push report into results array
          if (acc[key] && state.search.query.includes("yes"))
            return state.search.results.push(report);

          // Or if value is false, allow "no" into the query. Push report into results array
          if (!acc[key] && state.search.query.includes("no"))
            return state.search.results.push(report);
        }

        // Else if last key is of type object, loop through key values typeof string
        if (typeof acc === "object") {
          for (const value of Object.values(acc)) {
            if (typeof value === "string") {

              // if string value includes query, push report into results array
              if (value.toLowerCase().includes(state.search.query)) {
                return state.search.results.push(report);
              }
            }
          }
        }
      }

      return acc;
    }, report)
  );

  // console.log(state.search.results);
};

// Set/Update rows per page
export const rowsPerPage = (array, page = state.search.page) => {
  // Example, page = 3, rowsPerPage = 25
  state.search.page = page;

  // const start = (3 - 1) * 25 = 50
  const start = (page - 1) * state.rowsPerPage;

  // const end = 3 * 25 = 75
  const end = page * state.rowsPerPage;

  // If there is a query, slice results, else slice all reports. (start = 50, end = 75)
  if (state.search.query === "") {
    if (!Array.isArray(array))
      return new TypeError(
        "Invalid array. Expects an array to slice the content into pages"
      );
    return array.slice(start, end);
  } else return state.search.results.slice(start, end);
};

// prettier-ignore
// Set/Update page numbers (previous page, current page, and next page)
export const pages = (total = state.reportsTotal, page) => {
  page = !page || page < 1 ? 1 : page;

  // Calculate the total number of pages available
  const totalPages = Math.ceil(total / state.rowsPerPage);

  // Start page always = 1 | End page awlays = total pages
  const start = page !== 1 ? 1 : null
  const end = page !== totalPages ? totalPages : null

  // Current page and next page can never be greater than the total of pages
  const currentPage = page > totalPages ? totalPages : page;
  const nextPage = currentPage + 1 > totalPages ? null : currentPage + 1;

  // Previous page can never be less than 1
  const previousPage = currentPage - 1 < 1 ? null : currentPage - 1;

  return {
    start,
    previous: previousPage,
    current: currentPage,
    next: nextPage,
    end
  };
};

// Initialize number of tabs
export const initNumberOfTabs = function (numberOfTabs = 5) {
  if (numberOfTabs < 1 || numberOfTabs > 5) numberOfTabs = 5;
  const tabs = new Array(numberOfTabs).fill("tab");
  tabs.forEach((_, tabIndex) => initTab(tabIndex));
  return tabs;
};

// Save theme to the local browser storage
export const saveThemeInLocalStorage = function () {
  localStorage.setItem("theme", `${state.theme}`);
};

// Switch theme to dark mode or light mode
export const switchTheme = function (theme = "light") {
  if (theme !== "light" && theme !== "dark")
    throw new Error(`Invalid theme, "${theme}" does not exist.`);
  if (theme === "dark") return (state.theme = "light");
  if (theme === "light") return (state.theme = "dark");
};

// Init theme from the local browser storage
export const initThemeInLocalStorage = function () {
  let theme = localStorage.getItem("theme");
  if (!theme) (theme = "light"), saveThemeInLocalStorage();
  state.theme = theme;
};
