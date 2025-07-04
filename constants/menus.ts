import type { NavMenu, NavMenuItems } from '~/types/nav'

export const navMenu: NavMenu[] = [
  {
    heading: 'Umum',
    items: [
      {
        title: 'Beranda',
        icon: 'i-lucide-home',
        link: '/dashboard',
      },
      // {
      //   title: 'Email',
      //   icon: 'i-lucide-mail',
      //   link: '/email',
      // },
    ],
  },
  {
    heading: 'Halaman',
    items: [
      {
        title: 'Layanan',
        icon: 'i-lucide-book',
        children: [
          {
            title: 'Pinjam',
            icon: 'i-lucide-circle',
            link: '/services/borrow',
          },
          {
            title: 'Kembalikan',
            icon: 'i-lucide-circle',
            link: '/services/return',
          },
        ],
      },
      // {
      //   title: 'Settings',
      //   icon: 'i-lucide-settings',
      //   new: true,
      //   children: [
      //     {
      //       title: 'Profile',
      //       icon: 'i-lucide-circle',
      //       link: '/settings/profile',
      //     },
      //     {
      //       title: 'Account',
      //       icon: 'i-lucide-circle',
      //       link: '/settings/account',
      //     },
      //     {
      //       title: 'Appearance',
      //       icon: 'i-lucide-circle',
      //       link: '/settings/appearance',
      //     },
      //     {
      //       title: 'Notifications',
      //       icon: 'i-lucide-circle',
      //       link: '/settings/notifications',
      //     },
      //     {
      //       title: 'Display',
      //       icon: 'i-lucide-circle',
      //       link: '/settings/display',
      //     },
      //   ],
      // },
    ],
  },
]

export const navMenuBottom: NavMenuItems = [
  {
    title: 'Tentang',
    icon: 'i-lucide-circle-help',
    link: '/',
  },
]
