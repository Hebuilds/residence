'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { CustomEase } from 'gsap/CustomEase';
import { useGSAP } from '@gsap/react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase, useGSAP);
  // Wipes and masks: slow start, slow end, fast middle.
  CustomEase.create('sharp', 'M0,0 C0.75,0 0.25,1 1,1');
  // Reveals: arrives quickly, settles for a long time.
  CustomEase.create('settle', 'M0,0 C0.16,1 0.3,1 1,1');
}

export { gsap, ScrollTrigger, SplitText, useGSAP };
