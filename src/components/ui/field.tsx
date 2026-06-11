"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
function FieldSet({ className, ...props }: React.ComponentProps<"fieldset">) {
  return (
    <fieldset
      data-slot="field-set"
      className={cn("space-y-4 rounded-lg border p-4", className)}
      {...props}
    />
  )
}
function FieldLegend({ className, ...props }: React.ComponentProps<"legend">) {
  return (
    <legend
      data-slot="field-legend"
      className={cn("px-1 text-sm font-semibold text-foreground", className)}
      {...props}
    />
  )
}
function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="field-group" className={cn("grid gap-4", className)} {...props} />
}

function Field({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="field" className={cn("flex flex-col justify-between gap-2", className)} {...props} />
}
function FieldLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
  return <Label data-slot="field-label" className={cn(className)} {...props} />
}
function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-description"
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}
function FieldError({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p data-slot="field-error" className={cn("text-xs text-destructive", className)} {...props} />
  )
}
export {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
}
