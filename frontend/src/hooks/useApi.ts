import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const api = axios.create({ baseURL: "/api" });

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
};

export const claimApi = {
  submit: (body: any) => api.post("/claims", body).then(r => r.data),
  approve: (id: string) => api.post(`/claims/${id}/approve`).then(r => r.data),
  reject: (id: string, reason: string) => api.post(`/claims/${id}/reject`, { reason }).then(r => r.data),
  status: (id: string) => api.get(`/claims/${id}/status`).then(r => r.data),
};

export const transferApi = {
  execute: (estateId: string) =>
    axios.post("http://localhost:8002/execute", { estate_id: estateId }).then(r => r.data),
};
