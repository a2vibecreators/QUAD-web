'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import PageNavigation from '@/components/PageNavigation';

// Book data
const books = [
  {
    id: 'java',
    title: 'Java for the AI Era',
    subtitle: 'Working with AI in Java Development',
    emoji: '☕',
    color: 'blue',
    version: '3.0',
    chapters: 12,
    endpoint: '/api/book/download',
    filename: 'Java-for-the-AI-Era-QUAD.txt',
    topics: [
      'AI type confusion (primitives vs objects)',
      'Collection mistakes AI makes',
      'Exception handling AI gets wrong',
      'When AI uses streams vs loops incorrectly',
      'Prompting AI for Java code',
      'Review checklist for AI Java output',
    ],
  },
  {
    id: 'database',
    title: 'Database for the AI Era',
    subtitle: 'Working with AI in SQL & Schema Design',
    emoji: '🗄️',
    color: 'green',
    version: '1.0',
    chapters: 12,
    endpoint: '/api/book/database',
    filename: 'Database-for-the-AI-Era-QUAD.txt',
    topics: [
      'AI denormalization disasters',
      'Wrong JOIN types AI picks',
      'Missing indexes in AI queries',
      'Transaction mistakes AI makes',
      'Prompting AI for SQL',
      'Review checklist for AI SQL output',
    ],
  },
  {
    id: 'nextjs',
    title: 'Next.js for the AI Era',
    subtitle: 'Working with AI in React & Frontend',
    emoji: '⚛️',
    color: 'purple',
    version: '1.0',
    chapters: 12,
    endpoint: '/api/book/nextjs',
    filename: 'NextJS-for-the-AI-Era-QUAD.txt',
    topics: [
      'Server vs Client component confusion',
      'State management AI overcomplicates',
      'Data fetching patterns AI misses',
      'Accessibility issues AI ignores',
      'Prompting AI for React/Next.js',
      'Review checklist for AI components',
    ],
  },
];

export default function BookPage() {
  const { data: session, status } = useSession();
  const [downloadingBook, setDownloadingBook] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const handleDownload = async (book: typeof books[0]) => {
    if (!session) {
      window.location.href = '/auth/login?callbackUrl=/book';
      return;
    }

    setDownloadingBook(book.id);
    try {
      const response = await fetch(book.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = book.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setDownloadSuccess(book.id);
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Download failed. Please try again.');
    } finally {
      setDownloadingBook(null);
    }
  };

  const getColorClasses = (color: string) => ({
    bg: `bg-${color}-500/20`,
    text: `text-${color}-400`,
    border: `border-${color}-500/30`,
    gradient: color === 'blue'
      ? 'from-blue-600 to-blue-800'
      : color === 'green'
        ? 'from-green-600 to-emerald-800'
        : 'from-purple-600 to-violet-800',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <PageNavigation />

      {/* Hero Section */}
      <section className="relative py-16 px-8 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-5xl mx-auto relative text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-full text-sm font-medium mb-6">
            <span>📚</span>
            <span>FREE for registered users</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black mb-4">
            <span className="bg-gradient-to-r from-blue-400 via-green-400 to-purple-400 bg-clip-text text-transparent">
              For the AI Era
            </span>
          </h1>
          <p className="text-xl text-slate-300 mb-4 max-w-2xl mx-auto">
            Book Series
          </p>

          <div className="bg-slate-800/50 rounded-2xl p-6 max-w-3xl mx-auto border border-slate-700 mb-8">
            <h2 className="text-lg font-semibold text-amber-400 mb-3">These books are NOT tutorials</h2>
            <p className="text-slate-300">
              You already know Java, SQL, or React. These books teach you how to <strong className="text-white">work with AI</strong> in that domain:
              what mistakes AI makes, how to prompt effectively, how to review AI output, and how QUAD Framework applies.
            </p>
          </div>

          {!session && status !== 'loading' && (
            <Link
              href="/auth/login?callbackUrl=/book"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-semibold transition-all"
            >
              Sign In to Download Free →
            </Link>
          )}
        </div>
      </section>

      {/* Books Grid */}
      <section className="py-16 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {books.map((book) => {
              const colors = getColorClasses(book.color);
              const isDownloading = downloadingBook === book.id;
              const hasDownloaded = downloadSuccess === book.id;

              return (
                <div
                  key={book.id}
                  className={`bg-slate-800/50 rounded-2xl border ${colors.border} overflow-hidden hover:border-opacity-60 transition-all`}
                >
                  {/* Book Cover */}
                  <div className={`bg-gradient-to-br ${colors.gradient} p-8 text-center`}>
                    <div className="text-6xl mb-4">{book.emoji}</div>
                    <h3 className="text-xl font-bold text-white">{book.title}</h3>
                    <p className="text-sm text-white/70 mt-1">{book.subtitle}</p>
                    <div className="flex justify-center gap-2 mt-4">
                      <span className="px-2 py-0.5 bg-white/20 text-white rounded text-xs">v{book.version}</span>
                      <span className="px-2 py-0.5 bg-white/20 text-white rounded text-xs">{book.chapters} chapters</span>
                    </div>
                  </div>

                  {/* Topics */}
                  <div className="p-6">
                    <h4 className={`text-sm font-semibold ${colors.text} mb-3`}>What AI Gets Wrong</h4>
                    <ul className="space-y-2">
                      {book.topics.map((topic, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                          <span className={colors.text}>•</span>
                          <span>{topic}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Download Button */}
                    <div className="mt-6">
                      {session ? (
                        <button
                          onClick={() => handleDownload(book)}
                          disabled={isDownloading}
                          className={`w-full px-4 py-3 bg-gradient-to-r ${colors.gradient} hover:opacity-90 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50`}
                        >
                          {isDownloading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Downloading...</span>
                            </>
                          ) : hasDownloaded ? (
                            <>
                              <span>✓</span>
                              <span>Download Again</span>
                            </>
                          ) : (
                            <>
                              <span>📥</span>
                              <span>Download Free</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <Link
                          href="/auth/login?callbackUrl=/book"
                          className={`block w-full px-4 py-3 bg-gradient-to-r ${colors.gradient} hover:opacity-90 rounded-lg font-semibold text-center transition-all`}
                        >
                          Sign In to Download
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* What Each Book Covers */}
      <section className="py-16 px-8 bg-slate-800/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Each Book Includes</h2>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                icon: '🔴',
                title: 'AI Mistakes',
                desc: 'Real disasters and common errors AI makes in that domain (Chapters 1-8)',
              },
              {
                icon: '📝',
                title: 'Prompting',
                desc: 'How to prompt AI effectively for that technology (Chapter 9)',
              },
              {
                icon: '🔍',
                title: 'Review Checklist',
                desc: 'Catch AI mistakes before they hit production (Chapter 10)',
              },
              {
                icon: '📊',
                title: 'QUAD Framework',
                desc: 'Team workflows with Q-U-A-D stages and Adoption Matrix (Chapters 11-12)',
              },
            ].map((item) => (
              <div key={item.title} className="p-6 bg-slate-800/50 rounded-xl border border-slate-700 text-center">
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coming Soon */}
      <section className="py-16 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Coming Soon</h2>
          <p className="text-slate-400 mb-8">More books in the series planned for 2025</p>

          <div className="flex flex-wrap justify-center gap-4">
            {[
              { emoji: '🍎', title: 'iOS/Swift', status: 'Q2 2025' },
              { emoji: '🤖', title: 'Android/Kotlin', status: 'Q2 2025' },
              { emoji: '🐍', title: 'Python', status: 'Q3 2025' },
              { emoji: '🔄', title: 'Informatica/ETL', status: 'Q4 2025' },
              { emoji: '🚀', title: 'DevOps', status: 'Q4 2025' },
            ].map((book) => (
              <div
                key={book.title}
                className="px-4 py-3 bg-slate-800/50 rounded-lg border border-slate-700 flex items-center gap-3"
              >
                <span className="text-2xl">{book.emoji}</span>
                <div className="text-left">
                  <div className="font-medium text-slate-300">{book.title}</div>
                  <div className="text-xs text-slate-500">{book.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Author Section */}
      <section className="py-16 px-8 bg-slate-800/30">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-5xl shrink-0">
              👨‍💻
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">About the Series</h3>
              <p className="text-slate-300 mb-4">
                Created by the developer behind the QUAD Framework. Each book targets experienced developers
                who know the technology but need to learn how to work effectively with AI in that domain.
                The focus is on AI mistakes, prompting techniques, and review checklists - not on teaching
                the technology itself.
              </p>
              <p className="text-slate-400 text-sm">
                All books integrate the QUAD Framework for team workflows and AI adoption management.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Work Smarter with AI</h2>
          <p className="text-slate-400 mb-8">
            Download all books free. No strings attached. Start catching AI mistakes today.
          </p>

          {!session && (
            <Link
              href="/auth/login?callbackUrl=/book"
              className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-bold text-lg transition-all transform hover:scale-[1.02]"
            >
              Sign In to Download All Free →
            </Link>
          )}

          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-slate-500">
            <span>✓ TXT Format</span>
            <span>✓ 3 Books Available</span>
            <span>✓ Free Forever</span>
          </div>
        </div>
      </section>
    </div>
  );
}
