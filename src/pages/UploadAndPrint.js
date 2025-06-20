import React, { useState, useRef } from "react";
import { Upload, FileText, Settings, Send, X, Check } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
// import supabase from "../supabase"; // Adjust the import path as necessary

const UploadAndPrint = () => {
  const [files, setFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [totalPages, setTotalPages] = useState(null);
const [totalPrice, setTotalPrice] = useState(null);


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

  const handleFilesChange = (selectedFiles) => {
    const fileArray = Array.from(selectedFiles);
    setIsUploading(true);
    setTimeout(() => {
      setFiles((prev) => [...prev, ...fileArray]);
      setIsUploading(false);
    }, 1000);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length) {
      handleFilesChange(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handlePrintOptionsChange = (e) => {
    setPrintOptions({ ...printOptions, [e.target.name]: e.target.value });
  };

  const handlePageSelection = (e) => {
    const value = e.target.value;
    setSpecificPagesInputVisible(value === "specific");
    setPrintOptions({
      ...printOptions,
      pages: value,
      specificPages: value === "all" ? "" : printOptions.specificPages,
    });
  };

  const { user } = useUser();

const handleSubmit = async () => {
  if (!files.length) {
    setMessage("Please upload at least one file.");
    console.warn("No files selected.");
    return;
  }

  if (!user) {
    setMessage("You must be signed in to submit.");
    console.warn("User not signed in.");
    return;
  }

  setMessage("Uploading...");
  console.log("Starting file upload...");

  try {
    const formData = new FormData();

    files.forEach((file, index) => {
      console.log(`Appending file ${index + 1}: ${file.name}`);
      formData.append("files", file);
    });

    const email = user.primaryEmailAddress.emailAddress;
    console.log("User email:", email);
    formData.append("email", email);

    console.log("Print options:", printOptions);
    formData.append("printOptions", JSON.stringify(printOptions));

    const res = await fetch("http://localhost:5000/api/print-request", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const { error } = await res.json();
      console.error("Server responded with error:", error);
      throw new Error(error || "Print request failed");
    }

    const result = await res.json();
console.log("Server response:", result);
setTotalPages(result.totalPages);
setTotalPrice(result.totalPrice);
setMessage(
  `Print request submitted successfully! Total pages: ${result.totalPages}, Total price: ₹${result.totalPrice}`
);
setFiles([]);
  } catch (err) {
    console.error("Error during handleSubmit:", err);
    setMessage(`Error: ${err.message}`);
  } finally {
    console.log("Upload process completed.");
    setTimeout(() => setMessage(""), 5000);
  }
};

  const removeFile = (indexToRemove) => {
    setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Upload & Print
        </h2>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Upload your documents and customize your printing preferences
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 border border-white/40 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl shadow-lg">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800">Document Upload</h3>
        </div>

        <div
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer ${
            isDragOver
              ? "border-indigo-400 bg-indigo-50"
              : "border-gray-300 hover:border-indigo-400 hover:bg-gray-50"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Upload className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-xl font-medium text-gray-800 mb-2">
                Drop files here or click to browse
              </p>
              <p className="text-gray-500">Supports PDF, DOCX, PPTX and more</p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={(e) => e.target.files && handleFilesChange(e.target.files)}
            className="hidden"
          />
        </div>

        {/* Uploaded Files List */}
        {files.length > 0 && (
          <div className="mt-6 space-y-4">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex justify-between items-center bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl shadow">
                    {isUploading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Check className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="text-gray-800 font-medium">{file.name}</p>
                    <p className="text-gray-600 text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="p-2 hover:bg-red-100 rounded-lg transition"
                >
                  <X className="w-5 h-5 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Print Settings */}
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 border border-white/40 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800">Print Settings</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="block text-gray-700 font-medium">Print Color</label>
            <select
              name="color"
              value={printOptions.color}
              onChange={handlePrintOptionsChange}
              className="w-full bg-white/60 border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
            >
              <option value="color">Color</option>
              <option value="black-and-white">Black & White</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="block text-gray-700 font-medium">Sides</label>
            <select
              name="sides"
              value={printOptions.sides}
              onChange={handlePrintOptionsChange}
              className="w-full bg-white/60 border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
            >
              <option value="single">Single-Sided</option>
              <option value="double">Double-Sided</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="block text-gray-700 font-medium">Number of Copies</label>
            <input
              type="number"
              name="copies"
              value={printOptions.copies}
              onChange={handlePrintOptionsChange}
              min="1"
              className="w-full bg-white/60 border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-gray-700 font-medium">Pages</label>
            <select
              name="pages"
              value={isSpecificPagesInputVisible ? "specific" : "all"}
              onChange={handlePageSelection}
              className="w-full bg-white/60 border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
            >
              <option value="all">All Pages</option>
              <option value="specific">Specific Pages</option>
            </select>
          </div>
        </div>

        {isSpecificPagesInputVisible && (
          <div className="mt-6 space-y-3">
            <label className="block text-gray-700 font-medium">Enter Specific Pages</label>
            <input
              type="text"
              name="specificPages"
              placeholder="e.g., 1-5, 7, 9-12"
              value={printOptions.specificPages}
              onChange={handlePrintOptionsChange}
              className="w-full bg-white/60 border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
            />
          </div>
        )}

        <div className="mt-6 space-y-3">
          <label className="block text-gray-700 font-medium">Additional Comments (Optional)</label>
          <textarea
            name="comments"
            value={printOptions.comments}
            onChange={handlePrintOptionsChange}
            rows={3}
            placeholder="Any special instructions..."
            className="w-full bg-white/60 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 resize-none"
          />
        </div>
        {totalPages !== null && totalPrice !== null && (
  <p className="text-green-700 bg-green-100 border border-green-300 rounded-xl px-4 py-2 text-center font-medium mt-4">
    
    <span>Total pages:</span> {totalPages}, <span>Total price:</span> ₹{totalPrice}
  </p>
)}

        <div className="mt-8 flex flex-col items-center space-y-4">
          <button
            onClick={handleSubmit}
            disabled={files.length === 0}
            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold rounded-2xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
          >
            <Send className="w-5 h-5" />
            Submit Print Request
          </button>

          {message && (
            <div
              className={`px-6 py-3 rounded-xl font-medium ${
                message.includes("successfully")
                  ? "bg-green-100 text-green-700 border border-green-200"
                  : "bg-red-100 text-red-700 border border-red-200"
              }`}
            >
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadAndPrint;
