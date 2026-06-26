/**
 * Utility to export an array of object records to a downloadable CSV file.
 * @param {Array<Object>} data - The records to export.
 * @param {string} filename - The name of the downloaded file.
 * @param {Array<string>} headers - Header columns mapping.
 * @param {Array<string>} fields - Matching property fields from the data objects.
 */
export const exportToCSV = (data, filename, headers, fields) => {
  if (!data || !data.length) {
    alert("No data available to export.");
    return;
  }

  const csvRows = [];
  
  // Header row
  csvRows.push(headers.join(","));

  // Data rows
  for (const record of data) {
    const values = fields.map(field => {
      let val = record[field];
      if (val === undefined || val === null) {
        val = "";
      }
      
      // Handle array or object outputs
      if (typeof val === "object") {
        val = JSON.stringify(val);
      }
      
      // Escape commas, quotes, and newlines
      const escaped = String(val).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    
    csvRows.push(values.join(","));
  }

  // Generate blob file and download click trigger
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
