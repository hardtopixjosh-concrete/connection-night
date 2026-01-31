// Returns 'A' or 'B' depending on the week number
export const getLeaderId = () => {
  const currentWeekNumber = getWeekNumber(new Date());
  // Even weeks = User A leads. Odd weeks = User B leads.
  return currentWeekNumber % 2 === 0 ? "A" : "B";
};

function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getDay()||7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
}