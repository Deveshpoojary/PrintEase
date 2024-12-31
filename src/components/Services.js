import React from "react";

const Services = () => {
  const services = [
    { name: "Document Printing", description: "Upload your files and get them printed quickly." },
    { name: "ID Card Laminations", description: "Professional lamination services." },
    { name: "Binding", description: "Spiral and perfect binding for your documents." },
  ];

  return (
    <section id="services" className="py-20 bg-gray-200">
      <div className="container mx-auto">
        <h3 className="text-2xl font-bold mb-6 text-center">Our Services</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <div key={index} className="bg-white p-6 shadow rounded">
              <h4 className="text-lg font-bold mb-2">{service.name}</h4>
              <p className="text-gray-600">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;