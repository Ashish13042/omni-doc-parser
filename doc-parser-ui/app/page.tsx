'use client';
import { useState } from 'react';

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // --- FILE HANDLING LOGIC ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (indexToRemove: number) => {
    setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  // --- DRAG AND DROP LOGIC ---
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  // --- API CALL LOGIC ---
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0 || !prompt) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("prompt", prompt);
    files.forEach((file) => formData.append("files", file));

    try {
      const response = await fetch("http://127.0.0.1:8000/analyze", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
      } else {
        alert("Error: " + data.detail);
      }
    } catch (error) {
      alert("Failed to connect to the Python API.");
    } finally {
      setLoading(false);
    }
  };

  // --- CSV EXPORT LOGIC ---
  const downloadCSV = () => {
    const tableData = result?.ai_data?.extracted_data;
    if (!tableData || tableData.length === 0) return;

    const headers = Object.keys(tableData[0]).join(",");
    const rows = tableData.map((row: any) =>
      Object.values(row)
        .map((val) => `"${String(val).replace(/"/g, '""')}"`) // Escape quotes
        .join(",")
    ).join("\n");

    const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "extracted_documents.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- TABLE HELPERS ---
  const tableData = result?.ai_data?.extracted_data || [];
  const tableHeaders = tableData.length > 0 ? Object.keys(tableData[0]) : [];

  return (
    <main className="min-h-screen p-10 bg-gray-50 text-gray-900 font-sans">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-md border border-gray-200">
        <h1 className="text-3xl font-bold mb-2 text-blue-600">Omni-Doc Data Extractor</h1>
        <p className="text-gray-500 mb-8 font-medium">Upload multiple documents and extract structured data instantly.</p>
        
        <form onSubmit={handleUpload} className="mb-8 flex flex-col gap-5">
          {/* DRAG AND DROP BOX */}
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-10 text-center transition cursor-pointer relative
              ${isDragging ? 'border-blue-500 bg-blue-100' : 'border-gray-300 bg-gray-50 hover:border-blue-400'}
            `}
          >
            <input 
              type="file" 
              accept=".pdf,.docx"
              multiple 
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              title="Click or drag files here"
            />
            <div className="pointer-events-none">
              <span className="text-4xl mb-3 block">📂</span>
              <p className="text-gray-600 font-bold text-lg">Drag & Drop multiple files here</p>
              <p className="text-gray-400 text-sm mt-1">or click to browse your computer</p>
            </div>
          </div>

          {/* VISUAL FILE LIST */}
          {files.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <p className="text-blue-800 font-bold mb-3">✅ {files.length} file(s) ready for extraction:</p>
              <div className="flex flex-wrap gap-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center bg-white px-3 py-1.5 rounded-full border border-blue-200 text-sm shadow-sm max-w-[200px]">
                    <span className="truncate flex-1 text-gray-700 font-medium mr-2">{file.name}</span>
                    <button 
                      type="button" 
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700 font-bold text-lg leading-none"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <textarea 
            placeholder="e.g., 'Extract the GST Number, Company Name, and Total Invoice Amount from these files.'"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none shadow-sm"
            required
          />
          <button 
            type="submit" 
            disabled={files.length === 0 || !prompt || loading}
            className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition shadow-md"
          >
            {loading ? "Extracting Data..." : "Run AI Extraction"}
          </button>
        </form>

        {/* RESULTS SECTION */}
        {result && result.ai_data && (
          <div className="mt-8 animate-in fade-in duration-500 border-t pt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Analysis Results</h2>
              
              {/* EXPORT TO CSV BUTTON */}
              {tableData.length > 0 && (
                <button 
                  onClick={downloadCSV}
                  className="bg-green-600 text-white font-bold py-2 px-4 rounded hover:bg-green-700 transition flex items-center gap-2 shadow-sm"
                >
                  <span>📥</span> Download Excel/CSV
                </button>
              )}
            </div>

            <p className="text-gray-700 mb-6 bg-blue-50 p-4 rounded-md border border-blue-100">
              {result.ai_data.message}
            </p>

            {/* SAFE DYNAMIC TABLE */}
            {tableData.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      {tableHeaders.map((header) => (
                        <th key={header} className="px-6 py-4 font-bold uppercase tracking-wider">
                          {header.replace(/_/g, ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tableData.map((row: any, index: number) => (
                      <tr key={index} className="hover:bg-gray-50 transition">
                        {tableHeaders.map((header) => (
                          <td key={header} className="px-6 py-4 text-gray-700 whitespace-nowrap">
                            {/* This is the React Object fix we added earlier! */}
                            {typeof row[header] === 'object' && row[header] !== null
                              ? JSON.stringify(row[header]).replace(/[{"}]/g, ' ').trim()
                              : String(row[header])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}