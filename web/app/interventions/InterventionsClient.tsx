"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Info,
  MapPin,
  Bus,
  RotateCcw,
  History,
  Check,
  X
} from "lucide-react";
import type { InterventionProposal, InterventionsData } from "@/lib/engine/interventions-service";

interface InterventionsClientProps {
  initialData: InterventionsData;
}

interface StoredReview {
  proposalId: string;
  decision: "approved" | "rejected";
  reviewNote: string;
  reviewedAt: string;
}

const STORAGE_KEY = "hogana_intervention_reviews_v1";

function loadStoredReviews(): { records: Record<string, StoredReview>; isStorageAvailable: boolean } {
  if (typeof window === "undefined") {
    return { records: {}, isStorageAvailable: true };
  }
  try {
    // Probe storage availability
    const testKey = "__hogana_probe__";
    localStorage.setItem(testKey, "1");
    localStorage.removeItem(testKey);

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { records: {}, isStorageAvailable: true };

    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return { records: {}, isStorageAvailable: true };
    }

    const valid: Record<string, StoredReview> = {};
    for (const [key, item] of Object.entries(parsed)) {
      if (
        item &&
        typeof item === "object" &&
        typeof (item as StoredReview).proposalId === "string" &&
        ((item as StoredReview).decision === "approved" || (item as StoredReview).decision === "rejected") &&
        typeof (item as StoredReview).reviewNote === "string" &&
        typeof (item as StoredReview).reviewedAt === "string"
      ) {
        valid[key] = item as StoredReview;
      }
    }
    return { records: valid, isStorageAvailable: true };
  } catch (err) {
    console.warn("Unable to access localStorage:", err);
    return { records: {}, isStorageAvailable: false };
  }
}

function saveStoredReviews(reviews: Record<string, StoredReview>): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
    return true;
  } catch (err) {
    console.warn("Unable to save reviews to localStorage:", err);
    return false;
  }
}

export default function InterventionsClient({ initialData }: InterventionsClientProps) {
  const [reviews, setReviews] = useState<Record<string, StoredReview>>({});
  const [storageAvailable, setStorageAvailable] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "proposed" | "approved" | "rejected">("ALL");
  const [selectedProposal, setSelectedProposal] = useState<InterventionProposal | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [reviewNote, setReviewNote] = useState<string>("");
  const [rejectionError, setRejectionError] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "warning" | "info" } | null>(null);

  // Initialize from localStorage safely after mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const { records, isStorageAvailable } = loadStoredReviews();
      setReviews(records);
      setStorageAvailable(isStorageAvailable);
      if (!isStorageAvailable) {
        setNotification({
          message: "Warning: Browser local storage is unavailable. Decisions will persist in memory only.",
          type: "warning"
        });
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const showNotification = (message: string, type: "success" | "warning" | "info" = "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Combine initial proposals with local review status
  const proposalsWithReview = useMemo(() => {
    return initialData.proposals.map((p) => {
      const review = reviews[p.id];
      if (review) {
        return {
          ...p,
          status: review.decision
        };
      }
      return p;
    });
  }, [initialData.proposals, reviews]);

  // Filter proposals
  const filteredProposals = useMemo(() => {
    if (activeFilter === "ALL") return proposalsWithReview;
    return proposalsWithReview.filter((p) => p.status === activeFilter);
  }, [proposalsWithReview, activeFilter]);

  // Counts
  const counts = useMemo(() => {
    const proposed = proposalsWithReview.filter((p) => p.status === "proposed").length;
    const approved = proposalsWithReview.filter((p) => p.status === "approved").length;
    const rejected = proposalsWithReview.filter((p) => p.status === "rejected").length;
    return { all: proposalsWithReview.length, proposed, approved, rejected };
  }, [proposalsWithReview]);

  const handleOpenAction = (proposal: InterventionProposal, action: "approve" | "reject") => {
    setSelectedProposal(proposal);
    setActionType(action);
    setReviewNote(reviews[proposal.id]?.reviewNote || "");
    setRejectionError(null);
    setIsConfirmOpen(true);
  };

  const handleConfirmDecision = () => {
    if (!selectedProposal || !actionType) return;

    // Genuinely mandatory rejection note check — block confirmation when note is empty
    if (actionType === "reject" && !reviewNote.trim()) {
      setRejectionError("A specific operational rejection note is required to reject an advisory intervention proposal.");
      return;
    }

    const note = reviewNote.trim() || (actionType === "approve" ? "Approved by reviewer for demonstration testing." : "");

    const updated: Record<string, StoredReview> = {
      ...reviews,
      [selectedProposal.id]: {
        proposalId: selectedProposal.id,
        decision: actionType === "approve" ? "approved" : "rejected",
        reviewNote: note,
        reviewedAt: new Date().toISOString()
      }
    };

    setReviews(updated);
    const saveSucceeded = saveStoredReviews(updated);

    setIsConfirmOpen(false);
    if (saveSucceeded) {
      showNotification(
        `Intervention ${selectedProposal.id} marked as ${actionType.toUpperCase()}. Decision saved to browser local demonstration records.`,
        "success"
      );
    } else {
      showNotification(
        `Warning: Browser storage is unavailable or quota was exceeded. Decision could not be saved to local storage.`,
        "warning"
      );
    }

    setSelectedProposal(null);
    setActionType(null);
    setReviewNote("");
    setRejectionError(null);
  };

  const handleResetDecisions = () => {
    if (confirm("Reset all local demonstration review decisions back to 'Proposed'?")) {
      setReviews({});
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        console.warn(e);
      }
      showNotification("All demonstration decisions have been reset to Proposed.", "info");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-lg border border-slate-700 flex items-center gap-2.5 text-xs animate-in fade-in slide-in-from-bottom-2">
          {notification.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : (
            <Info className="h-4 w-4 text-teal-400 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header & Overview Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 rounded px-2 py-0.5">
                Dispatcher Intervention Workflow
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-medium">{initialData.corridor}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Corridor Operational Interventions &amp; Human Review
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Inspect and act on advisory recommendations generated by the HOGANA operational intelligence engine.
              All proposals are decision-support only; approval does not initiate vehicle movement or timetable changes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!storageAvailable && (
              <span className="text-xs px-2 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                Storage unavailable (session memory only)
              </span>
            )}
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
            >
              <History className="h-4 w-4 text-slate-500" />
              <span>Review History ({Object.keys(reviews).length})</span>
            </button>

            {Object.keys(reviews).length > 0 && (
              <button
                onClick={handleResetDecisions}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-600 transition-colors"
                title="Reset local decisions"
              >
                <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
                <span>Reset Decisions</span>
              </button>
            )}
          </div>
        </div>

        {/* Local Storage Disclosure Banner */}
        <div className="mt-4 p-3 rounded-lg bg-amber-50/80 border border-amber-200/90 text-xs text-amber-900 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Demonstration Review Storage:</strong> Review decisions are recorded locally in this browser (<code>localStorage</code>) to support demonstration workflows. They are not official BMTC approvals, automated dispatch triggers, or shared database persistence.
          </p>
        </div>

        {/* Quick Filter Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium mr-1">Status:</span>
            {(
              [
                { id: "ALL", label: `All (${counts.all})` },
                { id: "proposed", label: `Proposed (${counts.proposed})` },
                { id: "approved", label: `Approved (${counts.approved})` },
                { id: "rejected", label: `Rejected (${counts.rejected})` }
              ] as const
            ).map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`
                  px-3 py-1 rounded-md text-xs font-semibold transition-all
                  ${
                    activeFilter === filter.id
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                  }
                `}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-500">
            Showing {filteredProposals.length} of {proposalsWithReview.length} operational proposals
          </div>
        </div>
      </div>

      {/* Proposals Grid */}
      {filteredProposals.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <ShieldAlert className="h-8 w-8 text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-800">No interventions matching filter</h3>
          <p className="text-xs text-slate-500 mt-1">
            Try switching the filter to &quot;All&quot; to inspect all advisory proposals.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredProposals.map((proposal) => {
            const review = reviews[proposal.id];
            const isApproved = proposal.status === "approved";
            const isRejected = proposal.status === "rejected";

            return (
              <div
                key={proposal.id}
                className={`
                  bg-white rounded-xl border shadow-xs p-5 transition-all flex flex-col justify-between
                  ${
                    isApproved
                      ? "border-emerald-300 ring-1 ring-emerald-200/50"
                      : isRejected
                      ? "border-rose-300 ring-1 ring-rose-200/50"
                      : "border-slate-200 hover:border-slate-300"
                  }
                `}
              >
                <div>
                  {/* Card Header: Category, ID & Status Badge */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                          {proposal.id}
                        </span>
                        <span className="text-xs font-semibold text-slate-700">
                          {proposal.categoryLabel}
                        </span>
                      </div>
                      <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                        <span>{proposal.locationName}</span>
                        <span className="text-slate-400 font-normal">({proposal.direction})</span>
                      </h2>
                    </div>

                    {/* Status Pill */}
                    {isApproved ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        Approved
                      </span>
                    ) : isRejected ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-rose-800 bg-rose-50 border border-rose-300">
                        <XCircle className="h-3.5 w-3.5 text-rose-600" />
                        Rejected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-amber-800 bg-amber-50 border border-amber-300">
                        <Clock className="h-3.5 w-3.5 text-amber-600" />
                        Proposed
                      </span>
                    )}
                  </div>

                  {/* Operational Details Grid */}
                  <div className="mt-3.5 space-y-2.5 text-xs text-slate-700">
                    {/* Condition */}
                    <div>
                      <span className="font-semibold text-slate-900 block text-[11px] uppercase tracking-wider mb-0.5">
                        Detected Condition
                      </span>
                      <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                        {proposal.conditionDescription}
                      </p>
                    </div>

                    {/* Metrics Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-slate-50 p-2 rounded border border-slate-100">
                        <span className="text-slate-500 font-medium block">Measured Metric:</span>
                        <strong className="text-slate-900">{proposal.measuredMetric}</strong>
                      </div>
                      <div className="bg-slate-50 p-2 rounded border border-slate-100">
                        <span className="text-slate-500 font-medium block">Threshold Constraint:</span>
                        <strong className="text-slate-900">{proposal.thresholdMetric}</strong>
                      </div>
                    </div>

                    {/* Entities Involved */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                      <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        <Bus className="h-3 w-3 text-slate-500" />
                        Target Bus: <strong>{proposal.busId || "Not available"}</strong>
                      </span>
                      <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        Trip: <strong>{proposal.tripId || "Not available"}</strong>
                      </span>
                      <span className="text-slate-500 text-[10px]">
                        Source: {proposal.sourceView}
                      </span>
                    </div>

                    {/* Recommended Action */}
                    <div className="pt-1">
                      <span className="font-semibold text-teal-900 block text-[11px] uppercase tracking-wider mb-0.5">
                        Recommended Advisory Action
                      </span>
                      <p className="text-teal-950 font-medium bg-teal-50/70 p-2.5 rounded-lg border border-teal-200/80 leading-relaxed">
                        {proposal.recommendedAction}
                      </p>
                    </div>

                    {/* Limitations & Policy Disclaimer */}
                    <div className="pt-1">
                      <span className="font-semibold text-slate-500 block text-[10px] uppercase tracking-wider mb-0.5">
                        Operational Limitations &amp; Disclosures
                      </span>
                      <p className="text-slate-500 text-[11px] leading-relaxed italic">
                        {proposal.limitations}
                      </p>
                    </div>

                    {/* Previous Review Note if exists */}
                    {review && (
                      <div className="mt-2 p-2.5 rounded-lg bg-slate-100/80 border border-slate-200 text-xs">
                        <span className="font-semibold text-slate-800 block text-[11px]">
                          Review Record ({review.decision.toUpperCase()} on {new Date(review.reviewedAt).toLocaleTimeString()}):
                        </span>
                        <p className="text-slate-700 italic mt-0.5 font-mono text-[11px]">
                          &ldquo;{review.reviewNote}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400">
                    Eval: {proposal.sourceTimestamp}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenAction(proposal, "reject")}
                      disabled={isRejected}
                      className={`
                        flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                        ${
                          isRejected
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                            : "bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 shadow-xs"
                        }
                      `}
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>{isRejected ? "Rejected" : "Reject"}</span>
                    </button>

                    <button
                      onClick={() => handleOpenAction(proposal, "approve")}
                      disabled={isApproved}
                      className={`
                        flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                        ${
                          isApproved
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                        }
                      `}
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>{isApproved ? "Approved" : "Approve"}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      {isConfirmOpen && selectedProposal && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                {actionType === "approve" ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <span>Confirm Proposal Approval</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-rose-600" />
                    <span>Confirm Proposal Rejection</span>
                  </>
                )}
              </h3>
              <button
                onClick={() => setIsConfirmOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <p><strong>Proposal ID:</strong> <span className="font-mono">{selectedProposal.id}</span></p>
                <p><strong>Category:</strong> {selectedProposal.categoryLabel}</p>
                <p><strong>Location:</strong> {selectedProposal.locationName}</p>
                <p><strong>Action:</strong> {selectedProposal.recommendedAction}</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-900 mb-1">
                  Reviewer Notes / Reason:
                  {actionType === "reject" && (
                    <span className="text-rose-600 font-bold ml-1">* Required</span>
                  )}
                </label>
                <textarea
                  rows={3}
                  value={reviewNote}
                  onChange={(e) => {
                    setReviewNote(e.target.value);
                    if (e.target.value.trim()) setRejectionError(null);
                  }}
                  placeholder={
                    actionType === "approve"
                      ? "Optional: Add dispatcher operational review notes..."
                      : "Required: Specify reasons for rejecting this advisory intervention..."
                  }
                  className={`w-full rounded-lg border p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 font-mono ${
                    rejectionError
                      ? "border-rose-400 focus:ring-rose-400 bg-rose-50/30"
                      : "border-slate-300 focus:ring-teal-500"
                  }`}
                />
                {rejectionError && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1">
                    {rejectionError}
                  </p>
                )}
              </div>

              <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                <strong>Advisory Safety Notice:</strong> Confirming this review records your demonstration evaluation in local browser storage. It does not issue live dispatch commands or alter timetable schedules.
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setIsConfirmOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDecision}
                disabled={actionType === "reject" && !reviewNote.trim()}
                className={`
                  px-4 py-1.5 rounded-lg text-xs font-bold text-white shadow-xs transition-all
                  ${
                    actionType === "approve"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : actionType === "reject" && !reviewNote.trim()
                      ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
                      : "bg-rose-600 hover:bg-rose-700"
                  }
                `}
              >
                Confirm {actionType === "approve" ? "Approval" : "Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review History Drawer */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-xs">
          <div className="bg-white h-full max-w-md w-full shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-teal-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Review Decision History
                </h3>
              </div>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Close history drawer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Decisions persisted in current browser session via local demonstration storage (<code>localStorage</code>).
            </p>

            {Object.keys(reviews).length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No intervention decisions recorded yet. Approve or reject a proposal to populate review records.
              </div>
            ) : (
              <div className="space-y-3">
                {Object.values(reviews).map((r) => (
                  <div
                    key={r.proposalId}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-900">{r.proposalId}</span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                          r.decision === "approved"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : "bg-rose-100 text-rose-800 border border-rose-300"
                        }`}
                      >
                        {r.decision.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-slate-700 italic font-mono text-[11px] bg-white p-2 rounded border border-slate-100">
                      &ldquo;{r.reviewNote}&rdquo;
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Logged: {new Date(r.reviewedAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
