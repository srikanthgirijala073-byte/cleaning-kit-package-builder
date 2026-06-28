import { useState } from "react";
import LoadingSpinner from "../components/LoadingSpinner";
import { getSalesReport, getRevenueReport, getInventoryReport } from "../services/api";
import { FaFileAlt, FaChartBar, FaBoxes, FaDownload, FaInfoCircle, FaFilePdf } from "react-icons/fa";
import "./Reports.css";

const reportTypes = [
  { id: "sales", title: "Sales Report", icon: <FaFileAlt />, description: "View detailed sales data, order breakdowns, and total earnings." },
  { id: "revenue", title: "Revenue Report", icon: <FaChartBar />, description: "Monthly revenue analysis, trends, and order distribution." },
  { id: "inventory", title: "Inventory Report", icon: <FaBoxes />, description: "Current stock summary, low stock products, and top-selling items." },
];

function Reports() {
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [salesData, setSalesData] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [inventoryData, setInventoryData] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleGenerate = async (reportId) => {
    try {
      setLoading(true);
      setSelectedReport(reportId);
      if (reportId === "sales") {
        const response = await getSalesReport({ startDate, endDate });
        setSalesData(response.data);
      } else if (reportId === "revenue") {
        const response = await getRevenueReport();
        setRevenueData(response.data);
      } else if (reportId === "inventory") {
        const response = await getInventoryReport();
        setInventoryData(response.data);
      }
    } catch (error) {
      console.error(`Error generating ${reportId} report:`, error);
      alert("Failed to generate report: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const buildDataToConvert = (reportId) => {
    if (reportId === "sales" && salesData) {
      return salesData.report.map((r) => ({
        OrderID: `ORD${String(r.order_id).padStart(3, "0")}`,
        CustomerName: r.customer_name || "Guest",
        PackageName: r.package_name || "Custom",
        Amount: r.amount,
        Status: r.status,
        Date: new Date(r.created_at).toLocaleDateString("en-IN"),
        Items: r.items || "",
      }));
    }
    if (reportId === "revenue" && revenueData) {
      return revenueData.monthlyRevenue.map((r) => ({
        Month: r.month,
        Revenue: r.revenue,
        OrdersCount: r.orders_count,
      }));
    }
    if (reportId === "inventory" && inventoryData) {
      return inventoryData.lowStock.map((r) => ({
        ProductID: `PRD${String(r.product_id).padStart(3, "0")}`,
        ProductName: r.name,
        Category: r.category,
        Price: r.price,
        CurrentStock: r.current_stock,
        MinimumStock: r.minimum_stock,
        Status: r.status,
      }));
    }
    return [];
  };

  const handleDownloadCSV = (reportId) => {
    const dataToConvert = buildDataToConvert(reportId);
    if (dataToConvert.length === 0) {
      alert("No data available to download.");
      return;
    }
    const headers = Object.keys(dataToConvert[0]).join(",");
    const rows = dataToConvert.map((row) =>
      Object.values(row)
        .map((val) => `"${String(val).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${reportId}-report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPDF = async (reportId) => {
    const dataToConvert = buildDataToConvert(reportId);
    if (dataToConvert.length === 0) {
      alert("No data available to export. Please generate the report first.");
      return;
    }

    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF();
      const reportTitle =
        reportId === "sales"
          ? "Sales Report"
          : reportId === "revenue"
          ? "Revenue Report"
          : "Inventory Report";

      // Company name
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Ganga Maxx Marketplace", 14, 18);

      // Report title
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(reportTitle, 14, 26);

      // Date top right
      doc.setFontSize(10);
      doc.text(
        "Generated: " + new Date().toLocaleDateString("en-IN"),
        doc.internal.pageSize.width - 14,
        18,
        { align: "right" }
      );

      // Table
      const columns = Object.keys(dataToConvert[0]);
      const rows = dataToConvert.map((r) => Object.values(r).map(String));

      autoTable(doc, {
        head: [columns],
        body: rows,
        startY: 32,
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: {
          fillColor: [37, 99, 235],
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: { fillColor: [243, 244, 246] },
        margin: { left: 14, right: 14 },
      });

      doc.save(`${reportId}-report.pdf`);
    } catch (err) {
      console.error("PDF export error:", err);
      alert(
        "PDF export failed. Make sure jspdf and jspdf-autotable are installed.\nRun: npm install jspdf jspdf-autotable"
      );
    }
  };

  const hasData = (reportId) => {
    if (reportId === "sales") return !!salesData;
    if (reportId === "revenue") return !!revenueData;
    if (reportId === "inventory") return !!inventoryData;
    return false;
  };

  return (
    <div className="reports-page">
      <div className="reports-header">
        <h1>Reports & Analytics</h1>
        <p>Generate, view, and export business reports.</p>
      </div>

      {/* Date filter for Sales Report */}
      <div
        className="reports-controls card glass"
        style={{
          display: "flex",
          gap: "15px",
          padding: "15px",
          marginBottom: "20px",
          alignItems: "center",
        }}
      >
        <div className="form-group" style={{ margin: 0 }}>
          <label>Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ padding: "8px", borderRadius: "4px", border: "1px solid #d1d5db" }}
          />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label>End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ padding: "8px", borderRadius: "4px", border: "1px solid #d1d5db" }}
          />
        </div>
        <div style={{ flex: 1 }}></div>
        <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>
          <FaInfoCircle /> Date filters apply only to the Sales Report.
        </p>
      </div>

      <div className="reports-grid">
        {reportTypes.map((report) => (
          <div
            key={report.id}
            className={`report-card card glass ${
              selectedReport === report.id ? "active" : ""
            }`}
            style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <div className="report-icon" style={{ fontSize: "32px", color: "#2563eb" }}>
              {report.icon}
            </div>
            <h3>{report.title}</h3>
            <p style={{ fontSize: "14px", color: "#4b5563", flex: 1 }}>
              {report.description}
            </p>
            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button
                className="btn-primary"
                onClick={() => handleGenerate(report.id)}
                style={{ flex: 1 }}
              >
                Generate
              </button>
              {hasData(report.id) && (
                <>
                  <button
                    className="btn-secondary"
                    onClick={() => handleDownloadCSV(report.id)}
                    title="Download CSV"
                  >
                    <FaDownload />
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => handleDownloadPDF(report.id)}
                    title="Download PDF"
                    style={{ color: "#dc2626" }}
                  >
                    <FaFilePdf />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="report-results-section" style={{ marginTop: "30px" }}>
          {selectedReport === "sales" && salesData && (
            <div className="card glass" style={{ padding: "25px" }}>
              <h2>Sales Report Results</h2>
              <div style={{ display: "flex", gap: "20px", margin: "15px 0" }}>
                <p>
                  <strong>Total Orders:</strong> {salesData.totalOrders}
                </p>
                <p>
                  <strong>Total Sales Revenue:</strong> ₹{salesData.totalSales}
                </p>
              </div>
              <div className="table-wrapper" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
                  <thead>
                    <tr style={{ background: "#f3f4f6", borderBottom: "2px solid #e5e7eb" }}>
                      <th style={{ padding: "10px", textAlign: "left" }}>Order ID</th>
                      <th style={{ padding: "10px", textAlign: "left" }}>Customer</th>
                      <th style={{ padding: "10px", textAlign: "left" }}>Package Name</th>
                      <th style={{ padding: "10px", textAlign: "left" }}>Amount</th>
                      <th style={{ padding: "10px", textAlign: "left" }}>Status</th>
                      <th style={{ padding: "10px", textAlign: "left" }}>Items</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesData.report.map((r, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #e5e7eb" }}>
                        <td style={{ padding: "10px" }}>
                          ORD{String(r.order_id).padStart(3, "0")}
                        </td>
                        <td style={{ padding: "10px" }}>{r.customer_name || "Guest"}</td>
                        <td style={{ padding: "10px" }}>{r.package_name || "Custom"}</td>
                        <td style={{ padding: "10px" }}>₹{r.amount}</td>
                        <td style={{ padding: "10px" }}>{r.status}</td>
                        <td style={{ padding: "10px", fontSize: "13px", color: "#4b5563" }}>
                          {r.items || "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {selectedReport === "revenue" && revenueData && (
            <div className="card glass" style={{ padding: "25px" }}>
              <h2>Revenue Report Results</h2>
              <div className="table-wrapper" style={{ overflowX: "auto", marginTop: "15px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f3f4f6", borderBottom: "2px solid #e5e7eb" }}>
                      <th style={{ padding: "10px", textAlign: "left" }}>Month</th>
                      <th style={{ padding: "10px", textAlign: "left" }}>Revenue</th>
                      <th style={{ padding: "10px", textAlign: "left" }}>Orders Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenueData.monthlyRevenue.map((r, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #e5e7eb" }}>
                        <td style={{ padding: "10px" }}>{r.month}</td>
                        <td style={{ padding: "10px" }}>₹{r.revenue}</td>
                        <td style={{ padding: "10px" }}>{r.orders_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {selectedReport === "inventory" && inventoryData && (
            <div className="card glass" style={{ padding: "25px", display: "flex", flexDirection: "column", gap: "20px" }}>
              <h2>Inventory Report Results</h2>
              <div>
                <h3>Stock Levels Summary</h3>
                <div style={{ display: "flex", gap: "20px", marginTop: "10px", flexWrap: "wrap" }}>
                  <p>
                    <strong>Total Product Types:</strong>{" "}
                    {inventoryData.summary.total_products}
                  </p>
                  <p>
                    <strong>Total Stock Quantity:</strong>{" "}
                    {inventoryData.summary.total_stock || 0}
                  </p>
                  <p style={{ color: "#10b981" }}>
                    <strong>In Stock Types:</strong> {inventoryData.summary.in_stock}
                  </p>
                  <p style={{ color: "#f59e0b" }}>
                    <strong>Low Stock Types:</strong> {inventoryData.summary.low_stock}
                  </p>
                  <p style={{ color: "#ef4444" }}>
                    <strong>Out of Stock Types:</strong>{" "}
                    {inventoryData.summary.out_of_stock}
                  </p>
                </div>
              </div>
              <div>
                <h3>Low Stock Warning List</h3>
                <div className="table-wrapper" style={{ overflowX: "auto", marginTop: "10px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f3f4f6", borderBottom: "2px solid #e5e7eb" }}>
                        <th style={{ padding: "10px", textAlign: "left" }}>Product Name</th>
                        <th style={{ padding: "10px", textAlign: "left" }}>Category</th>
                        <th style={{ padding: "10px", textAlign: "left" }}>Current Stock</th>
                        <th style={{ padding: "10px", textAlign: "left" }}>
                          Min Stock Threshold
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryData.lowStock.map((r, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid #e5e7eb" }}>
                          <td style={{ padding: "10px" }}>{r.name}</td>
                          <td style={{ padding: "10px" }}>{r.category}</td>
                          <td
                            style={{
                              padding: "10px",
                              color: r.current_stock === 0 ? "red" : "orange",
                              fontWeight: "bold",
                            }}
                          >
                            {r.current_stock}
                          </td>
                          <td style={{ padding: "10px" }}>{r.minimum_stock}</td>
                        </tr>
                      ))}
                      {inventoryData.lowStock.length === 0 && (
                        <tr>
                          <td
                            colSpan="4"
                            style={{ padding: "15px", textAlign: "center", color: "#10b981" }}
                          >
                            All products are healthy. No low stock items!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Reports;
