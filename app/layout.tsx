import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Intervals ➜ TrainingPeaks Sync',
  description: 'Sincronizador automático de treinos e arquivos FIT do Intervals.icu para o TrainingPeaks.',
  openGraph: {
    title: 'Intervals ➜ TrainingPeaks Sync',
    description: 'Sincronizador automático de treinos e arquivos FIT do Intervals.icu para o TrainingPeaks.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Intervals ➜ TrainingPeaks Sync',
    description: 'Sincronizador automático de treinos e arquivos FIT do Intervals.icu para o TrainingPeaks.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
