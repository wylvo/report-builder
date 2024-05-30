export default {
  // Sleep/Wait and do nothing
  sleep: (seconds) =>
    new Promise((resolve) => setTimeout(resolve, seconds * 1000)),

  // prettier-ignore
  // https://stackoverflow.com/questions/722668/traverse-all-the-nodes-of-a-json-object-tree-with-javascript#answer-722732
  traverse(func, defaultObject, targetObject, currentObject = undefined) {
    for (const key in defaultObject) {
      func.apply(this, [defaultObject, targetObject, key, currentObject]);

      if (Object.hasOwn(defaultObject, key) && typeof defaultObject[key] === "object") {
        this.traverse(func, defaultObject[key], targetObject[key], key);
      }
    }
  },

  // Freeze objects recursively (freeze nested objects)
  deepFreeze(object) {
    object = Object.freeze(object);
    for (const key in object) {
      if (Object.hasOwn(object, key) && typeof object[key] === "object") {
        if (!Object.isFrozen(object[key])) this.deepFreeze(object[key]);
      }
    }
  },

  // // Generate UUID version 4
  // generateUUID: () => {
  //   return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
  //     const r = (Math.random() * 16) | 0,
  //       v = c == "x" ? r : (r & 0x3) | 0x8;
  //     return v.toString(16).toLowerCase();
  //   });
  // },

  // Format date to MM/DD/YYYY HH:mm AM or PM
  formatDate: (date) => {
    date = new Date(date);
    if (isNaN(date)) return undefined;

    let hours = date.getHours();
    let minutes = date.getMinutes();
    let amPM = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? "0" + minutes : minutes;

    // prettier-ignore
    return {
      iso: date.toISOString(),
      sharepoint: `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} ${hours}:${minutes} ${amPM}`,
    };
  },

  // prettier-ignore
  formatDateISO8601: (date) => {
    const tzo = -date.getTimezoneOffset();
    const dif = tzo >= 0 ? '+' : '-';
    const pad = (num) => (num < 10 ? '0' : '') + num;
  
    return date.getFullYear() +
    '-' + pad(date.getMonth() + 1) +
    '-' + pad(date.getDate()) +
    'T' + pad(date.getHours()) +
    ':' + pad(date.getMinutes()) +
    ':' + pad(date.getSeconds()) +
    dif + pad(Math.floor(Math.abs(tzo) / 60)) +
    ':' + pad(Math.abs(tzo) % 60);
  },
};
