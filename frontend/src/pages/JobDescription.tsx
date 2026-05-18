import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { FileText, Loader, Copy, Check } from "lucide-react";
import axiosInstance from "../api/axiosInstance";
import AppShell from "../components/AppShell";

export default function JobDescription() {
  const token = useMemo(() => localStorage.getItem("token"), []);

  const [formData, setFormData] = useState({
    jobTitle: "",
    department: "",
    experienceLevel: "mid",
    yearsOfExperience: "",
    skillsRequired: "",
    languagesRequired: "",
    toolsRequired: "",
    educationRequired: "",
    responsibilities: "",
    salary: "",
    benefits: "",
    workType: "onsite",
    location: "",
  });

  const [generatedDescription, setGeneratedDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  if (!token) {
    return <Navigate to="/signin" replace />;
  }

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerateDescription = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setGeneratedDescription("");
    setLoading(true);

    try {
      const res = await axiosInstance.post(
        "/job-description/generate",
        formData,
      );
      setGeneratedDescription(res.data?.description || "");
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Failed to generate job description",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopyDescription = () => {
    navigator.clipboard.writeText(generatedDescription);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="rounded-3xl bg-linear-to-br from-cyan-900 via-teal-900 to-slate-900 text-white p-7 md:p-10 shadow-xl">
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-200">
            Job Description Generator
          </p>
          <h1 className="text-3xl md:text-4xl font-bold mt-2">
            Generate Job Descriptions
          </h1>
          <p className="text-cyan-100 mt-3 text-sm">
            Use AI to create comprehensive job descriptions from basic job
            details
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form Section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <form onSubmit={handleGenerateDescription} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Senior React Developer"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Department
                    </label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      placeholder="e.g., Engineering"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Experience Level
                    </label>
                    <select
                      name="experienceLevel"
                      value={formData.experienceLevel}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                      <option value="entry">Entry Level</option>
                      <option value="mid">Mid Level</option>
                      <option value="senior">Senior Level</option>
                      <option value="lead">Lead Level</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      name="yearsOfExperience"
                      value={formData.yearsOfExperience}
                      onChange={handleInputChange}
                      placeholder="e.g., 5"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Work Type
                    </label>
                    <select
                      name="workType"
                      value={formData.workType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                      <option value="onsite">On-site</option>
                      <option value="remote">Remote</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g., San Francisco, CA"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Skills Required *
                  </label>
                  <textarea
                    name="skillsRequired"
                    value={formData.skillsRequired}
                    onChange={handleInputChange}
                    placeholder="e.g., React, TypeScript, Node.js"
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Languages Required
                  </label>
                  <textarea
                    name="languagesRequired"
                    value={formData.languagesRequired}
                    onChange={handleInputChange}
                    placeholder="e.g., English (Fluent), Spanish (Basic)"
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Tools/Technologies Required
                  </label>
                  <textarea
                    name="toolsRequired"
                    value={formData.toolsRequired}
                    onChange={handleInputChange}
                    placeholder="e.g., Git, Docker, AWS, Jest"
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Education Required
                  </label>
                  <textarea
                    name="educationRequired"
                    value={formData.educationRequired}
                    onChange={handleInputChange}
                    placeholder="e.g., Bachelor's degree in Computer Science"
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Responsibilities
                  </label>
                  <textarea
                    name="responsibilities"
                    value={formData.responsibilities}
                    onChange={handleInputChange}
                    placeholder="e.g., Build scalable web applications, Lead team meetings"
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Salary Range
                    </label>
                    <input
                      type="text"
                      name="salary"
                      value={formData.salary}
                      onChange={handleInputChange}
                      placeholder="e.g., $100k - $150k"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Benefits
                    </label>
                    <input
                      type="text"
                      name="benefits"
                      value={formData.benefits}
                      onChange={handleInputChange}
                      placeholder="e.g., Health insurance, 401k"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader size={18} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText size={18} />
                      Generate Description
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Output Section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Generated Description
              </h2>

              {generatedDescription ? (
                <div className="flex-1 flex flex-col">
                  <div className="flex-1 bg-slate-50 rounded-lg p-4 mb-4 overflow-y-auto max-h-96">
                    <p className="text-slate-700 whitespace-pre-wrap text-sm leading-relaxed">
                      {generatedDescription}
                    </p>
                  </div>
                  <button
                    onClick={handleCopyDescription}
                    className="py-2.5 px-4 bg-slate-100 text-slate-900 font-medium rounded-lg hover:bg-slate-200 transition flex items-center justify-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check size={18} />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={18} />
                        Copy Description
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-slate-500 text-center">
                    Fill in the job details and click "Generate Description" to
                    create a job posting.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
