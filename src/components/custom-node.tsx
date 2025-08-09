'use client';

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { nodeCategories } from '@/lib/nodes';
import { cn } from '@/lib/utils';
import { MessageSquare, MoreHorizontal, Trash2, Wand2, Expand } from 'lucide-react';
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
    if (data.type !== 'trigger') {
      openNodeModal(id);
    }
  };
  
  const isConditionNode = data.type === 'condition';

  return (
    <div 
      className={cn(
        "w-72 rounded-lg bg-white shadow-md border-2 border-transparent transition-all duration-200 group hover:cursor-grab", 
        selected && "border-green-600 shadow-lg ring-2 ring-offset-2 ring-green-600"
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
      <div className='p-3 text-sm text-gray-600 min-h-[40px]'>
         {data.description || 'Node configuration goes here.'}
      </div>

      {data.type !== 'trigger' && (
          <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-green-600" />
      )}
      
      {isConditionNode ? (
        <>
            <Handle type="source" position={Position.Right} id="source-true" className="!w-3 !h-3 !bg-green-600" style={{ top: '33%' }} />
            <Handle type="source" position={Position.Right} id="source-false" className="!w-3 !h-3 !bg-red-600" style={{ top: '66%' }} />
        </>
      ) : (
          <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-green-600" />
      )}
    </div>
  );
};

export default React.memo(CustomNode);
