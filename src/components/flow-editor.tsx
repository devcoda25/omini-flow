
'use client';

import React, { useEffect } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { SidebarPalette } from './sidebar-palette';
import { ReactFlowCanvas } from './react-flow-canvas';
import useFlowStore from '@/store/flow-store';

export function FlowEditor({ flowId }: { flowId: string }) {
  const fetchFlow = useFlowStore((state) => state.fetchFlow);

  useEffect(() => {
    // We only fetch the flow if a valid flowId is provided.
    if (flowId) {
      fetchFlow(flowId);
    }
  }, [flowId, fetchFlow]);

  return (
    <ReactFlowProvider>
      <div className="flex flex-grow h-full w-full bg-background text-foreground overflow-hidden">
        <SidebarPalette />
        <div className="flex-grow relative h-full">
          <ReactFlowCanvas />
        </div>
      </div>
    </ReactFlowProvider>
  );
}
