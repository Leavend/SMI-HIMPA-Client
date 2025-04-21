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
    label: 'Backlog',
    icon: h(Icon, { name: 'i-radix-icons-question-mark-circled' }),
  },
  {
    value: 'Out of Stock',
    label: 'Todo',
    icon: h(Icon, { name: 'i-radix-icons-circle' }),
  },
  {
    value: 'Reserved',
    label: 'Reserved',
    icon: h(Icon, { name: 'i-radix-icons-stopwatch' }),
  },
  {
    value: 'Damaged',
    label: 'Damaged',
    icon: h(Icon, { name: 'i-radix-icons-check-circled' }),
  },
  {
    value: 'Discontinued',
    label: 'Discontinued',
    icon: h(Icon, { name: 'i-radix-icons-cross-circled' }),
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
