export type UserRole = "agent" | "leader" | "supervisor" | "admin";

export interface User {
  id: number;
  telegram_id: number;
  username: string | null;
  full_name: string;
  role: UserRole;
  team: string | null;
  email?: string | null;
  created_at: string;
}

export type Outcome = "closed" | "no_response" | "rejected" | "pending" | "error" | null;

export interface ChatRecord {
  id: number;
  chat_id: string;
  user_id: number;
  agent_name: string;
  customer_name: string;
  total_messages: number;
  outcome: Outcome;
  agent_score: number | null;
  engagement_score: number | null;
  root_cause: string | null;
  analysis_json: string | null;
  coaching_json: string | null;
  source_file: string | null;
  created_at: string;
}

export interface ChatAnalysis {
  chat_id: string;
  outcome: string | null;
  stages_detected: string[];
  customer_needs: string[];
  objections: {
    type: string;
    quote: string;
    handled_well: boolean;
    agent_response_quality: string;
  }[];
  sentiment_customer: string;
  engagement_score: number;
  agent_score: number;
  root_cause: string;
  what_went_well: string[];
  what_could_improve: string[];
  key_moments: string[];
}

export interface CoachingRecommendation {
  chat_id: string;
  priority_actions: string[];
  improved_scripts: {
    situation: string;
    original: string;
    improved: string;
  }[];
  playbook_refs: string[];
}
