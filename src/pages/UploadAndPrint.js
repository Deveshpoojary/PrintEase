import React, { useState, useEffect, useRef } from "react";
import { Upload, FileText, Settings, Send, X, Check } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
// import supabase from "../supabase"; // Adjust the import path as necessary
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.entry";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(
  "pk_test_51RpUezGpLMJ2tSshsofGbkLrh9nHjZeyjwnpj8ao86PRzOzRiPEAK3PIFpsKzZgpUY0BJbT77g5vxB0f6OLQnOrw003O61CcJi"
); // Replace with your test publishable key

// import CheckoutButton from "../components/CheckoutButton";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

const UploadAndPrint = () => {
  const [files, setFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [totalPages, setTotalPages] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [priceCalculated, setPriceCalculated] = useState(false);

  const [printOptions, setPrintOptions] = useState({
    color: "color",
    sides: "single",
    copies: 1,
    pages: "all",
    specificPages: "",
    comments: "",
  });

  const [isSpecificPagesInputVisible, setSpecificPagesInputVisible] =
    useState(false);
  const [message, setMessage] = useState("");

  const handleFilesChange = async (selectedFiles) => {
    const fileArray = Array.from(selectedFiles);
    setIsUploading(true);

    let newPages = 0;
    const validFiles = [];

    for (const file of fileArray) {
      const type = file.type;
      const name = file.name.toLowerCase();

      if (type === "application/pdf") {
        // ✅ Count PDF pages
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        newPages += pdf.numPages;
        validFiles.push(file);
      } else if (type.startsWith("image/")) {
        /*name.endsWith(".docx") || name.endsWith(".pptx") || */
        // ✅ Accept DOCX, PPTX, images
        newPages += 1; // assume 1 page for now, actual count will be calculated in backend
        validFiles.push(file);
      } else {
        alert(`Unsupported file type: ${file.name}`);
        console.warn(`Skipping unsupported file: ${file.name}`);
      }
    }

    // Update files list
    const updatedFiles = [...files, ...validFiles];
    setFiles(updatedFiles);

    // Update total pages
    const updatedTotalPages = totalPages + newPages;
    setTotalPages(updatedTotalPages);

    // Fetch price
    const { color, sides, copies } = printOptions;
    const query = new URLSearchParams({
      color,
      sides,
      copies,
      pages: updatedTotalPages,
    });

    try {
      const res = await fetch(
        `http://localhost:5000/api/price-estimate?${query}`
      );
      const data = await res.json();
      if (res.ok) {
        setTotalPrice(data.totalPrice);
        setPriceCalculated(true);
      } else {
        console.error("Price fetch error:", data.error);
      }
    } catch (err) {
      console.error("Fetch failed:", err);
    }

    setIsUploading(false);
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
    function parsePageRange(rangeStr) {
      const pages = new Set();
      const parts = rangeStr.split(",");

      for (let part of parts) {
        part = part.trim();
        if (part.includes("-")) {
          const [start, end] = part.split("-").map(Number);
          if (!isNaN(start) && !isNaN(end) && start <= end) {
            for (let i = start; i <= end; i++) {
              pages.add(i);
            }
          }
        } else {
          const num = Number(part);
          if (!isNaN(num)) pages.add(num);
        }
      }

      return pages.size;
    }

    const { name, value } = e.target;

    const updatedOptions = {
      ...printOptions,
      [name]: value,
    };

    setPrintOptions(updatedOptions);

    if (
      name === "specificPages" &&
      updatedOptions.pages === "specific" &&
      files.length > 0
    ) {
      const parsedCount = parsePageRange(value.trim());
      if (parsedCount > 0) {
        setTotalPages(parsedCount);
        fetchPriceEstimate(parsedCount);
      }

      const parsedPages = value;
      const uniquePages = Array.from(new Set(parsedPages)).filter(
        (page) => page > 0
      );
      const outOfRangePages = uniquePages.filter((page) => page > totalPages);

      // ✅ Only show alert if out-of-range pages are fully entered
      if (outOfRangePages.length > 0) {
        return; // Don’t update anything until valid
      }

      // Update only when valid input
      if (uniquePages.length > 0) {
        setTotalPages(uniquePages.length);
        fetchPriceEstimate(uniquePages.length);
      }
    } else if (name === "pages" && value === "all" && files.length > 0) {
      // User switched back to 'all'
      fetchPriceEstimate(totalPages);
    }
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

  const fetchPriceEstimate = async (pages) => {
    const { color, sides, copies } = printOptions;

    try {
      const query = new URLSearchParams({
        color,
        sides,
        copies,
        pages,
      });

      const res = await fetch(
        `http://localhost:5000/api/price-estimate?${query.toString()}`
      );
      const data = await res.json();

      if (res.ok) {
        setTotalPrice(data.totalPrice);
      } else {
        console.error("Price fetch error:", data.error);
      }
    } catch (err) {
      console.error("Price fetch failed:", err);
    }
  };

  useEffect(() => {
    if (priceCalculated && totalPages > 0) {
      fetchPriceEstimate(totalPages);
    }
  }, [printOptions.color, printOptions.sides, printOptions.copies]);

  // const handleSubmit = async () => {
  //   if (!files.length) {
  //     setMessage("Please upload at least one file.");
  //     console.warn("No files selected.");
  //     return;
  //   }

  //   if (!user) {
  //     setMessage("You must be signed in to submit.");
  //     console.warn("User not signed in.");
  //     return;
  //   }

  //   setMessage("Uploading...");
  //   console.log("Starting file upload...");

  //   try {
  //     const formData = new FormData();

  //     files.forEach((file, index) => {
  //       console.log(`Appending file ${index + 1}: ${file.name}`);
  //       formData.append("files", file);
  //     });

  //     const email = user.primaryEmailAddress.emailAddress;
  //     console.log("User email:", email);
  //     formData.append("email", email);

  //     console.log("Print options:", printOptions);
  //     formData.append("printOptions", JSON.stringify(printOptions));

  //     const res = await fetch("http://localhost:5000/api/print-request", {
  //       method: "POST",
  //       body: formData,
  //     });

  //     if (!res.ok) {
  //       const { error } = await res.json();
  //       console.error("Server responded with error:", error);
  //       throw new Error(error || "Print request failed");
  //     }

  //     const result = await res.json();
  //     console.log("Server response:", result);
  //     setTotalPages(result.totalPages);
  //     setTotalPrice(result.totalPrice);
  //     setMessage(`Print request submitted successfully!`);
  //     setFiles([]);
  //     setTotalPages(0);
  //     setTotalPrice(0);
  //     setPriceCalculated(false);
  //   } catch (err) {
  //     console.error("Error during handleSubmit:", err);
  //     setMessage(`Error: ${err.message}`);
  //   } finally {
  //     console.log("Upload process completed.");
  //     setTimeout(() => setMessage(""), 5000);
  //   }
  // };

  const removeFile = (indexToRemove) => {
    setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleStripeCheckout = async () => {
    if (!files.length || !user) {
      setMessage("Please upload files and sign in before paying.");
      return;
    }

    setMessage("Creating payment session...");

    try {
      const formData = new FormData();

      files.forEach((file) => formData.append("files", file));
      formData.append("email", user.primaryEmailAddress.emailAddress);
      formData.append("name", user.fullName || user.username || "Unknown");
      formData.append("printOptions", JSON.stringify(printOptions));

      // Send request to backend to create Stripe session
      const res = await fetch(
        "http://localhost:5000/api/create-stripe-session",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      if (!res.ok)
        throw new Error(data.error || "Stripe session creation failed");

      const stripe = await loadStripe(
        "pk_test_51RpUezGpLMJ2tSshsofGbkLrh9nHjZeyjwnpj8ao86PRzOzRiPEAK3PIFpsKzZgpUY0BJbT77g5vxB0f6OLQnOrw003O61CcJi"
      );
      const result = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });

      if (result.error) {
        setMessage(`Payment error: ${result.error.message}`);
      }
    } catch (err) {
      console.error("Stripe Checkout error:", err);
      setMessage("Something went wrong during checkout.");
    }
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
          <h3 className="text-xl font-semibold text-gray-800">
            Document Upload
          </h3>
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
              <p className="text-gray-500">Supports PDF and Images.</p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={(e) =>
              e.target.files && handleFilesChange(e.target.files)
            }
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
                    <p className="text-gray-600 text-sm">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
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
          <h3 className="text-xl font-semibold text-gray-800">
            Print Settings
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="block text-gray-700 font-medium">
              Print Color
            </label>
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
            <label className="block text-gray-700 font-medium">
              Number of Copies
            </label>
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
            <label className="block text-gray-700 font-medium">
              Enter Specific Pages
            </label>
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
          <label className="block text-gray-700 font-medium">
            Additional Comments (Optional)
          </label>
          <textarea
            name="comments"
            value={printOptions.comments}
            onChange={handlePrintOptionsChange}
            rows={3}
            placeholder="Any special instructions..."
            className="w-full bg-white/60 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 resize-none"
          />
        </div>
        {/* {totalPages !== null && totalPrice !== null && (
  <p className="text-green-700 bg-green-100 border border-green-300 rounded-xl px-4 py-2 text-center font-medium mt-4">
    
    <span>Total pages:</span> {totalPages}, <span>Total price:</span> ₹{totalPrice}
  </p>
)} */}
        {totalPages > 0 && (
          <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-200 text-indigo-700 font-medium">
            Total Pages: {totalPages} | Estimated Price: ₹{totalPrice}
          </div>
        )}

        <div className="mt-8 flex flex-col items-center space-y-4">
          {/* <button
            onClick={handleSubmit}
            disabled={files.length === 0}
            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold rounded-2xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
          >
            <Send className="w-5 h-5" />
            Submit Print Request
          </button> */}
          {/* //<CheckoutButton/> */}
          
            <button
              onClick={handleStripeCheckout}
              className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-2xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
            >
              <Send className="w-5 h-5" />
              Proceed to Secure Payment (₹{totalPrice})
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
