import React, { useState } from "react";
import axios from "axios";

const UploadAndPrint = () => {
  const [file, setFile] = useState(null);
  const [printOptions, setPrintOptions] = useState({
    color: "color",
    sides: "single",
    copies: 1,
    pages: "all",
    specificPages: "",
    comments: "",
  });

  const [isSpecificPagesInputVisible, setSpecificPagesInputVisible] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileChange = (e) => setFile(e.target.files[0]);
  const handlePrintOptionsChange = (e) => setPrintOptions({ ...printOptions, [e.target.name]: e.target.value });
  const handlePageSelection = (e) => {
    const value = e.target.value;
    setSpecificPagesInputVisible(value === "specific");
    setPrintOptions({ ...printOptions, pages: value, specificPages: value === "all" ? "" : printOptions.specificPages });
  };
  const handleSpecificPagesChange = (e) => setPrintOptions({ ...printOptions, specificPages: e.target.value });

  const handleSubmit = async () => {
    if (!file) {
      alert("Please select a file to upload.");
      return;
    }
  
    const data = {
      fileName: file.name, // Storing only file name, not the file itself
      printOptions
    };
  
    try {
      const response = await axios.post("http://localhost:5000/submit-print-request", data);
      setMessage(response.data.message);
      setFile(null);
    } catch (error) {
      console.error("Error submitting print request", error);
      setMessage("Error submitting request");
    }
  };
  

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Upload and Print</h2>
      <div className="bg-white p-6 rounded shadow-md mb-6">
        <div className="mb-4">
          <label className="block mb-2 font-bold">Upload File</label>
          <input type="file" onChange={handleFileChange} className="border p-2 w-full" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-2 font-bold">Print Color</label>
            <select name="color" value={printOptions.color} onChange={handlePrintOptionsChange} className="border p-2 w-full">
              <option value="color">Color</option>
              <option value="black-and-white">Black & White</option>
            </select>
          </div>
          <div>
            <label className="block mb-2 font-bold">Sides</label>
            <select name="sides" value={printOptions.sides} onChange={handlePrintOptionsChange} className="border p-2 w-full">
              <option value="single">Single-Sided</option>
              <option value="double">Double-Sided</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block mb-2 font-bold">Number of Copies</label>
            <input type="number" name="copies" value={printOptions.copies} onChange={handlePrintOptionsChange} className="border p-2 w-full" min="1" />
          </div>
          <div>
            <label className="block mb-2 font-bold">Pages</label>
            <select name="pages" value={isSpecificPagesInputVisible ? "specific" : "all"} onChange={handlePageSelection} className="border p-2 w-full">
              <option value="all">All Pages</option>
              <option value="specific">Specific Pages</option>
            </select>
          </div>
        </div>
        {isSpecificPagesInputVisible && (
          <div className="mt-4">
            <label className="block mb-2 font-bold">Enter Specific Pages</label>
            <input type="text" name="specificPages" placeholder="e.g., 1-5, 7, 9-12" value={printOptions.specificPages} onChange={handleSpecificPagesChange} className="border p-2 w-full" />
          </div>
        )}
        <div className="mt-4">
          <label className="block mb-2 font-bold">Additional Comments (Optional)</label>
          <textarea name="comments" value={printOptions.comments} onChange={handlePrintOptionsChange} className="border p-2 w-full" rows="3" />
        </div>
        <button className="bg-green-600 text-white py-2 px-4 rounded mt-6 hover:bg-green-700" onClick={handleSubmit}>Submit Print Request</button>
        {message && <p className="text-green-600 mt-4">{message}</p>}
      </div>
    </div>
  );
};

export default UploadAndPrint;
