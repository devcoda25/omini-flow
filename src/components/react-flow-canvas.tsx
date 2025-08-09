
'use client';

import React, { useRef, useCallback } from 'react';
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  Node,
  useReactFlow,
  ReactFlowProvider,
  Edge,
} from 'reactflow';
import useFlowStore from '@/store/flow-store';
import CustomNode from './custom-node';
import { NodeSettingsModal } from './flow/node-settings-modal';

const nodeTypes = {
  custom: CustomNode,
};

function ReactFlowCanvasComponent() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode, deleteNode, onEdgesDelete, flowId } = useFlowStore();
  const reactFlowInstance = useReactFlow();

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!flowId) {
        console.warn("Cannot add node without a flowId.");
        return;
      }
      
      if (reactFlowWrapper.current && reactFlowInstance) {
          const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
          const data = event.dataTransfer.getData('application/reactflow');
          if (typeof data === 'undefined' || !data) {
            return;
          }
          const { nodeType, label, description } = JSON.parse(data);
          
          if (typeof nodeType === 'undefined' || !nodeType) {
              return;
            }
            
            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX - reactFlowBounds.left,
                y: event.clientY - reactFlowBounds.top,
            });
            
            const newNode: Node = {
                id: `${+new Date()}`,
                type: 'custom',
                position,
                data: { type: nodeType, label, description },
            };
            
            addNode(newNode);
        }
    },
    [reactFlowInstance, addNode, flowId]
  );
  
  const onNodesDelete = useCallback(
    (deleted: Node[]) => {
      for (const node of deleted) {
        deleteNode(node.id);
      }
    },
    [deleteNode]
  );

  return (
    <div className="flex-grow h-full" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodesDelete={onNodesDelete}
        nodeTypes={nodeTypes}
        onDrop={onDrop}
        onDragOver={onDragOver}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        className="bg-gray-50"
        deleteKeyCode={['Backspace', 'Delete']}
      >
        <Controls showLock={false} className="flex flex-row" />
        <MiniMap nodeColor="#22c55e" nodeStrokeWidth={3} zoomable pannable />
        <Background gap={16} size={1} color="#e0e0e0" />
      </ReactFlow>
      <NodeSettingsModal />
    </div>
  );
}


export function ReactFlowCanvas() {
    return (
      <ReactFlowProvider>
          <ReactFlowCanvasComponent />
      </ReactFlowProvider>
    )
}
