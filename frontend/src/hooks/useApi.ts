import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "";
const WILL_SCANNER_BASE = import.meta.env.VITE_WILL_SCANNER_URL || "http://localhost:8001";
const TRANSFER_PIPELINE_BASE = import.meta.env.VITE_TRANSFER_PIPELINE_URL || "http://localhost:8002";
const api = axios.create({ baseURL: `${API_BASE}/api` });

export function useEstates(status?: string) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/estates", { params: status ? { status } : {} });
      setData(res.data);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refetch: fetch };
}

export function useEstate(id: string) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get(`/estates/${id}`)
      .then(r => { setData(r.data); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [id]);

  return { data, loading, error };
}

export const estateApi = {
  create: (body: any) => api.post("/estates", body).then(r => r.data),
  calculate: (id: string) => api.post(`/estates/${id}/calculate`).then(r => r.data),
  dispatchAdvisor: (id: string, email: string) =>
    api.post(`/estates/${id}/dispatch-advisor`, { advisor_email: email }).then(r => r.data),
  beneficiaries: (id: string) => api.get(`/estates/${id}/beneficiaries`).then(r => r.data),
  shareInstructions: (id: string) => api.get(`/estates/${id}/share-instructions`).then(r => r.data),
  transfers: (id: string) => api.get(`/estates/${id}/transfers`).then(r => r.data),
  legalApprovals: (id: string) => api.get(`/estates/${id}/legal-approvals`).then(r => r.data),
  auditLog: (id: string) => api.get(`/estates/${id}/audit-log`).then(r => r.data),
};

export const demoApi = {
  seed: () => api.post("/demo/seed").then(r => r.data),
};

export const globalApi = {
  beneficiaries: () => api.get("/beneficiaries").then(r => r.data),
  legalQueue:    () => api.get("/legal-queue").then(r => r.data),
  transfers:     () => api.get("/transfers").then(r => r.data),
  audit:         (limit = 200) => api.get("/audit", { params: { limit } }).then(r => r.data),
};

export const claimApi = {
  submit: (body: any) => api.post("/claims", body).then(r => r.data),
  approve: (id: string) => api.post(`/claims/${id}/approve`).then(r => r.data),
  reject: (id: string, reason: string) => api.post(`/claims/${id}/reject`, { reason }).then(r => r.data),
  status: (id: string) => api.get(`/claims/${id}/status`).then(r => r.data),
};

export const transferApi = {
  execute: (estateId: string) =>
    axios.post(`${TRANSFER_PIPELINE_BASE}/execute`, { estate_id: estateId }).then(r => r.data),
};

export const documentApi = {
  list: (estateId: string) =>
    api.get(`/estates/${estateId}/documents`).then(r => r.data),
  upload: (estateId: string, file: File, documentType: string, uploadedBy?: string) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("document_type", documentType);
    if (uploadedBy) fd.append("uploaded_by", uploadedBy);
    return api.post(`/estates/${estateId}/documents`, fd).then(r => r.data);
  },
  review: (estateId: string, docId: string, action: "approve" | "reject", reviewedBy: string, notes?: string) =>
    api.post(`/estates/${estateId}/documents/${docId}/review`, {
      action, reviewed_by: reviewedBy, reviewer_notes: notes,
    }).then(r => r.data),
};
