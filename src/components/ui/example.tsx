"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export function ShadcnExample() {
  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>shadcn/ui Components</CardTitle>
        <CardDescription>Testing our component setup</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input placeholder="Enter your name" />
        <div className="flex gap-2">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
        </div>
        <Button variant="destructive" className="w-full">
          Destructive
        </Button>
      </CardContent>
    </Card>
  )
}