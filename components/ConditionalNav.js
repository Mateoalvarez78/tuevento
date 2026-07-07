'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';

/**
 * Renders the client Navbar/Footer only on the marketplace (client) area.
 * Hidden on the provider portal (/provider/*, /dashboard/proveedor) and the
 * admin backoffice (/admin/*), which have their own chrome.
 */
export default function ConditionalNav({ children }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');
  const isProvider = pathname?.startsWith('/provider') || pathname?.startsWith('/dashboard/proveedor');

  const hideChrome = isAdmin || isProvider;

  return (
    <>
      {!hideChrome && <Navbar />}
      {children}
      {!hideChrome && <Footer />}
    </>
  );
}
