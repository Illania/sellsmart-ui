import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export const exportReportPdf = async () => {
  const reportElement = document.getElementById("sellsmart-report");

  if (!reportElement) {
    alert("Report section not found.");
    return;
  }

  const canvas = await html2canvas(reportElement, {
    scale: 2,
    backgroundColor: "#050a14",
    useCORS: true,
  });

  const imageData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imageWidth = pageWidth;
  const imageHeight = (canvas.height * imageWidth) / canvas.width;

  let heightLeft = imageHeight;
  let position = 0;

  pdf.addImage(imageData, "PNG", 0, position, imageWidth, imageHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imageHeight;
    pdf.addPage();
    pdf.addImage(imageData, "PNG", 0, position, imageWidth, imageHeight);
    heightLeft -= pageHeight;
  }

  pdf.save("sellsmart-risk-report.pdf");
};
