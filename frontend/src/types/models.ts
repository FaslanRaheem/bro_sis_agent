// ============================================================
// src/types/models.ts
// All TypeScript interfaces mirroring the FastAPI backend DTOs.
// Zero `any` — strict types throughout.
// ============================================================

// --------------- Primitives ---------------

/** User roles as defined by the backend */
export type Role = "employee" | "manager" | "hr" | "admin";

/** Leave status as returned by the backend */
export type LeaveStatus = "pending" | "approved" | "rejected";

/** Chat message role */
export type MessageRole = "user" | "assistant";

// --------------- Auth ---------------

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: "bearer";
  needs_password_reset: boolean;
}

export interface RegisterRequest {
  full_name: string;
  email: string;
  password: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface ForceResetPasswordRequest {
  new_password: string;
  confirm_password: string;
}

export interface GoogleAuthUrlResponse {
  auth_url: string;
}

// --------------- Users ---------------

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  department: string | null;
  manager_id: string | null;
  annual_leave_balance: number;
  sick_leave_balance: number;
  maternity_leave_balance: number;
  paternity_leave_balance: number;
  bereavement_leave_balance: number;
  unpaid_leave_balance: number;
  is_active: boolean;
}

export interface CreateUserRequest {
  full_name: string;
  email: string;
  password: string;
  role: Role;
  department?: string | null;
}

export interface UpdateRoleRequest {
  role: Role;
}

export interface AssignUserRequest {
  manager_id: string;
  department: string;
}

export interface ResetPasswordRequest {
  new_password: string;
}

// --------------- Leaves ---------------

export interface LeaveRequest {
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  leave_type: string;
  reason?: string | null;
}

export interface LeaveActionRequest {
  action: "approve" | "reject";
  note?: string | null;
}

export interface Leave {
  id: string;
  user_id: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  leave_type: string;
  reason: string | null;
  status: LeaveStatus;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  applicant_name: string | null;
  department: string | null;
  approver_name: string | null;
}

// --------------- Complaints ---------------

export type ComplaintPriority = "Low" | "Medium" | "High" | "Critical";

export interface ComplaintRequest {
  title: string;
  description: string;
  department?: string | null;
  priority: ComplaintPriority;
  is_anonymous?: boolean;
  against_user_id?: string | null;
}

export interface UpdateComplaintRequest {
  status?: string;
  resolution_note?: string | null;
}

export interface ResolveComplaintRequest {
  resolution_note: string;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  department: string | null;
  priority: string;
  status: string;
  is_anonymous: boolean;
  resolution_note: string | null;
  created_at: string;
  against_user_id: string | null;
  reporter_name: string | null;
  resolved_at: string | null;
  resolved_by_name: string | null;
}

// --------------- Documents ---------------

export interface Document {
  id: string;
  filename: string;
  gcs_uri: string;
  uploaded_by: string | null;
  created_at: string;
}

export interface DocumentUploadResponse {
  message: string;
  id: string;
}

export interface DocumentViewResponse {
  url: string;
}

// --------------- AI Chat ---------------

export interface ChatSession {
  id: string;
  user_id: string;
  created_at: string;
}

export interface CreateSessionRequest {
  title?: string | null;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: MessageRole;
  content: string;
  meta_data?: Record<string, unknown> | null;
  created_at: string;
}

export interface SendMessageRequest {
  session_id: string;
  role: "user";
  content: string;
}

export interface FeedbackRequest {
  feedback: "thumbs_up" | "thumbs_down";
}

// --------------- API Error ---------------

/** Standard FastAPI error detail shape */
export interface ApiError {
  detail: string | { loc: string[]; msg: string; type: string }[];
}
