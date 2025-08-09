
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import useFlowStore from '@/store/flow-store';
import { useEffect, useState, useCallback, useTransition } from 'react';
import { produce } from 'immer';
import type { Node } from 'reactflow';
import { Separator } from '../ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { X, UploadCloud, Crop, File as FileIcon, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import Image from 'next/image';
import Cropper, { Area } from 'react-easy-crop';
import { Slider } from '@/components/ui/slider';
import { testWebhookAction } from '@/app/flow/[flowId]/actions';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { getGoogleAuthUrl } from '@/app/auth/google/actions';


// Helper to create a cropped image
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new window.Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous'); // needed to avoid cross-origin issues
    image.src = url;
  });

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
): Promise<string | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  // set canvas size to match the cropped area
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // draw cropped image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // As a blob
  return new Promise((resolve, reject) => {
     resolve(canvas.toDataURL('image/jpeg'));
  });
}


// Helper component for Message node settings
const MessageSettings = ({ node, onDataChange }: { node: Node, onDataChange: (data: any) => void }) => {
    const [message, setMessage] = useState(node.data.message || '');

    useEffect(() => {
        onDataChange({ ...node.data, message });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [message]);
    
    return (
        <>
            <DialogHeader>
                <DialogTitle>Send a message</DialogTitle>
                <Separator className='my-4' />
            </DialogHeader>
            <div className="space-y-4 py-4">
                <Textarea 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message here..."
                    rows={6}
                />
            </div>
        </>
    );
};

// Helper component for Question node settings
const QuestionSettings = ({ node, onDataChange }: { node: Node, onDataChange: (data: any) => void }) => {
    const [question, setQuestion] = useState(node.data.question || '');
    const [saveAttribute, setSaveAttribute] = useState(node.data.saveAttribute || '');

    useEffect(() => {
        onDataChange({ ...node.data, question, saveAttribute });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [question, saveAttribute]);

    return (
        <>
            <DialogHeader>
                <DialogTitle>Ask a question</DialogTitle>
                <Separator className='my-4' />
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="question-text">Question Text</Label>
                    <Textarea 
                        id="question-text"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="e.g., What is your name?"
                        rows={4}
                    />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="save-attribute">Save Answer to Custom Attribute</Label>
                    <Input 
                        id="save-attribute"
                        value={saveAttribute}
                        onChange={(e) => setSaveAttribute(e.target.value)}
                        placeholder="e.g., user_name"
                    />
                </div>
            </div>
        </>
    );
};

// Helper component for Condition node settings
const ConditionSettings = ({ node, onDataChange }: { node: Node, onDataChange: (data: any) => void }) => {
    const [attribute, setAttribute] = useState(node.data.condition?.attribute || '');
    const [operator, setOperator] = useState(node.data.condition?.operator || 'equals');
    const [value, setValue] = useState(node.data.condition?.value || '');
    
    useEffect(() => {
        onDataChange({ 
            ...node.data, 
            condition: { attribute, operator, value } 
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [attribute, operator, value]);

    return (
        <>
            <DialogHeader>
                <DialogTitle>If/Else Condition</DialogTitle>
                <DialogDescription>
                    Create a condition to branch the conversation flow.
                </DialogDescription>
                <Separator className='my-4' />
            </DialogHeader>
             <div className="space-y-4 py-4">
                <p className="font-semibold">If</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                    <Input 
                        placeholder="Attribute (e.g., last_message)" 
                        value={attribute}
                        onChange={(e) => setAttribute(e.target.value)}
                    />
                     <Select value={operator} onValueChange={setOperator}>
                        <SelectTrigger>
                            <SelectValue placeholder="Operator" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="equals">Equals</SelectItem>
                            <SelectItem value="not_equals">Does not equal</SelectItem>
                            <SelectItem value="contains">Contains</SelectItem>
                            <SelectItem value="greater_than">Is greater than</SelectItem>
                             <SelectItem value="less_than">Is less than</SelectItem>
                        </SelectContent>
                    </Select>
                    <Input 
                        placeholder="Value"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                    />
                </div>
                <p className="font-semibold mt-4">Then</p>
                <div className='text-sm text-muted-foreground'>
                    <p>Connect the <span className='text-green-600 font-bold'>top handle (TRUE)</span> for the path if the condition is met.</p>
                     <p>Connect the <span className='text-red-600 font-bold'>bottom handle (FALSE)</span> for the path if it is not.</p>
                </div>
            </div>
        </>
    );
};

// Generic helper for media nodes
const MediaSettings = ({ node, onDataChange, mediaType }: { node: Node, onDataChange: (data: any) => void, mediaType: 'Image' | 'Video' | 'Audio' | 'Document' }) => {
    const [caption, setCaption] = useState(node.data.caption || '');
    const [url, setUrl] = useState(node.data.url || '');
    const [fileDataUri, setFileDataUri] = useState<string | null>(node.data.fileDataUri || null);
    
    // Image crop state
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [isCropping, setIsCropping] = useState(false);
    const [imageForCropping, setImageForCropping] = useState<string | null>(node.data.fileDataUri || null);

    const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleApplyCrop = async () => {
        if (croppedAreaPixels && imageForCropping) {
            const croppedImage = await getCroppedImg(imageForCropping, croppedAreaPixels);
            if (croppedImage) {
                setFileDataUri(croppedImage);
            }
            setIsCropping(false);
            setImageForCropping(null);
        }
    };


    useEffect(() => {
        onDataChange({ ...node.data, caption, url, fileDataUri });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [caption, url, fileDataUri]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                if (mediaType === 'Image') {
                    setImageForCropping(result);
                    setIsCropping(true);
                } else {
                    setFileDataUri(result);
                    setUrl(''); // Clear URL field when uploading
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const getHelperText = () => {
        switch (mediaType) {
            case 'Image':
                return 'PNG, JPG, GIF up to 10MB';
            case 'Video':
                return 'MP4, 3GPP up to 16MB';
             case 'Audio':
                return 'MP3, OGG, AMR up to 16MB';
            case 'Document':
                return 'PDF, DOCX, XLSX up to 100MB';
            default:
                return 'File size limits apply';
        }
    }

    if (isCropping) {
        return (
            <div className="relative h-[500px] flex flex-col">
                 <DialogHeader>
                    <DialogTitle>Crop Image</DialogTitle>
                </DialogHeader>
                <div className="relative flex-grow bg-gray-800 my-4">
                     {imageForCropping && <Cropper
                        image={imageForCropping}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                    />}
                </div>
                <div className="space-y-4">
                     <div className="flex items-center gap-2">
                        <Label>Zoom</Label>
                        <Slider
                            value={[zoom]}
                            min={1}
                            max={3}
                            step={0.1}
                            onValueChange={(vals) => setZoom(vals[0])}
                         />
                    </div>
                    <div className="flex justify-end gap-2">
                         <Button variant="outline" onClick={() => setIsCropping(false)}>Cancel</Button>
                        <Button onClick={handleApplyCrop}>Apply Crop</Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <>
            <DialogHeader>
                <DialogTitle>Send an {mediaType}</DialogTitle>
                <Separator className="my-4" />
            </DialogHeader>
            <Tabs defaultValue="upload" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload">Upload</TabsTrigger>
                    <TabsTrigger value="url">URL</TabsTrigger>
                </TabsList>
                <TabsContent value="upload">
                    <div className="mt-4 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
                        <div className="text-center">
                            <UploadCloud className="mx-auto h-12 w-12 text-gray-300" aria-hidden="true" />
                            <div className="mt-4 flex text-sm leading-6 text-gray-600">
                                <label
                                    htmlFor="file-upload"
                                    className="relative cursor-pointer rounded-md bg-white font-semibold text-green-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-green-600 focus-within:ring-offset-2 hover:text-green-500"
                                >
                                    <span>Upload a file</span>
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange}/>
                                </label>
                                <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs leading-5 text-gray-600">{getHelperText()}</p>
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="url">
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="media-url">{mediaType} URL</Label>
                            <Input
                                id="media-url"
                                value={url}
                                onChange={(e) => {
                                    setUrl(e.target.value)
                                    setFileDataUri(e.target.value)
                                }}
                                placeholder={`https://example.com/your-${mediaType.toLowerCase()}.png`}
                            />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
            
            {fileDataUri && (
                 <div className="mt-4">
                    <Label>Preview</Label>
                    {mediaType === 'Image' ? (
                        <div className="mt-2">
                            <div className="rounded-md border relative w-48 h-48 bg-muted">
                                <Image 
                                    src={fileDataUri} 
                                    alt="Image Preview"
                                    fill
                                    className="object-contain rounded-md"
                                />
                            </div>
                            <Button variant="outline" size="sm" className="mt-2" onClick={() => {
                                setImageForCropping(fileDataUri);
                                setIsCropping(true);
                            }}>
                                <Crop className="mr-2 h-4 w-4" />
                                Crop Image
                            </Button>
                        </div>
                     ) : (
                         <div className="mt-2 flex items-center gap-3 rounded-md border p-3 bg-muted">
                             <FileIcon className="h-8 w-8 text-gray-500" />
                             <div className="truncate">
                                <p className="text-sm font-medium truncate">
                                    {caption || `${mediaType} file attached`}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {url ? 'From URL' : 'Uploaded file'}
                                </p>
                             </div>
                         </div>
                     )}
                </div>
            )}

            <div className="space-y-2 mt-4">
                <Label htmlFor="caption">Caption (optional)</Label>
                <Textarea
                    id="caption"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Type your caption here..."
                    rows={3}
                />
            </div>
        </>
    )
};


// Helper component for Time Delay node settings
const TimeDelaySettings = ({ node, onDataChange }: { node: Node, onDataChange: (data: any) => void }) => {
    const [minutes, setMinutes] = useState(node.data.minutes || 0);
    const [seconds, setSeconds] = useState(node.data.seconds || 1);

    useEffect(() => {
        onDataChange({ ...node.data, minutes, seconds });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [minutes, seconds]);

    const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value, 10);
        if (!isNaN(val) && val >= 0 && val <= 10) {
            setMinutes(val);
        } else if (e.target.value === '') {
            setMinutes(0);
        }
    };

    const handleSecondsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value, 10);
        if (!isNaN(val) && val >= 0 && val <= 59) {
            setSeconds(val);
        } else if (e.target.value === '') {
            setSeconds(0);
        }
    };


    return (
        <>
            <DialogHeader>
                <DialogTitle>Set Time Delay</DialogTitle>
                <Separator className='my-4' />
            </DialogHeader>
            <div className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground">
                    Set a delay from 0:00 to 10:00 minutes
                </p>
                <div className="flex items-center gap-4">
                    <div className='flex items-center gap-2'>
                        <Input
                            id="minutes"
                            type="number"
                            min="0"
                            max="10"
                            value={minutes}
                            onChange={handleMinutesChange}
                            className="w-24 text-center"
                        />
                        <Label htmlFor="minutes">min</Label>
                    </div>
                     <div className='flex items-center gap-2'>
                        <Input
                            id="seconds"
                            type="number"
                            min="0"
                            max="59"
                            value={seconds}
                            onChange={handleSecondsChange}
                            className="w-24 text-center"
                        />
                        <Label htmlFor="seconds">sec</Label>
                    </div>
                </div>
            </div>
        </>
    );
};

type TestResult = { status: number; statusText: string; body: any } | { error: string } | null;

// Helper component for Webhook node settings
const WebhookSettings = ({ node, onDataChange }: { node: Node, onDataChange: (data: any) => void }) => {
    const [isTesting, startTestTransition] = useTransition();
    const [method, setMethod] = useState(node.data.method || 'GET');
    const [url, setUrl] = useState(node.data.url || 'https://');
    const [headers, setHeaders] = useState(node.data.headers || '');
    const [body, setBody] = useState(node.data.body || '');
    const [customizeHeaders, setCustomizeHeaders] = useState(node.data.customizeHeaders || false);
    const [customizeBody, setCustomizeBody] = useState(node.data.customizeBody || false);
    const [testResult, setTestResult] = useState<TestResult>(null);

    useEffect(() => {
        onDataChange({
            ...node.data,
            method,
            url,
            headers,
            body,
            customizeHeaders,
            customizeBody,
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [method, url, headers, body, customizeHeaders, customizeBody]);

    const handleTestRequest = () => {
        startTestTransition(async () => {
            setTestResult(null);
            const result = await testWebhookAction({ method, url, headers, body });
            setTestResult(result);
        });
    }

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold">URL & Method</h3>
            <div className="flex gap-2">
                <Select value={method} onValueChange={(value) => setMethod(value as any)}>
                    <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Method" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                        <SelectItem value="DELETE">DELETE</SelectItem>
                        <SelectItem value="PATCH">PATCH</SelectItem>
                    </SelectContent>
                </Select>
                <Input
                    type="text"
                    placeholder="https://"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="flex-1"
                />
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                    Variables
                </Button>
            </div>
            <Separator />

            <div>
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Customize Headers</h3>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Optional</span>
                        <Switch checked={customizeHeaders} onCheckedChange={setCustomizeHeaders} />
                    </div>
                </div>
                 {customizeHeaders && (
                    <div className="mt-2 space-y-2">
                        <Label htmlFor="headers-input">Headers (JSON)</Label>
                        <Textarea 
                            id="headers-input"
                            placeholder='{ "Authorization": "Bearer ..." }'
                            value={headers}
                            onChange={(e) => setHeaders(e.target.value)}
                            rows={4}
                        />
                    </div>
                )}
            </div>
            <Separator />

            <div>
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Customize Body</h3>
                     <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Optional</span>
                        <Switch checked={customizeBody} onCheckedChange={setCustomizeBody} />
                    </div>
                </div>
                 {customizeBody && (
                    <div className="mt-2 space-y-2">
                        <Label htmlFor="body-input">Body (JSON)</Label>
                        <Textarea 
                            id="body-input"
                            placeholder='{ "key": "value" }'
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            rows={6}
                        />
                    </div>
                )}
            </div>
            <Separator />

            <div>
                <h3 className="text-lg font-semibold">Test Request</h3>
                <div className="flex items-center justify-between mt-2">
                    <p className="text-sm text-muted-foreground">
                        Send a request to the URL to test your webhook.
                    </p>
                    <Button onClick={handleTestRequest} disabled={isTesting}>
                        {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Test Request
                    </Button>
                </div>
                {isTesting && (
                    <div className="mt-4 p-4 border rounded-md bg-muted/50">
                        <p className="text-sm text-muted-foreground">Testing...</p>
                    </div>
                )}
                {testResult && (
                    <div className="mt-4">
                        {'error' in testResult ? (
                             <Alert variant="destructive">
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{testResult.error}</AlertDescription>
                            </Alert>
                        ) : (
                            <Alert>
                                <AlertTitle>
                                    Status: <span className={testResult.status >= 200 && testResult.status < 300 ? 'text-green-600' : 'text-red-600'}>{testResult.status} {testResult.statusText}</span>
                                </AlertTitle>
                                <AlertDescription>
                                    <pre className="mt-2 w-full whitespace-pre-wrap rounded-md bg-muted p-2 font-mono text-xs">
                                        {JSON.stringify(testResult.body, null, 2)}
                                    </pre>
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                )}
            </div>

        </div>
    );
};

// Helper component for Template node settings
const TemplateSettings = ({ node, onDataChange }: { node: Node, onDataChange: (data: any) => void }) => {
    const [selectedTemplate, setSelectedTemplate] = useState(node.data.template || '');

    useEffect(() => {
        onDataChange({ ...node.data, template: selectedTemplate });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTemplate]);

    return (
        <>
            <DialogHeader>
                <DialogTitle>Message Template</DialogTitle>
                 <Separator className='my-4' />
            </DialogHeader>
            <div className="space-y-4 py-4">
                 <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="template1">Welcome Message</SelectItem>
                        <SelectItem value="template2">Order Confirmation</SelectItem>
                        <SelectItem value="template3">Shipping Update</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </>
    );
};


// Helper component for Set Tags node settings
const SetTagsSettings = ({ node, onDataChange }: { node: Node, onDataChange: (data: any) => void }) => {
    const [selectedTag, setSelectedTag] = useState(node.data.tag || '');

    useEffect(() => {
        onDataChange({ ...node.data, tag: selectedTag });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTag]);

    return (
        <>
            <DialogHeader>
                <DialogTitle>Set tags</DialogTitle>
                 <Separator className='my-4' />
            </DialogHeader>
            <div className="space-y-4 py-4">
                 <Select value={selectedTag} onValueChange={setSelectedTag}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select tags" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="vip">VIP</SelectItem>
                        <SelectItem value="new-customer">New Customer</SelectItem>
                        <SelectItem value="interested">Interested</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </>
    );
};

// Helper component for Update Attribute node settings
const UpdateAttributeSettings = ({ node, onDataChange }: { node: Node, onDataChange: (data: any) => void }) => {
    const [attribute, setAttribute] = useState(node.data.attribute || '');
    const [value, setValue] = useState(node.data.value || '');

    useEffect(() => {
        onDataChange({ ...node.data, attribute, value });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [attribute, value]);

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Update Attribute</h3>
            <div className="space-y-2">
                <Label htmlFor="attr-name">Attribute Name</Label>
                <Input 
                    id="attr-name"
                    value={attribute}
                    onChange={(e) => setAttribute(e.target.value)}
                    placeholder="e.g., email"
                />
            </div>
             <div className="space-y-2">
                <Label htmlFor="attr-value">Value</Label>
                <Input 
                    id="attr-value"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Type value or select a variable"
                />
                 <Button size="sm" variant="outline" className="mt-1">
                    Variables
                </Button>
            </div>
        </div>
    );
};

// Helper component for Update Chat Status node settings
const UpdateChatStatusSettings = ({ node, onDataChange }: { node: Node, onDataChange: (data: any) => void }) => {
    const [status, setStatus] = useState(node.data.status || 'open');

    useEffect(() => {
        onDataChange({ ...node.data, status });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    return (
        <>
            <DialogHeader>
                <DialogTitle>Update Chat Status</DialogTitle>
                 <Separator className='my-4' />
            </DialogHeader>
            <div className="space-y-4 py-4">
                 <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </>
    );
};

const AssignUserSettings = ({ node, onDataChange }: { node: Node, onDataChange: (data: any) => void }) => {
    const [selectedUser, setSelectedUser] = useState(node.data.user || '');

    useEffect(() => {
        onDataChange({ ...node.data, user: selectedUser });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedUser]);

    return (
        <>
            <DialogHeader>
                <DialogTitle>Assign User</DialogTitle>
                 <Separator className='my-4' />
            </DialogHeader>
            <div className="space-y-4 py-4">
                 <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="user1">John Doe</SelectItem>
                        <SelectItem value="user2">Jane Smith</SelectItem>
                        <SelectItem value="user3">Agent 3</SelectItem>
                    </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-2">Assigned User</p>
            </div>
        </>
    );
};


const GoogleSpreadsheetSettings = ({ node, onDataChange }: { node: Node, onDataChange: (data: any) => void }) => {
    const [isPending, startTransition] = useTransition();

    const handleAddAccount = () => {
        startTransition(async () => {
            const { url, error } = await getGoogleAuthUrl();
            if (url) {
                // Redirect user to Google's consent screen
                window.location.href = url;
            } else {
                console.error("Could not get Google Auth URL:", error);
                // You should probably show a toast notification here
            }
        });
    }

    return (
        <>
            <DialogHeader>
                <DialogTitle>Google Spreadsheet</DialogTitle>
                <Separator className="my-4" />
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label>Google Account</Label>
                    <div className='mt-2'>
                         <Button 
                            onClick={handleAddAccount}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            disabled={isPending}
                        >
                             {isPending ? "Connecting..." : "Add new Google Account"}
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
};


export function NodeSettingsModal() {
  const { nodes, modalNodeId, closeNodeModal, updateNodeData } = useFlowStore();
  const [currentNode, setCurrentNode] = useState<Node | null>(null);

  useEffect(() => {
    if (modalNodeId) {
      const node = nodes.find((n) => n.id === modalNodeId);
      setCurrentNode(node ? { ...node, data: { ...node.data } } : null);
    } else {
      setCurrentNode(null);
    }
  }, [modalNodeId, nodes]);

  const handleDataChange = (newData: any) => {
    if (currentNode) {
      setCurrentNode(produce(currentNode, draft => {
        if (draft) {
          draft.data = { ...draft.data, ...newData };
        }
      }));
    }
  };

  const handleSave = () => {
    if (currentNode) {
      updateNodeData(currentNode.id, currentNode.data);
      closeNodeModal();
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      closeNodeModal();
    }
  };
  
  const renderGenericSettings = () => {
    if (!currentNode) return null;
    return (
        <div className="grid gap-4 py-4">
          <DialogHeader>
            <DialogTitle>Edit Node: {currentNode.data.type}</DialogTitle>
            <DialogDescription>
                Modify the configuration for this node.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="node-id">Node ID</Label>
            <Input
              id="node-id"
              value={currentNode.id}
              readOnly
              className="bg-muted"
            />
          </div>
           <div className="space-y-2">
            <Label htmlFor="node-description">Description</Label>
             <Textarea
                id="node-description"
                value={currentNode.data.description || ''}
                readOnly
                className="bg-muted"
              />
          </div>
          
          <div className="space-y-2">
            <Label>Specific Settings</Label>
            <div className="p-4 border rounded-md bg-muted/50">
                <p>This node has no special configuration.</p>
            </div>
          </div>
        </div>
    );
  }

  const renderNodeSettings = () => {
    if (!currentNode) return null;

    switch (currentNode.data.type) {
      case 'message':
        return <MessageSettings node={currentNode} onDataChange={handleDataChange} />;
      case 'question':
        return <QuestionSettings node={currentNode} onDataChange={handleDataChange} />;
      case 'condition':
        return <ConditionSettings node={currentNode} onDataChange={handleDataChange} />;
      case 'image':
        return <MediaSettings node={currentNode} onDataChange={handleDataChange} mediaType="Image" />;
      case 'video':
        return <MediaSettings node={currentNode} onDataChange={handleDataChange} mediaType="Video" />;
      case 'audio':
        return <MediaSettings node={currentNode} onDataChange={handleDataChange} mediaType="Audio" />;
      case 'document':
        return <MediaSettings node={currentNode} onDataChange={handleDataChange} mediaType="Document" />;
      case 'time_delay':
        return <TimeDelaySettings node={currentNode} onDataChange={handleDataChange} />;
      case 'webhook':
         return <WebhookSettings node={currentNode} onDataChange={handleDataChange} />;
      case 'template':
        return <TemplateSettings node={currentNode} onDataChange={handleDataChange} />;
      case 'set_tags':
        return <SetTagsSettings node={currentNode} onDataChange={handleDataChange} />;
       case 'update_attribute':
        return <UpdateAttributeSettings node={currentNode} onDataChange={handleDataChange} />;
      case 'google_spreadsheet':
        return <GoogleSpreadsheetSettings node={currentNode} onDataChange={handleDataChange} />;
       case 'update_chat_status':
        return <UpdateChatStatusSettings node={currentNode} onDataChange={handleDataChange} />;
      case 'assign_user':
        return <AssignUserSettings node={currentNode} onDataChange={handleDataChange} />;
      default:
        return renderGenericSettings();
    }
  };

  if (!currentNode) {
    return null;
  }

  const isWebhookModal = currentNode.data.type === 'webhook';
  const isUpdateAttributeModal = currentNode.data.type === 'update_attribute';
  
  const isCropping = (currentNode.data as any).isCropping; // A bit of a hack, but will do for now

  if (isWebhookModal || isUpdateAttributeModal) {
    const title = isWebhookModal ? 'Webhook' : 'Update Attribute';
    return (
       <Dialog open={!!modalNodeId} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                 <DialogHeader className='flex-row justify-between items-center'>
                    <DialogTitle className='text-xl'>{title}</DialogTitle>
                     <Button variant="ghost" size="icon" onClick={closeNodeModal} className="shrink-0">
                        <X className="h-5 w-5" />
                        <span className="sr-only">Close</span>
                    </Button>
                </DialogHeader>
                <Separator />
                <div className="py-4 max-h-[70vh] overflow-y-auto pr-2">
                    {renderNodeSettings()}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={closeNodeModal}>Cancel</Button>
                    <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white">Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
  }

  let dialogContentClassName = "sm:max-w-lg";
  if (currentNode.data.type === 'image' && (currentNode as any).isCropping) {
    dialogContentClassName = "sm:max-w-2xl";
  }


  return (
    <Dialog open={!!modalNodeId} onOpenChange={handleOpenChange}>
      <DialogContent className={dialogContentClassName}>
        {renderNodeSettings()}
        { !isCropping && (<DialogFooter>
          <Button variant="outline" onClick={closeNodeModal}>Cancel</Button>
          <Button 
            onClick={handleSave}
            className={'bg-green-600 hover:bg-green-700 text-white'}
          >
            Save
          </Button>
        </DialogFooter>)}
      </DialogContent>
    </Dialog>
  );
}

    