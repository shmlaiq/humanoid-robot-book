import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  bookSidebar: [
    {
      type: 'doc',
      id: 'cover',
      label: 'Book Cover',
    },
    {
      type: 'doc',
      id: 'about-author',
      label: 'About the Author',
    },
    {
      type: 'doc',
      id: 'intro',
      label: 'About This Book',
    },
    {
      type: 'category',
      label: 'Part I — The Humanoid Revolution',
      collapsed: false,
      items: [
        'part1/chapter-01-physical-ai',
        'part1/chapter-02-embodied-intelligence',
      ],
    },
    {
      type: 'category',
      label: 'Part II — The Robotic Nervous System',
      collapsed: true,
      items: [
        'part2/chapter-03-ros2-architecture',
        'part2/chapter-04-rclpy-control',
        'part2/chapter-05-sros2-security',
      ],
    },
    {
      type: 'category',
      label: 'Part III — Digital Twins',
      collapsed: true,
      items: [
        'part3/chapter-06-gazebo',
        'part3/chapter-07-unity-hri',
        'part3/chapter-08-isaac-sim',
      ],
    },
    {
      type: 'category',
      label: 'Part IV — The AI Brain (NVIDIA Isaac)',
      collapsed: true,
      items: [
        'part4/chapter-09-isaac-ros',
        'part4/chapter-10-jetson-deployment',
      ],
    },
    {
      type: 'category',
      label: 'Part V — Vision-Language-Action Systems',
      collapsed: true,
      items: [
        'part5/chapter-11-vla-systems',
        'part5/chapter-12-voice-to-action',
      ],
    },
    {
      type: 'category',
      label: 'Part VI — Benefits in Human Life',
      collapsed: true,
      items: [
        'part6/chapter-13-benefits',
      ],
    },
    {
      type: 'category',
      label: 'Part VII — Risks and Threats',
      collapsed: true,
      items: [
        'part7/chapter-14-risks-threats',
      ],
    },
    {
      type: 'category',
      label: 'Part VIII — Ethics and Policy',
      collapsed: true,
      items: [
        'part8/chapter-15-ethics-policy',
      ],
    },
  ],
};

export default sidebars;
