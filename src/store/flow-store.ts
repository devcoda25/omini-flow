
'use client';

import { create } from 'zustand';
import {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  addEdge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';
import { produce } from 'immer';

import { getLayoutedElements } from '@/lib/layout';
import { createClient } from '@/utils/supabase/client';

export type RFState = {
  nodes: Node[];
  edges: Edge[];
  flowId: string | null;
  modalNodeId: string | null;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (node: Node) => void;
  updateNodeData: (nodeId: string, data: any) => void;
  updateNodeDescription: (nodeId: string, description: string) => void;
  deleteNode: (nodeId: string) => void;
  applyLayout: () => void;
  fetchFlow: (flowId: string) => Promise<void>;
  openNodeModal: (nodeId: string) => void;
  closeNodeModal: () => void;
};

const supabase = createClient();

const useFlowStore = create<RFState>((set, get) => ({
  nodes: [],
  edges: [],
  flowId: null,
  modalNodeId: null,

  fetchFlow: async (flowId: string) => {
    set({ flowId });

    const { data: nodesData, error: nodesError } = await supabase
      .from('nodes')
      .select('*')
      .eq('flow_id', flowId);

    if (nodesError) {
      console.error('Error fetching nodes:', nodesError);
      set({ nodes: [], edges: [] });
      return;
    }

    const { data: edgesData, error: edgesError } = await supabase
      .from('edges')
      .select('*')
      .eq('flow_id', flowId);

    if (edgesError) {
      console.error('Error fetching edges:', edgesError);
      set({ nodes: [], edges: [] });
      return;
    }

    const nodes = nodesData.map((n) => ({
      id: n.id,
      data: n.data || {},
      position: n.position || { x: 0, y: 0 },
      type: n.type || 'custom',
    }));

    const edges = edgesData.map((e) => ({
      id: e.id,
      source: e.source_node_id,
      target: e.target_node_id,
      sourceHandle: e.source_handle,
      animated: true,
      label: e.source_handle === 'source-true' ? 'TRUE' : e.source_handle === 'source-false' ? 'FALSE' : undefined
    }));

    set({ nodes, edges });
  },

  onNodesChange: (changes: NodeChange[]) => {
    set(
      produce((state: RFState) => {
        const newNodes = applyNodeChanges(changes, get().nodes);
        state.nodes = newNodes;

        // Persist changes to Supabase
        changes.forEach(async (change) => {
          if (
            change.type === 'position' &&
            change.position &&
            change.dragging === false
          ) {
            await supabase
              .from('nodes')
              .update({ position: change.position })
              .match({ id: change.id, flow_id: get().flowId });
          }
        });
      })
    );
  },

  onEdgesChange: (changes: EdgeChange[]) => {
    set(
      produce((state: RFState) => {
        state.edges = applyEdgeChanges(changes, get().edges);
      })
    );
  },

  onConnect: async (connection: Connection) => {
    if (!get().flowId) return;

    const { nodes, edges } = get();
    const sourceNode = nodes.find(node => node.id === connection.source);
    
    // If it's not a condition node, check if there's already an edge from this source handle.
    if (sourceNode?.data.type !== 'condition') {
        const existingEdge = edges.find(edge => edge.source === connection.source && edge.sourceHandle === connection.sourceHandle);
        if (existingEdge) {
            console.warn(`Node ${connection.source} can only have one outgoing connection.`);
            return; // Prevent adding a new edge
        }
    } else { // For condition nodes, allow one connection per handle ('true' or 'false')
         const existingEdge = edges.find(edge => edge.source === connection.source && edge.sourceHandle === connection.sourceHandle);
         if (existingEdge) {
            console.warn(`Handle ${connection.sourceHandle} on node ${connection.source} already has a connection.`);
            return;
         }
    }


    const newEdge = { 
        ...connection, 
        id: `${+new Date()}`, 
        animated: true,
        label: connection.sourceHandle === 'source-true' ? 'TRUE' : connection.sourceHandle === 'source-false' ? 'FALSE' : undefined
    };

    set(
      produce((state: RFState) => {
        state.edges = addEdge(newEdge, get().edges);
      })
    );

    await supabase.from('edges').insert([
      {
        id: newEdge.id,
        source_node_id: newEdge.source!,
        target_node_id: newEdge.target!,
        source_handle: newEdge.sourceHandle,
        flow_id: get().flowId!,
      },
    ]);
  },

  addNode: async (node: Node) => {
    if (!get().flowId) {
      console.error('Cannot add node, flowId is not set.');
      return;
    }
    set(
      produce((state: RFState) => {
        state.nodes.push(node);
      })
    );
    // The `type` from the node is the business logic type (e.g., 'messaging').
    // The actual node type for React Flow is 'custom'.
    const { error } = await supabase
      .from('nodes')
      .insert([
        {
          id: node.id,
          flow_id: get().flowId,
          data: node.data,
          position: node.position,
          type: 'custom',
        },
      ]);
    if (error) console.error('Error adding node:', error);
  },

  updateNodeData: async (nodeId: string, data: any) => {
    if (!get().flowId) return;
    set(
      produce((state: RFState) => {
        const node = state.nodes.find((n) => n.id === nodeId);
        if (node) {
          node.data = data;
        }
      })
    );
     const { error } = await supabase
      .from('nodes')
      .update({ data })
      .match({ id: nodeId, flow_id: get().flowId });

    if (error) {
      console.error('Error updating node data:', error);
    }
  },
  
  updateNodeDescription: (nodeId: string, description: string) => {
    if (!get().flowId) return;
     set(
      produce((state: RFState) => {
        const node = state.nodes.find((n) => n.id === nodeId);
        if (node) {
          const newData = { ...node.data, description };
          get().updateNodeData(nodeId, newData);
        }
      })
    );
  },

  deleteNode: (nodeId: string) => {
    if (!get().flowId) return;
    set(
      produce((state: RFState) => {
        state.nodes = state.nodes.filter((n) => n.id !== nodeId);
        state.edges = state.edges.filter(
          (e) => e.source !== nodeId && e.target !== nodeId
        );
      })
    );
    // Persist to Supabase
    supabase
      .from('nodes')
      .delete()
      .match({ id: nodeId, flow_id: get().flowId! })
      .then(({ error }) => {
        if (error) console.error('Error deleting node:', error);
      });
  },

  applyLayout: () => {
    const { nodes, edges, flowId } = get();
    if (!flowId) return;

    // Create a mutable copy of the nodes to avoid modifying the original state objects.
    const layoutableNodes = nodes.map((node) => ({ ...node }));
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      layoutableNodes,
      edges
    );
    // Create new array to trigger re-render
    set(
      produce((state: RFState) => {
        state.nodes = layoutedNodes;
        state.edges = layoutedEdges;
      })
    );
    // Persist layout changes to Supabase
    layoutedNodes.forEach(async (node) => {
      await supabase
        .from('nodes')
        .update({ position: node.position })
        .match({ id: node.id, flow_id: flowId });
    });
  },

  openNodeModal: (nodeId: string) => {
    set({ modalNodeId: nodeId });
  },

  closeNodeModal: () => {
    set({ modalNodeId: null });
  },
}));

export default useFlowStore;
