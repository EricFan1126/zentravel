import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close

export const DialogContent = React.forwardRef(function DialogContent(
  { className, children, ...props },
  ref,
) {
  return (
    <DialogPrimitive.Portal>
      {/* 背景遮罩 */}
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-graphite/30 backdrop-blur-sm data-[state=open]:animate-fade-in" />
      {/* Content：fixed 水平置中，垂直從頂部留 5vh，高度限 90vh 可 scroll */}
      <DialogPrimitive.Content
        ref={ref}
        style={{
          position: 'fixed',
          top: '5vh',
          left: 0,
          right: 0,
          marginLeft: 'auto',
          marginRight: 'auto',
          width: '92vw',
          maxWidth: '28rem',
          maxHeight: '90vh',
          overflowY: 'auto',
          zIndex: 50,
        }}
        className={cn(
          'bg-cloud-white rounded-2xl shadow-zen-lg p-6',
          'data-[state=open]:animate-fade-in-up',
          'scrollbar-zen',
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          className="absolute right-4 top-4 text-graphite-soft hover:text-graphite transition-colors"
          aria-label="關閉"
        >
          <X className="h-4 w-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
})

export const DialogHeader = ({ className, ...props }) => (
  <div className={cn('flex flex-col gap-1 mb-4', className)} {...props} />
)

export const DialogTitle = React.forwardRef(function DialogTitle({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn('text-lg font-medium text-graphite', className)}
      {...props}
    />
  )
})

export const DialogDescription = React.forwardRef(function DialogDescription({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cn('text-sm text-graphite-soft', className)}
      {...props}
    />
  )
})
