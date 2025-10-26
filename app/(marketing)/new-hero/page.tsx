import Header from '@/components/marketing/Header';
import Hero from '@/components/marketing/Hero';
import CategoryRibbon from '@/components/marketing/CategoryRibbon';
import Footer from '@/components/marketing/Footer';

export default function NewHeroPage() {
  return (
    <>
      <Header />
      <main role="main" className="relative flex min-h-[calc(100vh-4rem)] flex-col">
        <Hero />
      </main>
      <CategoryRibbon />
      <Footer />
    </>
  );
}
