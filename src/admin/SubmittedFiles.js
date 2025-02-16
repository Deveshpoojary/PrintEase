import React, { useEffect, useState } from "react";
// import axios from "axios";

const SubmittedFiles = () => {
  const [requests, setRequests] = useState([]);

  // useEffect(() => {
  //   axios.get("http://localhost:5000/submitted-requests")
  //     .then((response) => setRequests(response.data))
  //     .catch((error) => console.error("Error fetching requests", error));
  // }, []);

  return (
    <div className="bg-white shadow-md p-6 rounded-lg">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Submitted Print Requests</h2>
      {requests.length === 0 ? (
        <p className="text-gray-600">No requests submitted yet.</p>
      ) : (
        <ul>
          {requests.map((request) => (
            <li key={request._id} className="mb-3 border-b pb-2">
              <p><strong>Name:</strong> {request.name}</p>
              <p><strong>Email:</strong> {request.email}</p>
              <p><strong>Print Color:</strong> {request.color}</p>
              <p><strong>Sides:</strong> {request.sides}</p>
              <p><strong>Copies:</strong> {request.copies}</p>
              <p><strong>Pages:</strong> {request.pages}</p>
              <p><strong>Specific Pages:</strong> {request.specificPages || "None"}</p>
              <p><strong>Comments:</strong> {request.comments || "None"}</p>
              <p><strong>Submitted On:</strong> {new Date(request.submittedAt).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SubmittedFiles;
