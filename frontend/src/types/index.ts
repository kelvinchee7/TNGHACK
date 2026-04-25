export type EstateStatus =
  | "PENDING" | "SCANNING" | "VERIFIED" | "DISTRIBUTING"
  | "CLOSED"  | "DISPUTED" | "SCAN_FAILED";

export type KycStatus =
  | "PENDING" | "ID_VERIFIED" | "BIOMETRIC_CONFIRMED" | "APPROVED" | "REJECTED";

export type InstructionStatus =
  | "PENDING" | "APPROVED" | "EXECUTING" | "COMPLETED" | "FAILED";

export interface Estate {
  id: string;
  deceased_name: string;
  deceased_account_id: string;
  death_date: string;
  status: EstateStatus;
  total_rm: number;
  account_frozen_at: string | null;
  created_at: string;
  updated_at: string;
  beneficiary_count: number;
}

export interface Beneficiary {
  id: string;
  estate_id: string;
  name_enc: string;
  kyc_status: KycStatus;
  share_rm: number | null;
  transfer_method: string;
  fx_currency: string | null;
  rejection_reason: string | null;
  created_at: string;
}

export interface Transfer {
  id: string;
  share_instruction_id: string;
  leg: number;
  method: string;
  external_ref: string | null;
  status: string;
  executed_at: string | null;
  settled_at: string | null;
}

export interface AuditEntry {
  id: string;
  estate_id: string | null;
  actor_id: string | null;
  actor_ip: string | null;
  action: string;
  payload_json: string | null;
  created_at: string;
}
