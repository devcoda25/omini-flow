
'use server';

import { createClient } from '@/utils/supabase/server';

export type ChatState = {
    messages: {
        id: string;
        text: string;
        sender: 'user' | 'bot';
    }[];
    currentNodeId: string;
}

// Fetches the single "trigger" node which is the starting point of any flow.
const getStartNode = async (flowId: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('nodes')
        .select('*')
        .eq('flow_id', flowId)
        .eq('data->>type', 'trigger')
        .single();
    
    if (error) {
        console.error('Error fetching start node:', error);
        return null;
    }
    return data;
}


// Fetches the node connected to the output of a given source node.
const getNextNode = async (flowId: string, currentId: string, sourceHandle?: string) => {
     const supabase = createClient();

    // Find the edge that connects from the current node's specific handle
    const query = supabase
        .from('edges')
        .select('target_node_id')
        .eq('flow_id', flowId)
        .eq('source_node_id', currentId);
    
    // If a sourceHandle is provided (like for condition branches), use it to find the correct edge.
    if (sourceHandle) {
        query.eq('source_handle', sourceHandle);
    }
    
    const { data: edge, error: edgeError } = await query.single();

    if (edgeError || !edge) {
        console.log(`No outgoing edge from ${currentId} with handle ${sourceHandle}`);
        return null;
    }

    // Now fetch the actual node that the edge points to.
    const { data: nextNode, error: nodeError } = await supabase
        .from('nodes')
        .select('*')
        .eq('flow_id', flowId)
        .eq('id', edge.target_node_id)
        .single();

    if (nodeError) {
        console.error('Error fetching next node:', nodeError);
        return null;
    }
    return nextNode;
}

// Evaluates an If/Else condition node based on user input.
const evaluateCondition = (condition: any, userInput: string | null): boolean => {
    if (!condition || !userInput) return false;

    const { operator, value } = condition;
    const lowerCaseUserInput = userInput.toLowerCase();
    const lowerCaseValue = value.toLowerCase();

    switch (operator) {
        case 'equals':
            return lowerCaseUserInput === lowerCaseValue;
        case 'not_equals':
            return lowerCaseUserInput !== lowerCaseValue;
        case 'contains':
            return lowerCaseUserInput.includes(lowerCaseValue);
        case 'greater_than':
            return parseFloat(userInput) > parseFloat(value);
        case 'less_than':
            return parseFloat(userInput) < parseFloat(value);
        default:
            return false;
    }
}


/**
 * The main "brain" of the chatbot. This server action processes the flow
 * step-by-step based on the current state and user input.
 */
export async function executeFlow(flowId: string, currentState: ChatState, userInput: string | null): Promise<ChatState> {
    const newState: ChatState = {
        messages: [...currentState.messages],
        currentNodeId: currentState.currentNodeId,
    };
    
    // Add user's message to the history if they sent one.
    if (userInput) {
        newState.messages.push({ id: crypto.randomUUID(), text: userInput, sender: 'user' });
    }

    let currentNode = null;

    if (currentState.currentNodeId) {
        // If we are already in a flow, find the previous node to determine the next step.
        const supabase = createClient();
        const { data: prevNode, error } = await supabase.from('nodes').select('data').eq('id', currentState.currentNodeId).single();

        let sourceHandle: string | undefined = undefined;

        // If the previous node was a condition, evaluate it to decide which path to take (true/false).
        if (prevNode?.data?.type === 'condition') {
             if (evaluateCondition(prevNode.data.condition, userInput)) {
                 sourceHandle = 'source-true';
             } else {
                 sourceHandle = 'source-false';
             }
        }
        
        const nextNode = await getNextNode(flowId, currentState.currentNodeId, sourceHandle);
        if (nextNode) {
            currentNode = nextNode;
        } else {
             // If there's no next node, the flow ends.
             newState.messages.push({ id: crypto.randomUUID(), text: "I'm sorry, I don't know how to continue. The flow has ended.", sender: 'bot' });
             newState.currentNodeId = '';
             return newState;
        }
    } else {
        // This is the beginning of the conversation. Find the start trigger and get the first real node.
        const startNode = await getStartNode(flowId);
        if (!startNode) {
            newState.messages.push({ id: crypto.randomUUID(), text: "This flow is not configured correctly. No start trigger found.", sender: 'bot' });
            return newState;
        }
        const firstNode = await getNextNode(flowId, startNode.id);
         if (firstNode) {
            currentNode = firstNode;
        } else {
             newState.messages.push({ id: crypto.randomUUID(), text: "This flow has no starting point after the trigger.", sender: 'bot' });
             newState.currentNodeId = '';
             return newState;
        }
    }

    // Process the current node based on its type.
    if (currentNode) {
        newState.currentNodeId = currentNode.id;
        const nodeData = currentNode.data as any;
        let shouldWaitForUserInput = false;

        switch(nodeData.type) {
            case 'message':
                newState.messages.push({ id: crypto.randomUUID(), text: nodeData.message, sender: 'bot' });
                break;
            case 'question':
                newState.messages.push({ id: crypto.randomUUID(), text: nodeData.question, sender: 'bot' });
                shouldWaitForUserInput = true; // Stop and wait for the user to answer.
                break;
            case 'condition':
                newState.messages.push({ id: crypto.randomUUID(), text: `🚦 Condition: Waiting for input to check if attribute \`${nodeData.condition?.attribute}\` ${nodeData.condition?.operator} \`${nodeData.condition?.value}\`.`, sender: 'bot' });
                shouldWaitForUserInput = true;
                break;
            case 'image':
            case 'video':
            case 'audio':
            case 'document':
                 const emoji = { image: '🖼️', video: '🎬', audio: '🎵', document: '📄' }[nodeData.type] || '📎';
                 const caption = nodeData.caption ? `: ${nodeData.caption}` : '(no caption)';
                 newState.messages.push({ id: crypto.randomUUID(), text: `${emoji} ${nodeData.type.charAt(0).toUpperCase() + nodeData.type.slice(1)}${caption}`, sender: 'bot' });
                break;
            case 'time_delay':
                const delay = (nodeData.minutes || 0) * 60 + (nodeData.seconds || 0);
                newState.messages.push({ id: crypto.randomUUID(), text: `⏱️ Waiting for ${delay} seconds...`, sender: 'bot' });
                // In a real app, this would be a proper async delay. For the test chat, we just continue.
                break;
            case 'template':
                 newState.messages.push({ id: crypto.randomUUID(), text: `✉️ Template Sent: \`${nodeData.template}\``, sender: 'bot' });
                 break;
            case 'set_tags':
                newState.messages.push({ id: crypto.randomUUID(), text: `🏷️ Tag Applied: \`${nodeData.tag}\``, sender: 'bot' });
                break;
            case 'update_attribute':
                 newState.messages.push({ id: crypto.randomUUID(), text: `📝 Attribute Updated: Set \`${nodeData.attribute}\` to \`${nodeData.value}\``, sender: 'bot' });
                 break;
            case 'assign_team':
                 newState.messages.push({ id: crypto.randomUUID(), text: `👨‍👩‍👧‍👦 Assigned to Team: \`${nodeData.team}\``, sender: 'bot' });
                 break;
            case 'assign_user':
                 newState.messages.push({ id: crypto.randomUUID(), text: `👤 Assigned to User: \`${nodeData.user}\``, sender: 'bot' });
                 break;
             case 'trigger_chatbot':
                 newState.messages.push({ id: crypto.randomUUID(), text: `🤖 Triggering another chatbot...`, sender: 'bot' });
                 break;
            case 'update_chat_status':
                 newState.messages.push({ id: crypto.randomUUID(), text: `⚡ Chat Status Updated to \`${nodeData.status}\``, sender: 'bot' });
                 break;
            case 'webhook':
                newState.messages.push({ id: crypto.randomUUID(), text: `🔌 Calling webhook to ${nodeData.url}...`, sender: 'bot' });
                try {
                    const headers = nodeData.headers ? JSON.parse(nodeData.headers) : {};
                    const body = nodeData.body ? JSON.parse(nodeData.body) : undefined;
                    
                    const response = await fetch(nodeData.url, {
                        method: nodeData.method || 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            ...headers,
                        },
                        body: body ? JSON.stringify(body) : undefined,
                    });

                    if (response.ok) {
                         newState.messages.push({ id: crypto.randomUUID(), text: `✅ Webhook successful! Status: ${response.status}`, sender: 'bot' });
                    } else {
                         newState.messages.push({ id: crypto.randomUUID(), text: `❌ Webhook failed! Status: ${response.status}`, sender: 'bot' });
                    }
                } catch (error) {
                    console.error("Webhook execution error:", error);
                    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
                    newState.messages.push({ id: crypto.randomUUID(), text: `❌ Webhook error: ${errorMessage}`, sender: 'bot' });
                }
                break;
             case 'google_spreadsheet':
                newState.messages.push({ id: crypto.randomUUID(), text: `📝 Google Spreadsheet: Action \`${nodeData.action}\` on sheet \`${nodeData.sheetName}\`...`, sender: 'bot' });
                break;
            default:
                 newState.messages.push({ id: crypto.randomUUID(), text: `I've reached a node I don't know how to handle yet: ${nodeData.type}. The flow has ended.`, sender: 'bot' });
                 newState.currentNodeId = '';
                 shouldWaitForUserInput = true;
                 break;
        }

        // If the node doesn't require user input, automatically move to the next one.
        if (!shouldWaitForUserInput) {
            return executeFlow(flowId, newState, null);
        }
    }
    
    return newState;
}

type TestWebhookParams = {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers: string; // JSON string
    body: string; // JSON string
};

export async function testWebhookAction(params: TestWebhookParams): Promise<{ status: number; statusText: string; body: any } | { error: string }> {
    try {
        const headers = params.headers ? JSON.parse(params.headers) : {};
        const body = params.body ? JSON.parse(params.body) : undefined;

        const response = await fetch(params.url, {
            method: params.method,
            headers: {
                'Content-Type': 'application/json',
                ...headers,
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        let responseBody: any;
        const contentType = response.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
            try {
                responseBody = await response.json();
            } catch (e) {
                responseBody = "Failed to parse JSON response body.";
            }
        } else {
            responseBody = await response.text();
            if (!responseBody) {
                responseBody = "Response body is empty.";
            }
        }


        return {
            status: response.status,
            statusText: response.statusText,
            body: responseBody,
        };

    } catch (error) {
        console.error('Webhook test error:', error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        if (error instanceof SyntaxError) {
             return { error: `Invalid JSON in Headers or Body: ${errorMessage}` };
        }
        return { error: errorMessage };
    }
}

    