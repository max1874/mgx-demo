import { Toaster as Sonner } from "sonner"
import { cn } from "@/lib/utils"

type ToasterProps = React.ComponentProps<typeof Sonner>

const baseToastClassNames = {
  toast:
    "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
  description: "group-[.toast]:text-muted-foreground",
  actionButton:
    "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
  cancelButton:
    "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
}

const Toaster = ({
  className,
  toastOptions,
  theme = "system",
  ...props
}: ToasterProps) => (
  <Sonner
    theme={theme}
    className={cn("toaster group", className)}
    toastOptions={{
      ...toastOptions,
      classNames: {
        ...baseToastClassNames,
        ...(toastOptions?.classNames ?? {}),
      },
    }}
    {...props}
  />
)

export { Toaster }
