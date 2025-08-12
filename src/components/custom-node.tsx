
'use client';

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { nodeCategories } from '@/lib/nodes';
import { cn } from '@/lib/utils';
import { MessageSquare, MoreHorizontal, Trash2, Expand, Image, Video, FileText, File } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from './ui/button';
import useFlowStore from '@/store/flow-store';

const nodeHeaderColorClasses = {
    'gold': 'bg-yellow-500',
    'orange': 'bg-orange-500',
    'red': 'bg-red-500',
    'yellow': 'bg-amber-500',
    'blue': 'bg-blue-500',
    'green': 'bg-green-500',
    'teal': 'bg-teal-500',
    'purple': 'bg-purple-500',
    'gray': 'bg-gray-500',
};

const MessageTypeButton = ({ icon: Icon, label, isActive, onClick }: { icon: React.ElementType, label: string, isActive: boolean, onClick: () => void }) => (
    <Button
        variant={isActive ? "secondary" : "ghost"}
        size="sm"
        className={cn("flex-1 justify-start text-left gap-2 px-2", isActive && "bg-primary/10 text-primary font-semibold")}
        onClick={(e) => {
            e.stopPropagation();
            onClick();
        }}
    >
        <Icon className="h-4 w-4" />
        <span>{label}</span>
    </Button>
)

const CustomNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const { deleteNode, openNodeModal, updateNodeData } = useFlowStore();
  const allNodes = nodeCategories.flatMap(category => category.nodes);
  const nodeInfo = allNodes.find(node => node.type === data.type);

  const Icon = nodeInfo?.icon || MessageSquare;
  const colorClass = nodeInfo?.color ? nodeHeaderColorClasses[nodeInfo.color as keyof typeof nodeHeaderColorClasses] || 'bg-gray-500' : 'bg-gray-500';

  const handleDeleteNode = () => {
    deleteNode(id);
  };

  const handleDoubleClick = () => {
    if (data.type !== 'trigger' && data.type !== 'end_flow') {
      openNodeModal(id);
    }
  };

  const handleMessageTypeChange = (messageType: string) => {
    updateNodeData(id, { ...data, messageType });
  };
  
  const isConditionNode = data.type === 'condition';
  const isMessageNode = data.type === 'message';
  const isControlNode = data.type === 'trigger' || data.type === 'end_flow';

  const getDescription = () => {
    if (isMessageNode) {
        const messageType = data.messageType || 'text';
        switch (messageType) {
            case 'text':
                return data.message ? `"${data.message}"` : 'Click to edit text message.';
            case 'image':
                return data.caption || 'Click to add an image.';
            case 'video':
                return data.caption || 'Click to add a video.';
            case 'document':
                 return data.caption || 'Click to add a document.';
            default:
                return 'Select a message type.';
        }
    }
    return data.description || 'Node configuration goes here.';
  }

  if (isControlNode) {
    return (
       <div 
        className={cn(
            "w-72 rounded-lg transition-all duration-200 group flex items-center justify-center p-4 gap-4",
            selected && "ring-2 ring-offset-2 ring-green-600"
        )}
       >
        <Icon className={cn("h-8 w-8", data.type === 'trigger' ? 'text-green-600' : 'text-red-600')} />
        <h3 className="text-lg font-semibold text-gray-700">{data.label}</h3>
         {data.type === 'trigger' ? (
             <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-green-600" />
         ) : (
            <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-red-600" />
         )}
       </div>
    )
  }

  return (
    <div 
      className={cn(
        "w-72 rounded-lg bg-white shadow-md border-2 border-transparent transition-all duration-200 group hover:cursor-grab", 
        selected && "shadow-lg ring-2 ring-offset-2 ring-green-600"
      )}
      onDoubleClick={handleDoubleClick}
    >
      <div className={cn("flex items-center justify-between p-3 rounded-t-md", colorClass)}>
          <div className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-white" />
              <h3 className="text-base font-semibold text-white">{data.label}</h3>
          </div>
          <div className="flex items-center">
             <Expand className="h-4 w-4 text-white/70 opacity-0 group-hover:opacity-100 transition-opacity mr-2" />
             {data.type !== 'trigger' && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-white/20 hover:text-white">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Node Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => openNodeModal(id)}>
                            Edit Node
                        </DropdownMenuItem>
                         <DropdownMenuItem onSelect={handleDeleteNode} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete Node</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
          </div>
      </div>
      <div className='p-3 text-sm text-gray-600 min-h-[40px] truncate'>
         {getDescription()}
      </div>

      {isMessageNode && (
        <div className="p-2">
            <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 rounded-md">
                <MessageTypeButton 
                    icon={MessageSquare}
                    label="Text"
                    isActive={!data.messageType || data.messageType === 'text'}
                    onClick={() => handleMessageTypeChange('text')}
                />
                <MessageTypeButton 
                    icon={Image}
                    label="Image"
                    isActive={data.messageType === 'image'}
                    onClick={() => handleMessageTypeChange('image')}
                />
                <MessageTypeButton 
                    icon={Video}
                    label="Video"
                    isActive={data.messageType === 'video'}
                    onClick={() => handleMessageTypeChange('video')}
                />
                <MessageTypeButton 
                    icon={File}
                    label="Document"
                    isActive={data.messageType === 'document'}
                    onClick={() => handleMessageTypeChange('document')}
                />
            </div>
        </div>
      )}


      {data.type !== 'trigger' && (
          <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-green-600" />
      )}
      
      {isConditionNode ? (
        <>
            <Handle type="source" position={Position.Right} id="source-true" className="!w-3 !h-3 !bg-green-600" style={{ top: '33%' }} />
            <Handle type="source" position={Position.Right} id="source-false" className="!w-3 !h-3 !bg-red-600" style={{ top: '66%' }} />
        </>
      ) : data.type !== 'end_flow' && (
          <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-green-600" />
      )}
    </div>
  );
};

export default React.memo(CustomNode);
