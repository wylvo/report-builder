import View from "../../_views/View.js";
import TableView from "../../_views/tableView.js";

class DashboardView extends View {
  constructor() {
    super();

    this.insightReportsByWeek = document.querySelector(
      ".insights .reports-by-week"
    );
    this.insightReportsByMonth = document.querySelector(
      ".insights .reports-by-month"
    );
    this.insightReportsByYear = document.querySelector(
      ".insights .reports-by-year"
    );
    this.insightReportsCount = document.querySelector(
      ".insights .reports-count"
    );

    this.recentReportsTable = new TableView(
      document.querySelector(".reports tbody")
    );
    console.log(this.recentReportsTable);
    this.recentActivity = new TableView();
  }

  renderAll(stats) {
    console.log(stats);

    const date = new Date();

    const weekObject = stats.reportsByWeek.find(
      (obj) => obj.week == this.getWeekNumber(date)
    );
    const monthObject = stats.reportsByMonth.find(
      (obj) => obj.month == date.getMonth() + 1
    );
    const yearObject = stats.reportsByYear.find(
      (obj) => obj.year == date.getFullYear()
    );

    this.insightReportsByWeek.textContent = weekObject.reports;
    this.insightReportsByMonth.textContent = monthObject.reports;
    this.insightReportsByYear.textContent = yearObject.reports;
    this.insightReportsCount.textContent = stats.reportsCount;
  }

  insights() {}

  charts(type, element) {}

  tables() {}
}

export default new DashboardView();
