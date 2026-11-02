import type { Metadata } from 'next';
import LandingPageClient from './components/landing/LandingPageClient';

export const metadata: Metadata = {
  title: 'HOGANA — Smart Bus Operations & Mobility Intelligence',
  description:
    'A bus can be tracked. A service gap needs to be managed. HOGANA turns transport operations data into clear headway, bunching, crowding and service-gap insights—helping operations teams evaluate practical responses and make better-informed decisions.',
};

export default function Home() {
  return <LandingPageClient />;
}
