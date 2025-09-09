import React, { useEffect, useState } from 'react';

const SUPABASE_PUBLIC_URL = import.meta.env.VITE_SUPABASE_PUBLIC_URL;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
console.log(BACKEND_URL);

const PrintRequests = () => {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    fetchPrintRequests();
  }, []);

  const fetchPrintRequests = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/print-requests`);
      const data = await res.json();
      setRequests(data);
    } catch (error) {
      console.error('Error fetching print requests:', error);
    }
  };

  const formatLocalDateTime = (value) =>
    new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/print-requests/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (res.ok) {
        console.log(`✅ Status updated to: ${status}`);
        fetchPrintRequests();
      } else {
        console.error('❌ Error updating status:', data.error);
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const parseFileUrls = (file_url) => {
    try {
      if (typeof file_url === 'string') {
        const parsed = JSON.parse(file_url);
        if (Array.isArray(parsed)) return parsed;
        return Object.values(parsed);
      } else if (Array.isArray(file_url)) {
        return file_url;
      } else {
        return [file_url];
      }
    } catch {
      return file_url?.split(',') || [];
    }
  };

  const isImage = (filename) =>
    /\.(jpe?g|png|gif|webp|bmp)$/i.test(filename.toLowerCase());

  const isPdf = (filename) => /\.pdf$/i.test(filename.toLowerCase());

  const getFullUrl = (url) => {
    return url.startsWith('http') ? url : SUPABASE_PUBLIC_URL + url.trim();
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
            <p className="text-sm text-gray-500">{formatLocalDateTime(req.created_at)}</p>
            <p className="font-semibold text-lg text-indigo-700">{req.email}</p>
            {req.name && (
              <p className="text-sm text-gray-700">
                Name: <span className="font-medium">{req.name}</span>
              </p>
            )}
            {req.status && (
              <p className="text-sm">
                Status:{' '}
                <span className="capitalize font-medium text-purple-700">
                  {req.status}
                </span>
              </p>
            )}
            {req.price !== undefined && (
              <p className="text-sm">
                Cost: <span className="font-medium text-green-700">₹{req.price}</span>
              </p>
            )}
            <p className="text-sm mt-2">
              Pages: {req.pages} | Copies: {req.copies}
            </p>
            <p className="text-sm">
              Color: <span className="capitalize">{req.color}</span>
            </p>
            <p className="text-sm">
              Sides: <span className="capitalize">{req.sides}</span>
            </p>
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

            <h2 className="text-2xl font-bold text-indigo-700 mb-4">
              Print Request Details
            </h2>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Email:</strong> {selectedRequest.email}
              </p>
              {selectedRequest.name && (
                <p>
                  <strong>Name:</strong> {selectedRequest.name}
                </p>
              )}
              {selectedRequest.status && (
                <p>
                  <strong>Status:</strong>{' '}
                  <span className="capitalize">{selectedRequest.status}</span>
                </p>
              )}
              {selectedRequest.price !== undefined && (
                <p>
                  <strong>Cost:</strong> ₹{selectedRequest.price}
                </p>
              )}
              <p>
                <strong>Pages:</strong> {selectedRequest.pages}
              </p>
              <p>
                <strong>Copies:</strong> {selectedRequest.copies}
              </p>
              <p>
                <strong>Color:</strong> {selectedRequest.color}
              </p>
              <p>
                <strong>Sides:</strong> {selectedRequest.sides}
              </p>
              {selectedRequest.specific_pages && (
                <p>
                  <strong>Specific Pages:</strong> {selectedRequest.specific_pages}
                </p>
              )}
              {selectedRequest.comments && (
                <p>
                  <strong>Comments:</strong> {selectedRequest.comments}
                </p>
              )}
              <p>
                <strong>Date:</strong> {formatLocalDateTime(selectedRequest.created_at)}
              </p>
            </div>

            <h3 className="mt-6 mb-2 text-lg font-semibold text-indigo-600">
              Files:
            </h3>
            <div className="space-y-6">
              {parseFileUrls(selectedRequest.file_url).map((file, index) => {
                const fullUrl = getFullUrl(file);
                const fileName = fullUrl.split('/').pop();
                return (
                  <div
                    key={index}
                    className="border rounded-xl overflow-hidden bg-gray-50"
                  >
                    <div className="bg-gray-100 px-4 py-2 font-medium text-sm text-gray-800">
                      {fileName}
                    </div>
                    {isImage(fullUrl) ? (
                      <img
                        src={fullUrl}
                        alt={`File ${index}`}
                        className="w-full max-h-[500px] object-contain"
                        onLoad={() => updateStatus(selectedRequest.id, 'viewed')}
                      />
                    ) : isPdf(fullUrl) ? (
                      <iframe
                        title={`file-preview-${index}`}
                        src={`https://docs.google.com/viewerng/viewer?url=${encodeURIComponent(
                          fullUrl
                        )}&embedded=true`}
                        className="w-full h-96"
                        frameBorder="0"
                        onLoad={() => updateStatus(selectedRequest.id, 'viewed')}
                      />
                    ) : (
                      <div className="p-4 text-sm text-red-500">
                        Unsupported file format
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => updateStatus(selectedRequest.id, 'printing')}
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600"
              >
                Mark as Printing
              </button>
              <button
                onClick={() => updateStatus(selectedRequest.id, 'completed')}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
              >
                Mark as Completed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrintRequests;
