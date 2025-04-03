
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { NotificationCenter } from "@/components/notifications/NotificationCenter"
import { useAuth } from "@/contexts/AuthContext"

export function Toaster() {
  const { toasts } = useToast()
  const { user } = useAuth()
  const isAuthenticated = !!user.get()

  return (
    <>
      {isAuthenticated && (
        <div className="fixed top-0 right-0 z-50 p-4">
          <NotificationCenter />
        </div>
      )}
      <ToastProvider>
        {toasts.map(function ({ id, title, description, action, ...props }) {
          return (
            <Toast key={id} {...props}>
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
              {action}
              <ToastClose />
            </Toast>
          )
        })}
        <ToastViewport />
      </ToastProvider>
    </>
  )
}
