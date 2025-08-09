
'use client';

import React from 'react';
import { useReactFlow, Node } from 'reactflow';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { PaletteNode, nodeCategories } from '@/lib/nodes';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';
import useFlowStore from '@/store/flow-store';

const nodeColorClasses = {
    'gold': 'bg-yellow-500/20 text-yellow-700',
    'orange': 'bg-orange-500/20 text-orange-700',
    'red': 'bg-red-500/20 text-red-700',
    'yellow': 'bg-amber-500/20 text-amber-700',
    'blue': 'bg-blue-500/20 text-blue-700',
    'green': 'bg-green-500/20 text-green-700',
    'teal': 'bg-teal-500/20 text-teal-700',
    'purple': 'bg-purple-500/20 text-purple-700',
    'gray': 'bg-gray-500/20 text-gray-700',
};

const PaletteNodeComponent: React.FC<{ node: PaletteNode }> = ({ node }) => {
    const { addNode } = useFlowStore();
    const reactFlowInstance = useReactFlow();

    const onDragStart = (event: React.DragEvent, nodeType: string, label: string, description: string) => {
        event.dataTransfer.setData('application/reactflow', JSON.stringify({ nodeType, label, description }));
        event.dataTransfer.effectAllowed = 'move';
    };

    const onClick = () => {
        const center = reactFlowInstance.project({
            x: window.innerWidth / 2,
            y: window.innerHeight / 3,
        });

        const newNode: Node = {
            id: `${+new Date()}`,
            type: 'custom',
            position: center,
            data: { type: node.type, label: node.label, description: node.description },
        };
        addNode(newNode);
    };

    const Icon = node.icon;
    const colorClass = node.color ? nodeColorClasses[node.color as keyof typeof nodeColorClasses] || nodeColorClasses.gray : nodeColorClasses.gray;


    return (
        <div
            className="flex flex-col items-center justify-center gap-2 p-3 text-sm transition-colors bg-white rounded-lg shadow-sm cursor-grab hover:bg-gray-100 border"
            onDragStart={(event) => onDragStart(event, node.type, node.label, node.description)}
            onClick={onClick}
            draggable
        >
            <div className={cn("flex items-center justify-center w-10 h-10 rounded-full", colorClass)}>
                <Icon className="w-5 h-5" />
            </div>
            <span className="text-center text-xs font-medium text-gray-700">{node.label}</span>
        </div>
    );
};

export function SidebarPalette() {
  return (
    <aside className="w-72 border-r bg-gray-50 flex flex-col">
      <div className="p-4 text-lg font-semibold border-b bg-white">Blocks</div>
      <ScrollArea className="flex-grow">
        <Accordion type="multiple" defaultValue={['Operations', 'Integrations']} className="w-full p-2">
            <AccordionItem value="Operations" className="border-b-0">
                <AccordionTrigger className="text-base hover:no-underline font-semibold text-gray-600 px-2">
                    Operations
                </AccordionTrigger>
                <AccordionContent>
                    <div className="grid grid-cols-2 gap-2 p-1">
                        {nodeCategories.find(c => c.name === 'Operations')?.nodes.map((node) => (
                            <PaletteNodeComponent key={node.label} node={node} />
                        ))}
                    </div>
                </AccordionContent>
            </AccordionItem>
             <AccordionItem value="Integrations" className="border-b-0">
                <AccordionTrigger className="text-base hover:no-underline font-semibold text-gray-600 px-2">
                    Integrations
                </AccordionTrigger>
                <AccordionContent>
                    <div className="grid grid-cols-2 gap-2 p-1">
                         {nodeCategories.find(c => c.name === 'Integrations')?.nodes.map((node) => (
                            <PaletteNodeComponent key={node.label} node={node} />
                        ))}
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
      </ScrollArea>
    </aside>
  );
}
