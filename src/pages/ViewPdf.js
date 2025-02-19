import React, { useState } from "react";
import { Document, Page } from "react-pdf";

const ViewPDF = ({ fileUrl }) => {
  const [numPages, setNumPages] = useState(null);

  const onLoadSuccess = ({ numPages }) => setNumPages(numPages);

  return (
    <div>
      <Document
        file={fileUrl}
        onLoadSuccess={onLoadSuccess}
      >
        {Array.from(new Array(numPages), (el, index) => (
          <Page key={index} pageNumber={index + 1} />
        ))}
      </Document>
      <button onClick={() => window.print()}>Print</button>
    </div>
  );
};

export default ViewPDF;
