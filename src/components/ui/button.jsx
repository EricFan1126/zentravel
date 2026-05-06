import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-graphite text-cloud-white hover:bg-graphite/90',
        soft:    'bg-morandi-blue/15 text-morandi-blue hover:bg-morandi-blue/20',
        ghost:   'text-graphite-soft hover:text-graphite hover:bg-divider/40',
        link:    'text-morandi-blue underline-offset-4 hover:underline',
        outline: 'border border-divider bg-cloud-white text-graphite hover:bg-divider/30',
      },
      size: {
        default: 'h-10 px-5',
        sm:      'h-8 px-3 text-xs',
        lg:      'h-12 px-6 text-base',
        icon:    'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export const Button = React.forwardRef(function Button(
  { className, variant, size, asChild = false, ...props },
  ref,
) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
})
