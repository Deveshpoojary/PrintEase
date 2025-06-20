import React, { useEffect, useState } from 'react';

const SUPABASE_PUBLIC_URL = 'https://lyfjzflzrsjgycyovjkm.supabase.co/storage/v1/object/public/print-files/uploads/';

const PrintRequests = () => {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    const fetchPrintRequests = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/admin/print-requests');
        const data = await res.json();
        setRequests(data);
      } catch (error) {
        console.error('Error fetching print requests:', error);
      }
    };

    fetchPrintRequests();
  }, []);

  const openPrintView = (fileUrl) => {
    const fullUrl = SUPABASE_PUBLIC_URL + fileUrl;
    const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(fullUrl)}&embedded=true`;
    console.log(viewerUrl);

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print File</title>
          <style>
            body, html { margin: 0; height: 100%; }
            iframe { width: 100%; height: 100%; border: none; }
          </style>
        </head>
        <body onload="setTimeout(() => window.print(), 1000)">
          <iframe src="${viewerUrl}"></iframe>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">
        Print Requests
      </h1>

      <div className="grid gap-6 grid-cols-1">
        {requests.map((req) => (
          <div
            key={req.id}
            onClick={() => setSelectedRequest(req)}
            className="cursor-pointer bg-gradient-to-br from-white/80 to-purple-50 p-6 rounded-2xl shadow-xl border border-indigo-100 hover:scale-[1.01] transition-transform"
          >
            <p className="text-sm text-gray-500">{new Date(req.created_at).toLocaleString()}</p>
            <p className="font-semibold text-lg text-indigo-700">{req.email}</p>
            <p className="text-sm mt-2">Pages: {req.pages} | Copies: {req.copies}</p>
            <p className="text-sm">Color: <span className="capitalize">{req.color}</span></p>
            <p className="text-sm">Sides: <span className="capitalize">{req.sides}</span></p>
            <p className="text-xs mt-1 italic text-purple-500">Click to view more</p>
          </div>
        ))}
      </div>

      {selectedRequest && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-2xl p-6 rounded-2xl shadow-2xl relative overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => setSelectedRequest(null)}
              className="absolute top-3 right-3 bg-red-100 text-red-700 px-3 py-1 rounded-xl hover:bg-red-200"
            >
              Close
            </button>

            <h2 className="text-2xl font-bold text-indigo-700 mb-4">Print Request Details</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Email:</strong> {selectedRequest.email}</p>
              <p><strong>Pages:</strong> {selectedRequest.pages}</p>
              <p><strong>Copies:</strong> {selectedRequest.copies}</p>
              <p><strong>Color:</strong> {selectedRequest.color}</p>
              <p><strong>Sides:</strong> {selectedRequest.sides}</p>
              {selectedRequest.specific_pages && <p><strong>Specific Pages:</strong> {selectedRequest.specific_pages}</p>}
              {selectedRequest.comments && <p><strong>Comments:</strong> {selectedRequest.comments}</p>}
              <p><strong>Date:</strong> {new Date(selectedRequest.created_at).toLocaleString()}</p>
            </div>

            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2 text-indigo-600">File Preview:</h3>

              {selectedRequest.file_url && (
                <iframe
                  title="Google Docs Viewer"
                  src={`https://docs.google.com/gview?url=${encodeURIComponent(
                    SUPABASE_PUBLIC_URL + selectedRequest.file_url
                  )}&embedded=true`}
                  className="w-full h-80 rounded-xl border"
                ></iframe>
              )}

              <button
                onClick={() => openPrintView(selectedRequest.file_url)}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Print File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrintRequests;
