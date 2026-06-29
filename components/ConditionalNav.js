'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';

/**
 * Renders Navbar and Footer for all routes except /admin/*.
 * Used in the root layout to avoid Navbar/Footer on the admin shell.
 */
export default function ConditionalNav({ children }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  return (
    <>
      {!isAdmin && <Navbar />}
      {children}
      {!isAdmin && <Footer />}
    </>
  );
}
