
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';

export default function BusinessProfilePage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile picture</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <Image
              src="https://placehold.co/100x100.png"
              alt="WATI Logo"
              width={100}
              height={100}
              className="rounded-full"
              data-ai-hint="logo company"
            />
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              Change profile picture
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact information</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
              <Label htmlFor="phone">Phone number</Label>
              <Input id="phone" defaultValue="+1 123 456 7890" readOnly />
            </div>
            <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
              <Label htmlFor="about">About</Label>
              <Textarea
                id="about"
                defaultValue="WATi.io - WhatsApp Official API Partner"
                readOnly
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Address and Description</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
              <Label htmlFor="address">Business address</Label>
              <Textarea
                id="address"
                placeholder="Enter your business address"
                defaultValue="123 Main Street, San Francisco, CA 94105"
                readOnly
              />
            </div>
            <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
              <Label htmlFor="description">Business description</Label>
              <Textarea
                id="description"
                placeholder="Enter a description for your business"
                defaultValue="WATI Trial Sandbox"
                readOnly
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
