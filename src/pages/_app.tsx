import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useEffect, useState } from 'react';
import { Toaster } from '../components/ui/toaster';
import { AuthProvider } from '../context/AuthContext';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isAdminPage = router.pathname.startsWith('/admin');
  const isEventRegistrationPage = router.pathname.includes('/events/') && router.pathname.includes('/register');
  const isAuthPage = router.pathname === '/login' || router.pathname === '/register';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const content = (
    <AuthProvider>
      <Head>
        <title>Visitrack - Event Management Platform</title>
        <meta name="description" content="Visitrack - Your comprehensive event management solution" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="shortcut icon" type="image/x-icon" href="/favicon.ico" />
      </Head>
      {isAdminPage || isEventRegistrationPage || isAuthPage ? (
        <Component {...pageProps} />
      ) : (
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-grow pt-20">
            <Component {...pageProps} />
          </main>
          <Footer />
        </div>
      )}
      <Toaster />
    </AuthProvider>
  );

  // Show loading spinner instead of null during SSR
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return content;
}

export default MyApp; 