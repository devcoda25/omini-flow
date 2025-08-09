'use client';

import React from 'react';
import useFlowStore from '@/store/flow-store';
import { useShallow } from 'zustand/react/shallow';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Textarea } from './ui/textarea';
import { Wand2 } from 'lucide-react';
import { Button } from './ui/button';
import { useTransition } from 'react';
import { generateToolDescription } from '@/ai/flows/generate-tool-descriptions';
import { Skeleton } from './ui/skeleton';

const selector = (state: any) => ({
  nodes: state.nodes,
  updateNodeData: state.updateNodeData,
  updateNodeDescription: state.updateNodeDescription,
});

export function PropertiesPanel({ selectedNodeId }: { selectedNodeId: string | null }) {
  const { nodes, updateNodeData, updateNodeDescription } = useFlowStore(useShallow(selector));
  const [isPending, startTransition] = useTransition();

  const node = nodes.find((n: any) => n.id === selectedNodeId);

  if (!node) {
    return (
      <aside className="w-96 p-4 bg-gray-50 border-l">
        <div className="text-center text-gray-500">
          Select a node to see its properties.
        </div>
      </aside>
    );
  }

  const handleLabelChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newLabel = event.target.value;
    updateNodeData(node.id, { ...node.data, label: newLabel });
  };
  
  const handleGenerateDescription = () => {
    if (!node.data.type) return;

    startTransition(async () => {
        const result = await generateToolDescription({ nodeType: node.data.type });
        if (result.description) {
           updateNodeDescription(node.id, result.description);
        }
    });
  };

  return (
    <aside className="w-96 p-4 bg-gray-50 border-l space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Node Properties</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="node-id">Node ID</Label>
            <Input id="node-id" value={node.id} readOnly disabled />
          </div>
          <div>
            <Label htmlFor="node-type">Node Type</Label>
            <Input id="node-type" value={node.data.type} readOnly disabled />
          </div>
          <div>
            <Label htmlFor="node-label">Label</Label>
            <Input
              id="node-label"
              value={node.data.label}
              onChange={handleLabelChange}
            />
          </div>
           <div>
            <div className="flex justify-between items-center mb-1">
                <Label htmlFor="node-description">Description</Label>
                <Button variant="ghost" size="sm" onClick={handleGenerateDescription} disabled={isPending}>
                    <Wand2 className="h-4 w-4 mr-2"/>
                    {isPending ? 'Generating...' : 'AI Generate'}
                </Button>
            </div>
            {isPending ? (
                 <Skeleton className="h-24 w-full" />
            ) : (
                <Textarea
                    id="node-description"
                    value={node.data.description || 'Click AI Generate to create a description.'}
                    readOnly
                    rows={4}
                    className="bg-white"
                />
            )}
           </div>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-4">Configuration</h3>
        <div className="p-4 border rounded-md bg-white">
            <p className="text-sm text-gray-500">Specific node configuration will appear here.</p>
        </div>
      </div>
    </aside>
  );
}
