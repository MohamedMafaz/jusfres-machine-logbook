export interface Discussion {
  id: string;
  entry_id: string;
  author_id: string;
  author_name: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface DiscussionFormData {
  content: string;
}

export interface DiscussionProps {
  entryId: string;
  onClose?: () => void;
} 