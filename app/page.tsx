import Loader from '@/components/Loader';
import Header from '@/components/Header';
import Hero from '@/components/sections/Hero';
import Manifesto from '@/components/sections/Manifesto';
import DayRail from '@/components/sections/DayRail';
import Location from '@/components/sections/Location';
import Panorama from '@/components/sections/Panorama';
import Grounds from '@/components/sections/Grounds';
import Space from '@/components/sections/Space';
import Interiors from '@/components/sections/Interiors';
import Plan from '@/components/sections/Plan';
import Residences from '@/components/sections/Residences';
import Architecture from '@/components/sections/Architecture';
import Visit from '@/components/sections/Visit';
import Footer from '@/components/sections/Footer';

export default function Home() {
  return (
    <>
      <Loader />
      <Header />
      <main>
        <Hero />
        <Manifesto />
        <DayRail />
        <Location />
        <Panorama />
        <Grounds />
        <Space />
        <Interiors />
        <Plan />
        <Residences />
        <Architecture />
        <Visit />
      </main>
      <Footer />
    </>
  );
}
