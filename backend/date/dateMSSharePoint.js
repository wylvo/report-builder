export default (date) => {
  date = new Date(date);

  let hours = date.getHours();
  let minutes = date.getMinutes();
  let amPM = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? "0" + minutes : minutes;

  return `${
    date.getMonth() + 1
  }/${date.getDate()}/${date.getFullYear()} ${hours}:${minutes} ${amPM}`;
};
