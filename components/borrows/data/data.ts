import { Icon } from '#components'
import { h } from 'vue'

export const borrowStatuses = [
  {
    value: 'PENDING',
    label: 'Pending',
    icon: h(Icon, { name: 'i-radix-icons-clock' }),
  },
  {
    value: 'ACTIVE',
    label: 'Active',
    icon: h(Icon, { name: 'i-radix-icons-rocket' }),
  },
  {
    value: 'REJECTED',
    label: 'Rejected',
    icon: h(Icon, { name: 'i-radix-icons-cross-circled' }),
  },
  {
    value: 'RETURNED',
    label: 'Returned',
    icon: h(Icon, { name: 'i-radix-icons-check-circled' }),
  },
]

export const priorities = [
  {
    value: 'low',
    label: 'Low',
    icon: h(Icon, { name: 'i-radix-icons-arrow-down' }),
  },
  {
    value: 'medium',
    label: 'Medium',
    icon: h(Icon, { name: 'i-radix-icons-arrow-right' }),
  },
  {
    value: 'high',
    label: 'High',
    icon: h(Icon, { name: 'i-radix-icons-arrow-up' }),
  },
]
