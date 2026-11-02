"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Info,
  MapPin,
  Bus,
  RotateCcw,
  History,
  Check,
  X
} from "lucide-react";
import type { InterventionProposal, InterventionsData } from "@/lib/engine/interventions-service";
import PageHeader from "@/app/components/ui/PageHeader";
import StatusBadge from "@/app/components/ui/StatusBadge";
import AlertPanel from "@/app/components/ui/AlertPanel";
import Button from "@/app/components/ui/Button";

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

  useEffect(() => {
    // 1. Initialise immediately from local storage for fast render
    const { records, isStorageAvailable } = loadStoredReviews();
    setReviews(records);
    setStorageAvailable(isStorageAvailable);

    // 2. Fetch persistent reviews from PostgreSQL database via API
    fetch("/api/interventions/reviews")
      .then((res) => res.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          const remoteRecords: Record<string, StoredReview> = {};
          res.data.forEach((r: { proposal_id: string; decision: "approved" | "rejected"; review_note: string; reviewed_at: string }) => {
            if (r.proposal_id) {
              remoteRecords[r.proposal_id] = {
                proposalId: r.proposal_id,
                decision: r.decision,
                reviewNote: r.review_note || "",
                reviewedAt: r.reviewed_at
              };
            }
          });
          if (Object.keys(remoteRecords).length > 0) {
            setReviews((prev) => {
              const merged = { ...prev, ...remoteRecords };
              saveStoredReviews(merged);
              return merged;
            });
          }
        }
      })
      .catch((err) => {
        console.warn("Could not fetch remote persistent reviews:", err);
      });

    if (!isStorageAvailable) {
      setNotification({
        message: "Warning: Browser local storage is unavailable. Decisions will persist in memory only.",
        type: "warning"
      });
    }
  }, []);

  const showNotification = (message: string, type: "success" | "warning" | "info" = "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

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

  const filteredProposals = useMemo(() => {
    if (activeFilter === "ALL") return proposalsWithReview;
    return proposalsWithReview.filter((p) => p.status === activeFilter);
  }, [proposalsWithReview, activeFilter]);

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

    if (actionType === "reject" && !reviewNote.trim()) {
      setRejectionError("A specific operational rejection note is required to reject an advisory intervention proposal.");
      return;
    }

    const note = reviewNote.trim() || (actionType === "approve" ? "Approved by operations reviewer." : "");

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

    // Persist to PostgreSQL database audit log via API
    fetch("/api/interventions/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        proposalId: selectedProposal.id,
        decision: actionType === "approve" ? "approved" : "rejected",
        reviewNote: note
      })
    })
      .then((res) => res.json())
      .catch((err) => {
        console.warn("Audit persistence error:", err);
      });

    setIsConfirmOpen(false);
    if (saveSucceeded) {
      showNotification(
        `Intervention ${selectedProposal.id} marked as ${actionType.toUpperCase()}. Decision persisted to audit database.`,
        "success"
      );
    } else {
      showNotification(
        `Intervention ${selectedProposal.id} marked as ${actionType.toUpperCase()}. Saved to memory/audit API.`,
        "info"
      );
    }

    setSelectedProposal(null);
    setActionType(null);
    setReviewNote("");
    setRejectionError(null);
  };

  const handleResetDecisions = () => {
    if (confirm("Reset all local review decisions back to 'Proposed'?")) {
      setReviews({});
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        console.warn(e);
      }
      showNotification("All review decisions have been reset to Proposed.", "info");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
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

      {/* Header */}
      <PageHeader
        badge="Dispatcher Review"
        badgeTone="teal"
        serviceArea="Silk Board–Hebbal, Bengaluru"
        title="Operational Interventions &amp; Human Review"
        description="Inspect and act on advisory recommendations generated by the HOGANA operational intelligence engine. All proposals are decision-support only; approval does not initiate vehicle movement or timetable changes."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {!storageAvailable && (
              <span className="text-xs px-2.5 py-1 rounded-md bg-amber-50 text-amber-900 border border-amber-200 font-medium">
                Storage unavailable
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsHistoryOpen(true)}
              leftIcon={<History className="h-3.5 w-3.5 text-slate-500" />}
            >
              Review History ({Object.keys(reviews).length})
            </Button>
            {Object.keys(reviews).length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetDecisions}
                leftIcon={<RotateCcw className="h-3.5 w-3.5 text-slate-400" />}
              >
                Reset
              </Button>
            )}
          </div>
        }
      />

      {/* Dispatcher Audit Disclosure Banner */}
      <AlertPanel
        severity="info"
        title="Local Review Storage &amp; Audit Governance"
        description="Review decisions are recorded persistently in Supabase PostgreSQL (with offline browser storage fallback) for audit logging and dispatcher evaluation. Interventions are advisory decision-support recommendations and not official BMTC approvals or automated dispatch triggers."
      />

      {/* Filter and Count Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
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

      {/* Proposals Grid */}
      {filteredProposals.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-xs">
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
                        <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
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

                    <StatusBadge
                      status={
                        isApproved
                          ? "Approved"
                          : isRejected
                          ? "Rejected"
                          : "Proposed"
                      }
                      tone={
                        isApproved
                          ? "success"
                          : isRejected
                          ? "danger"
                          : "warning"
                      }
                      size="sm"
                    />
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenAction(proposal, "reject")}
                      disabled={isRejected}
                      className={isRejected ? "opacity-50" : "text-rose-700 hover:bg-rose-50 border-rose-300"}
                      leftIcon={<X className="h-3.5 w-3.5" />}
                    >
                      {isRejected ? "Rejected" : "Reject"}
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenAction(proposal, "approve")}
                      disabled={isApproved}
                      className={isApproved ? "opacity-50 bg-slate-200 text-slate-500" : "bg-teal-600 hover:bg-teal-700 text-white"}
                      leftIcon={<Check className="h-3.5 w-3.5" />}
                    >
                      {isApproved ? "Approved" : "Approve"}
                    </Button>
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

            <div className="space-y-3 text-xs text-slate-700 mb-5">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="font-semibold text-slate-900 block mb-1">
                  {selectedProposal.id}: {selectedProposal.categoryLabel} ({selectedProposal.locationName})
                </span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  {selectedProposal.recommendedAction}
                </p>
              </div>

              <div>
                <label className="block text-slate-800 font-semibold mb-1">
                  Operational Review Note {actionType === "reject" ? "(Mandatory)" : "(Optional)"}:
                </label>
                <textarea
                  value={reviewNote}
                  onChange={(e) => {
                    setReviewNote(e.target.value);
                    if (rejectionError) setRejectionError(null);
                  }}
                  rows={3}
                  placeholder={
                    actionType === "reject"
                      ? "State reasons for rejection (e.g. traffic clearance verified, depot constraints, driver hours)..."
                      : "Add review notes or dispatcher shift notes..."
                  }
                  className={`w-full p-2.5 bg-slate-50 border rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    rejectionError ? "border-rose-400 bg-rose-50/50" : "border-slate-200"
                  }`}
                />
                {rejectionError && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1">
                    {rejectionError}
                  </p>
                )}
              </div>

              <p className="text-[11px] text-slate-500 italic">
                Note: Approvals and rejections are stored in browser local review memory only.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsConfirmOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant={actionType === "approve" ? "primary" : "danger"}
                size="sm"
                onClick={handleConfirmDecision}
              >
                {actionType === "approve" ? "Approve Proposal" : "Reject Proposal"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* History Drawer / Modal */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-slate-700" />
                <h3 className="text-base font-bold text-slate-900">
                  Local Review History ({Object.keys(reviews).length} Records)
                </h3>
              </div>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Close history dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              {Object.keys(reviews).length === 0 ? (
                <p className="text-slate-500 text-center py-8">
                  No intervention reviews have been recorded in local storage yet.
                </p>
              ) : (
                Object.values(reviews).map((r) => (
                  <div key={r.proposalId} className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-slate-900">{r.proposalId}</span>
                      <StatusBadge
                        status={r.decision === "approved" ? "Approved" : "Rejected"}
                        tone={r.decision === "approved" ? "success" : "danger"}
                        size="sm"
                      />
                    </div>
                    <p className="text-slate-700 italic font-mono text-[11px] mt-1">
                      &ldquo;{r.reviewNote}&rdquo;
                    </p>
                    <span className="text-[10px] text-slate-400 block mt-2">
                      Recorded: {new Date(r.reviewedAt).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 mt-4 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsHistoryOpen(false)}
              >
                Close History
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
