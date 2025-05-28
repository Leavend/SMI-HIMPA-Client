import { Icon } from '#components'
import { h } from 'vue'

export const labels = [
  {
    value: 'bug',
    label: 'Bug',
  },
  {
    value: 'feature',
    label: 'Feature',
  },
  {
    value: 'documentation',
    label: 'Documentation',
  },
]

export const conditions = [
  {
    value: 'Available',
    label: 'Available',
    icon: h(Icon, { name: 'i-radix-icons-check-circled' }),
  },
  {
    value: 'Out of Stock',
    label: 'Out of Stock',
    icon: h(Icon, { name: 'i-radix-icons-exclamation-triangle' }),
  },
  {
    value: 'Reserved',
    label: 'Reserved',
    icon: h(Icon, { name: 'i-radix-icons-clock' }),
  },
  {
    value: 'Damaged',
    label: 'Damaged',
    icon: h(Icon, { name: 'i-radix-icons-crumpled-paper' }),
  },
  {
    value: 'Discontinued',
    label: 'Discontinued',
    icon: h(Icon, { name: 'i-radix-icons-archive' }),
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
