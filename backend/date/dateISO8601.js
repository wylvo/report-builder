// https://stackoverflow.com/questions/17415579/how-to-iso-8601-format-a-date-with-timezone-offset-in-javascript#17415677
// prettier-ignore
export default (date) => {
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
};
