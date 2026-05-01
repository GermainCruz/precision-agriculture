'use client'

import { useToast } from '@/hooks/use-toast'
import { Toast } from './toast'

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80">
      {toasts.map((t) => (
        <Toast
          key={t.id}
          title={t.title}
          description={t.description}
          variant={t.variant as any}
          onClose={() => dismiss(t.id)}
        />
      ))}
    </div>
  )
}
