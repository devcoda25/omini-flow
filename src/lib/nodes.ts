
import type { LucideIcon } from "lucide-react";
import { MessageSquare, ChevronsRight, Briefcase, Clock, Bot, ArrowRight, Cog, Play, UserCheck, UserX, Tag, User, Users, Power, Send, FileText, HelpCircle, GitBranch, Share2, Image, Video, Music, File, PowerOff } from 'lucide-react';

export type NodeType = 
  | 'trigger'
  | 'message'
  | 'question'
  | 'condition'
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'subscribe'
  | 'unsubscribe'
  | 'update_attribute'
  | 'set_tags'
  | 'assign_team'
  | 'assign_user'
  | 'trigger_chatbot'
  | 'update_chat_status'
  | 'template'
  | 'time_delay'
  | 'webhook'
  | 'google_spreadsheet'
  | 'zapier'
  | 'hubspot'
  | 'end_flow';

export interface PaletteNode {
  type: NodeType;
  label: string;
  description: string;
  icon: LucideIcon;
  color: 'gold' | 'orange' | 'red' | 'yellow' | 'blue' | 'green' | 'teal' | 'purple' | 'gray';
}

export interface NodeCategory {
  name: string;
  nodes: PaletteNode[];
}

export const nodeCategories: NodeCategory[] = [
  {
    name: 'Operations',
    nodes: [
      { type: 'trigger', label: 'Start Flow', description: 'Initial trigger for the flow.', icon: Play, color: 'green' },
      { type: 'message', label: 'Message', description: 'Send a message to the contact.', icon: MessageSquare, color: 'blue' },
      { type: 'question', label: 'Question', description: 'Ask a question and save the answer.', icon: HelpCircle, color: 'blue' },
      { type: 'image', label: 'Image', description: 'Send an image.', icon: Image, color: 'blue' },
      { type: 'video', label: 'Video', description: 'Send a video.', icon: Video, color: 'blue' },
      { type: 'audio', label: 'Audio', description: 'Send an audio file.', icon: Music, color: 'blue' },
      { type: 'document', label: 'Document', description: 'Send a document.', icon: File, color: 'blue' },
      { type: 'condition', label: 'If/Else Condition', description: 'Branch the flow based on a condition.', icon: GitBranch, color: 'purple' },
      { type: 'template', label: 'Template', description: 'Send a pre-approved WhatsApp template.', icon: Send, color: 'teal' },
      { type: 'time_delay', label: 'Time Delay', description: 'Wait for a specified amount of time.', icon: Clock, color: 'gray' },
      { type: 'set_tags', label: 'Set tags', description: 'Apply or remove tags on a contact.', icon: Tag, color: 'yellow' },
      { type: 'update_attribute', label: 'Update Attribute', description: 'Update a contact\'s attribute.', icon: Cog, color: 'red' },
      { type: 'assign_team', label: 'Assign Team', description: 'Assign the conversation to a team.', icon: Users, color: 'blue' },
      { type: 'assign_user', label: 'Assign User', description: 'Assign the conversation to a specific user.', icon: User, color: 'green' },
      { type: 'trigger_chatbot', label: 'Trigger Chatbot', description: 'Start another chatbot flow.', icon: Bot, color: 'purple' },
      { type: 'update_chat_status', label: 'Update Chat Status', description: 'Change the status of the chat.', icon: Power, color: 'red' },
      { type: 'end_flow', label: 'End Flow', description: 'Marks the end of a flow path.', icon: PowerOff, color: 'red' },
    ],
  },
  {
    name: 'Integrations',
    nodes: [
      { type: 'webhook', label: 'Webhook', description: 'Send data to an external URL.', icon: ArrowRight, color: 'purple' },
      { type: 'google_spreadsheet', label: 'Google Spreadsheet', description: 'Read or write to Google Sheets.', icon: FileText, color: 'green' },
      { type: 'zapier', label: 'Zapier', description: 'Trigger a Zap in Zapier.', icon: ChevronsRight, color: 'orange' },
      { type: 'hubspot', label: 'Hubspot', description: 'Sync data with Hubspot CRM.', icon: Briefcase, color: 'orange' },
    ],
  },
];
