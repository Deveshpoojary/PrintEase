import React, { useState } from "react";

const UploadAndPrint = () => {
  const [file, setFile] = useState(null);
  const [printOptions, setPrintOptions] = useState({
    color: "color",
    sides: "single",
    copies: 1,
    pages: "all", // Default to "all" for printing all pages
    specificPages: "", // Holds specific page ranges if entered
    comments: "",
  });

  const [isSpecificPagesInputVisible, setSpecificPagesInputVisible] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handlePrintOptionsChange = (e) => {
    setPrintOptions({ ...printOptions, [e.target.name]: e.target.value });
  };

  const handlePageSelection = (e) => {
    const value = e.target.value;
    if (value === "all") {
      setSpecificPagesInputVisible(false);
      setPrintOptions({ ...printOptions, pages: "all", specificPages: "" });
    } else {
      setSpecificPagesInputVisible(true);
      setPrintOptions({ ...printOptions, pages: "" }); // Clear "pages" when specific is selected
    }
  };

  const handleSpecificPagesChange = (e) => {
    setPrintOptions({ ...printOptions, specificPages: e.target.value });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Upload and Print</h2>
      <div className="bg-white p-6 rounded shadow-md mb-6">
        <div className="mb-4">
          <label className="block mb-2 font-bold">Upload File</label>
          <input
            type="file"
            onChange={handleFileChange}
            className="border p-2 w-full"
            multiple
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-2 font-bold">Print Color</label>
            <select
              name="color"
              value={printOptions.color}
              onChange={handlePrintOptionsChange}
              className="border p-2 w-full"
            >
              <option value="color">Color</option>
              <option value="black-and-white">Black & White</option>
            </select>
          </div>
          <div>
            <label className="block mb-2 font-bold">Sides</label>
            <select
              name="sides"
              value={printOptions.sides}
              onChange={handlePrintOptionsChange}
              className="border p-2 w-full"
            >
              <option value="single">Single-Sided</option>
              <option value="double">Double-Sided</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block mb-2 font-bold">Number of Copies</label>
            <input
              type="number"
              name="copies"
              value={printOptions.copies}
              onChange={handlePrintOptionsChange}
              className="border p-2 w-full"
              min="1"
            />
          </div>
          <div>
            <label className="block mb-2 font-bold">Pages</label>
            <select
              name="pages"
              value={isSpecificPagesInputVisible ? "specific" : "all"}
              onChange={handlePageSelection}
              className="border p-2 w-full"
            >
              <option value="all">All Pages</option>
              <option value="specific">Specific Pages</option>
            </select>
          </div>
        </div>
        {isSpecificPagesInputVisible && (
          <div className="mt-4">
            <label className="block mb-2 font-bold">Enter Specific Pages</label>
            <input
              type="text"
              name="specificPages"
              placeholder="e.g., 1-5, 7, 9-12"
              value={printOptions.specificPages}
              onChange={handleSpecificPagesChange}
              className="border p-2 w-full"
            />
          </div>
        )}
        <div className="mt-4">
          <label className="block mb-2 font-bold">Additional Comments (Optional)</label>
          <textarea
            name="comments"
            value={printOptions.comments}
            onChange={handlePrintOptionsChange}
            className="border p-2 w-full"
            rows="3"
            placeholder="Add any additional instructions or comments here."
          />
        </div>
        <button
          className="bg-green-600 text-white py-2 px-4 rounded mt-6 hover:bg-green-700"
          onClick={() => console.log(printOptions)}
        >
          Submit Print Request
        </button>
      </div>
    </div>
  );
};

export default UploadAndPrint;
