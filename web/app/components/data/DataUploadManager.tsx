"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  UploadCloud,
  FileCheck2,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  History,
  HardDrive,
  Database,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  ShieldCheck,
  Info
} from "lucide-react";
import Button from "@/app/components/ui/Button";
import StatusBadge from "@/app/components/ui/StatusBadge";

const REQUIRED_FILES = [
  "routes.csv",
  "stops.csv",
  "scheduled_trips.csv",
  "stop_times.csv",
  "passenger_loads.csv",
  "bus_positions.csv",
  "vehicles.csv",
  "crew_availability.csv",
  "demo_assumptions.json"
];

interface VersionItem {
  id: string;
  version_number: number;
  dataset_name: string;
  dataset_date: string;
  status: string;
  source_type: string;
  is_active: boolean;
  total_records: number;
  published_at?: string;
}

interface StorageUsageData {
  databaseStorageBytes: number;
  databaseStorageLimitBytes: number;
  fileStorageBytes: number;
  fileStorageLimitBytes: number;
  usagePercentage: number;
  isApproachingLimit: boolean;
}

export default function DataUploadManager() {
  const [workflowTab, setWorkflowTab] = useState<"operational" | "research" | "history">("operational");
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Version management
  const [versions, setVersions] = useState<VersionItem[]>([]);
  const [usage, setUsage] = useState<StorageUsageData | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Research upload
  const [researchFile, setResearchFile] = useState<File | null>(null);
  const [researchUploadResult, setResearchUploadResult] = useState<any | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const researchInputRef = useRef<HTMLInputElement>(null);

  const fetchVersionsAndStatus = async () => {
    try {
      const [verRes, statRes] = await Promise.all([
        fetch("/api/data/versions"),
        fetch("/api/supabase/status")
      ]);
      if (verRes.ok) {
        const vData = await verRes.json();
        if (vData.success && vData.data?.versions) {
          setVersions(vData.data.versions);
        }
      }
      if (statRes.ok) {
        const sData = await statRes.json();
        if (sData.success && sData.data?.usage) {
          setUsage(sData.data.usage);
        }
      }
    } catch {
      // Fallback grace
    }
  };

  useEffect(() => {
    fetchVersionsAndStatus();
  }, []);

  const handleFilesSelected = (fileList: FileList | null) => {
    if (!fileList) return;
    const updated: Record<string, File> = { ...selectedFiles };
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const lower = file.name.toLowerCase();
      if (REQUIRED_FILES.includes(lower)) {
        updated[lower] = file;
      }
    }
    setSelectedFiles(updated);
    setErrorMessage(null);
  };

  const handleOperationalUploadAndValidate = async () => {
    const presentFiles = Object.keys(selectedFiles);
    const missing = REQUIRED_FILES.filter(r => !presentFiles.includes(r));
    if (missing.length > 0) {
      setErrorMessage(`Incomplete operational dataset. Missing required files: ${missing.join(", ")}`);
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append("datasetType", "operational");
      formData.append("datasetName", `Operator Upload — Version ${versions.length + 1}`);
      formData.append("datasetDate", new Date().toISOString().slice(0, 10));

      for (const [name, file] of Object.entries(selectedFiles)) {
        formData.append(name, file);
      }

      const res = await fetch("/api/data/upload", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.message || data.errors?.join("; ") || "Validation failed.");
        setUploadResult(data);
      } else {
        setUploadResult(data);
        setSuccessMessage(data.message || "Dataset successfully validated and staged.");
        await fetchVersionsAndStatus();
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Upload error");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePublishVersion = async (versionId: string) => {
    if (!confirm("Confirm publication: This will make the staged dataset version active across the operations dashboard, simulations, and reports.")) {
      return;
    }

    setIsActionLoading(true);
    try {
      const res = await fetch("/api/data/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage("Dataset published successfully. Operations models are now active on this version.");
        await fetchVersionsAndStatus();
      } else {
        setErrorMessage(data.message || "Failed to publish version.");
      }
    } catch {
      setErrorMessage("Network error during publication.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRollbackVersion = async (versionId: string) => {
    if (!confirm("Confirm rollback: Switch active dataset pointer back to this previously validated version? Current and past records will be preserved.")) {
      return;
    }

    setIsActionLoading(true);
    try {
      const res = await fetch("/api/data/rollback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage("Dataset rolled back successfully.");
        await fetchVersionsAndStatus();
      } else {
        setErrorMessage(data.message || "Failed to rollback.");
      }
    } catch {
      setErrorMessage("Network error during rollback.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleResearchUpload = async () => {
    if (!researchFile) {
      setErrorMessage("Please select a research workbook or summary file.");
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    setResearchUploadResult(null);

    try {
      const formData = new FormData();
      formData.append("datasetType", "research");
      formData.append("file", researchFile);

      const res = await fetch("/api/data/upload", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResearchUploadResult(data.data);
        setSuccessMessage("Research file stored securely in private research storage.");
        setResearchFile(null);
      } else {
        setErrorMessage(data.message || "Research upload failed.");
      }
    } catch {
      setErrorMessage("Network error during research upload.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-Tabs for Upload Sections */}
      <div className="flex border-b border-[#DCE5ED] gap-2">
        <button
          onClick={() => { setWorkflowTab("operational"); setErrorMessage(null); setSuccessMessage(null); }}
          className={`pb-3 px-3 text-xs font-bold transition-colors border-b-2 ${
            workflowTab === "operational"
              ? "border-[#0F8278] text-[#0F8278]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Operational Dataset Ingestion (9 Files)
        </button>
        <button
          onClick={() => { setWorkflowTab("research"); setErrorMessage(null); setSuccessMessage(null); }}
          className={`pb-3 px-3 text-xs font-bold transition-colors border-b-2 ${
            workflowTab === "research"
              ? "border-[#0F8278] text-[#0F8278]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Research &amp; Case Study Upload (Isolated)
        </button>
        <button
          onClick={() => { setWorkflowTab("history"); setErrorMessage(null); setSuccessMessage(null); }}
          className={`pb-3 px-3 text-xs font-bold transition-colors border-b-2 ${
            workflowTab === "history"
              ? "border-[#0F8278] text-[#0F8278]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Version History &amp; Rollback ({versions.length})
        </button>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-xs text-rose-800">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold block">Validation or Ingestion Failure</strong>
            <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-xs text-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold block">Operation Successful</strong>
            <p className="mt-0.5 leading-relaxed">{successMessage}</p>
          </div>
        </div>
      )}

      {/* WORKFLOW 1: OPERATIONAL DATASET INGESTION */}
      {workflowTab === "operational" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-[#DCE5ED] p-6 space-y-5">
            <div>
              <h4 className="font-bold text-[#12233F] text-base">Upload Complete 9-File Operational Dataset</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                An operational version requires all nine approved files. Files are parsed using the validated parser, audited against 56 rules, and stored permanently in secure versioned storage.
              </p>
            </div>

            {/* Drop / Select Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFilesSelected(e.dataTransfer.files);
              }}
              className="border-2 border-dashed border-[#DCE5ED] hover:border-[#0F8278] transition-colors rounded-xl p-8 text-center cursor-pointer bg-slate-50/50"
            >
              <UploadCloud className="h-8 w-8 text-[#0F8278] mx-auto mb-2" />
              <p className="text-xs font-semibold text-[#12233F]">
                Drag and drop your 9 operational files here, or <span className="text-[#0F8278] underline">browse files</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Supported: 8 CSV files (routes, stops, scheduled_trips, stop_times, passenger_loads, bus_positions, vehicles, crew_availability) + demo_assumptions.json
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".csv,.json"
                className="hidden"
                onChange={(e) => handleFilesSelected(e.target.files)}
              />
            </div>

            {/* File Checklist */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#12233F] block">Required File Checklist (9 Files):</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {REQUIRED_FILES.map((fileName) => {
                  const isPresent = Boolean(selectedFiles[fileName]);
                  const fileObj = selectedFiles[fileName];
                  return (
                    <div
                      key={fileName}
                      className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                        isPresent
                          ? "bg-emerald-50/50 border-emerald-200 text-emerald-950"
                          : "bg-slate-50 border-slate-200 text-slate-500"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {isPresent ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <div className="h-3.5 w-3.5 rounded-full border border-slate-300 shrink-0" />
                        )}
                        <span className="font-mono text-[11px] truncate">{fileName}</span>
                      </div>
                      {isPresent && (
                        <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                          {(fileObj.size / 1024).toFixed(0)} KB
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {Object.keys(selectedFiles).length} of 9 required files staged
              </span>
              <Button
                variant="primary"
                onClick={handleOperationalUploadAndValidate}
                disabled={isUploading || Object.keys(selectedFiles).length < 9}
              >
                {isUploading ? "Validating & Staging..." : "Validate & Stage Dataset"}
              </Button>
            </div>
          </div>

          {/* Staged & Validation Preview */}
          {uploadResult && uploadResult.success && (
            <div className="bg-white rounded-xl border border-emerald-200 p-6 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  <h4 className="font-bold text-[#12233F] text-sm">
                    Validation Passed (56/56 Checks) — Staged as Version {uploadResult.versionNumber}
                  </h4>
                </div>
                <Button
                  variant="primary"
                  onClick={() => handlePublishVersion(uploadResult.versionId)}
                  disabled={isActionLoading}
                >
                  {isActionLoading ? "Publishing..." : "Publish Version Now"}
                </Button>
              </div>

              {uploadResult.recordCounts && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-2">
                  {Object.entries(uploadResult.recordCounts).map(([k, v]) => (
                    <div key={k} className="p-2 bg-slate-50 rounded border border-slate-100">
                      <span className="text-slate-400 block text-[10px] capitalize">{k}</span>
                      <strong className="text-[#12233F]">{String(v)} rows</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* WORKFLOW 2: RESEARCH & CASE STUDY UPLOAD (ISOLATED) */}
      {workflowTab === "research" && (
        <div className="bg-white rounded-xl border border-[#DCE5ED] p-6 space-y-5">
          <div className="flex items-start gap-3">
            <FileSpreadsheet className="h-5 w-5 text-[#0F8278] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-[#12233F] text-base">Upload Research &amp; Commuter Survey Data</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Research workbooks are stored in the private <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">research-source-files</code> bucket.
                Survey entries are used strictly for aggregate passenger sentiment analysis and are never mixed with vehicle telemetry, GPS traces, or timetable dispatch calculations.
              </p>
            </div>
          </div>

          <div
            onClick={() => researchInputRef.current?.click()}
            className="border-2 border-dashed border-[#DCE5ED] hover:border-[#0F8278] transition-colors rounded-xl p-8 text-center cursor-pointer bg-slate-50/50"
          >
            <UploadCloud className="h-8 w-8 text-[#0F8278] mx-auto mb-2" />
            <p className="text-xs font-semibold text-[#12233F]">
              Select Research Workbook (.xlsx, .json, .csv)
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Supports Excel workbooks (e.g. Bus_Commuter_Survey_100.xlsx) and calibrated archetype JSON summaries
            </p>
            <input
              ref={researchInputRef}
              type="file"
              accept=".xlsx,.xls,.json,.csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setResearchFile(e.target.files[0]);
                }
              }}
            />
          </div>

          {researchFile && (
            <div className="p-3 bg-[#EAF4F7] rounded-lg border border-[#0F8278]/25 text-xs flex items-center justify-between">
              <div>
                <span className="font-semibold text-[#12233F] block">{researchFile.name}</span>
                <span className="text-[11px] text-slate-500">{(researchFile.size / 1024).toFixed(1)} KB</span>
              </div>
              <Button
                variant="primary"
                onClick={handleResearchUpload}
                disabled={isUploading}
              >
                {isUploading ? "Uploading..." : "Upload to Research Storage"}
              </Button>
            </div>
          )}

          {researchUploadResult && (
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 text-xs space-y-1">
              <strong className="text-emerald-950 block">Research Storage Confirmation:</strong>
              <p className="text-emerald-800">Stored at: {researchUploadResult.storagePath}</p>
              <p className="text-slate-600 text-[11px]">Classification: {researchUploadResult.classification}</p>
            </div>
          )}
        </div>
      )}

      {/* WORKFLOW 3: VERSION HISTORY & ROLLBACK */}
      {workflowTab === "history" && (
        <div className="bg-white rounded-xl border border-[#DCE5ED] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-[#12233F] text-base">Dataset Version History &amp; Rollback</h4>
              <p className="text-xs text-slate-500 mt-1">
                Audit history of all validated dataset releases. Rollback switches the active operational pointer without deleting records.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchVersionsAndStatus}>
              Refresh History
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold">
                  <th className="py-2.5 px-3">Version</th>
                  <th className="py-2.5 px-3">Dataset Name</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Records</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {versions.map((ver) => (
                  <tr key={ver.id} className={ver.is_active ? "bg-teal-50/40" : ""}>
                    <td className="py-3 px-3 font-bold text-[#12233F]">
                      v{ver.version_number}
                    </td>
                    <td className="py-3 px-3 font-medium text-[#12233F]">
                      {ver.dataset_name}
                      {ver.is_active && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-[#0F8278] text-white font-bold">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                      {ver.dataset_date}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {ver.total_records.toLocaleString()}
                    </td>
                    <td className="py-3 px-3">
                      <span className="capitalize px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                        {ver.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {!ver.is_active && ver.status === 'published' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRollbackVersion(ver.id)}
                          disabled={isActionLoading}
                          leftIcon={<RotateCcw className="h-3 w-3" />}
                        >
                          Rollback to v{ver.version_number}
                        </Button>
                      )}
                      {!ver.is_active && ver.status === 'validated' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handlePublishVersion(ver.id)}
                          disabled={isActionLoading}
                        >
                          Publish
                        </Button>
                      )}
                      {ver.is_active && (
                        <span className="text-slate-400 text-xs italic">Currently Active</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
