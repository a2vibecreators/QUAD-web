"use client";

import Link from "next/link";
import { useRef, useEffect, useState } from "react";

const SLIDES = [
  { id: "hero", label: "The Question" },
  { id: "problem-1", label: "Telephone Game" },
  { id: "problem-2", label: "Ceremony" },
  { id: "problem-3", label: "AI Chaos" },
  { id: "problem-4", label: "Burnout" },
  { id: "cta", label: "Solution" },
];

export default function CustomerLanding() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const slideHeight = container.clientHeight;
      const newIndex = Math.round(scrollTop / slideHeight);
      setActiveSlide(Math.min(newIndex, SLIDES.length - 1));
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const container = containerRef.current;
      if (!container) return;

      if (e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        const nextSlide = Math.min(activeSlide + 1, SLIDES.length - 1);
        container.scrollTo({
          top: nextSlide * container.clientHeight,
          behavior: "smooth",
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prevSlide = Math.max(activeSlide - 1, 0);
        container.scrollTo({
          top: prevSlide * container.clientHeight,
          behavior: "smooth",
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeSlide]);

  const scrollToSlide = (index: number) => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTo({
      top: index * container.clientHeight,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative">
      {/* Navigation Dots */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.id}
            onClick={() => scrollToSlide(i)}
            className="group flex items-center justify-end gap-2 relative"
          >
            <span
              className={`absolute right-6 whitespace-nowrap text-xs transition-opacity ${
                activeSlide === i
                  ? "opacity-100 text-white"
                  : "opacity-0 group-hover:opacity-100 text-slate-400"
              }`}
            >
              {slide.label}
            </span>
            <div
              className={`w-3 h-3 rounded-full transition-all ${
                activeSlide === i
                  ? "bg-red-500 scale-125"
                  : "bg-slate-600 hover:bg-slate-500"
              }`}
            />
          </button>
        ))}
      </div>

      {/* Keyboard hint */}
      <div className="fixed bottom-6 right-6 z-50 text-slate-500 text-xs hidden md:flex items-center gap-2">
        <span className="px-2 py-1 bg-slate-800 rounded">↑</span>
        <span className="px-2 py-1 bg-slate-800 rounded">↓</span>
        <span>to navigate</span>
      </div>

      {/* Scroll Container */}
      <div
        ref={containerRef}
        className="h-screen overflow-y-scroll snap-y snap-mandatory"
        style={{ scrollSnapType: "y mandatory" }}
      >
        {/* Slide 1: Hero - The Question */}
        <section
          id="hero"
          className="h-screen snap-start flex items-center justify-center px-4"
        >
          <div className="text-center max-w-4xl">
            <div className="inline-block px-4 py-2 bg-red-500/20 text-red-300 rounded-full text-sm mb-6">
              The Question No One Asks
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">
              Why Does a 1-Paragraph Feature{" "}
              <span className="bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent">
                Take 6 Weeks?
              </span>
            </h1>
            <p className="text-xl text-slate-400 mb-8 max-w-3xl mx-auto">
              Your BA writes a simple request. Six weeks later, after countless
              meetings, refinements, and missed deadlines, something ships.{" "}
              <strong className="text-white">
                This isn&apos;t agile. This is broken.
              </strong>
            </p>
            <div className="animate-bounce text-slate-500 mt-8">
              <span className="text-sm">Scroll to explore the problems</span>
              <div className="text-2xl">↓</div>
            </div>
          </div>
        </section>

        {/* Slide 2: Problem 1 - Telephone Game */}
        <section
          id="problem-1"
          className="h-screen snap-start flex items-center justify-center px-4 bg-gradient-to-b from-slate-900 to-red-900/20"
        >
          <div className="max-w-4xl text-center">
            <div className="w-20 h-20 bg-red-500/20 rounded-2xl flex items-center justify-center text-5xl mb-6 mx-auto">
              📞
            </div>
            <div className="text-red-400 text-sm font-bold mb-2">PROBLEM 1</div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              The Telephone Game
            </h2>
            <div className="bg-slate-800/50 rounded-2xl p-8 border border-red-500/20 text-left">
              <div className="flex flex-wrap justify-center gap-2 mb-6 text-slate-400 text-sm">
                <span className="px-3 py-1 bg-slate-700 rounded">Business</span>
                <span>→</span>
                <span className="px-3 py-1 bg-slate-700 rounded">BA</span>
                <span>→</span>
                <span className="px-3 py-1 bg-slate-700 rounded">PM</span>
                <span>→</span>
                <span className="px-3 py-1 bg-slate-700 rounded">Tech Lead</span>
                <span>→</span>
                <span className="px-3 py-1 bg-slate-700 rounded">Developer</span>
                <span>→</span>
                <span className="px-3 py-1 bg-slate-700 rounded">Code</span>
              </div>
              <p className="text-slate-300 text-lg text-center">
                By the time requirements reach the keyboard, they&apos;ve been
                translated <strong className="text-white">4 times</strong>.
              </p>
              <div className="mt-6 text-center">
                <span className="inline-block px-6 py-3 bg-red-500/20 text-red-400 rounded-xl text-2xl font-bold">
                  30-40% of work gets rejected
                </span>
                <p className="text-slate-500 mt-2">
                  &quot;That&apos;s not what we meant.&quot;
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Slide 3: Problem 2 - Ceremony Over Delivery */}
        <section
          id="problem-2"
          className="h-screen snap-start flex items-center justify-center px-4 bg-gradient-to-b from-red-900/20 to-orange-900/20"
        >
          <div className="max-w-4xl text-center">
            <div className="w-20 h-20 bg-orange-500/20 rounded-2xl flex items-center justify-center text-5xl mb-6 mx-auto">
              📅
            </div>
            <div className="text-orange-400 text-sm font-bold mb-2">
              PROBLEM 2
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Ceremony Over Delivery
            </h2>
            <div className="bg-slate-800/50 rounded-2xl p-8 border border-orange-500/20">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  "Sprint Planning",
                  "Daily Standups",
                  "Refinement",
                  "Retrospectives",
                ].map((ceremony) => (
                  <div
                    key={ceremony}
                    className="px-4 py-3 bg-orange-500/10 rounded-lg text-orange-300 text-sm"
                  >
                    {ceremony}
                  </div>
                ))}
              </div>
              <p className="text-slate-300 text-lg">
                Your teams spend{" "}
                <strong className="text-white">20% of their time</strong> talking
                about work instead of doing it.
              </p>
              <div className="mt-6">
                <span className="inline-block px-6 py-3 bg-orange-500/20 text-orange-400 rounded-xl text-xl font-bold">
                  Scrum was meant to accelerate. It became the bottleneck.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Slide 4: Problem 3 - AI Without Strategy */}
        <section
          id="problem-3"
          className="h-screen snap-start flex items-center justify-center px-4 bg-gradient-to-b from-orange-900/20 to-yellow-900/20"
        >
          <div className="max-w-4xl text-center">
            <div className="w-20 h-20 bg-yellow-500/20 rounded-2xl flex items-center justify-center text-5xl mb-6 mx-auto">
              🤖
            </div>
            <div className="text-yellow-400 text-sm font-bold mb-2">
              PROBLEM 3
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              AI Without Strategy
            </h2>
            <div className="bg-slate-800/50 rounded-2xl p-8 border border-yellow-500/20">
              <div className="flex flex-wrap justify-center gap-3 mb-6">
                {["Claude", "Copilot", "ChatGPT", "Cursor", "Gemini"].map(
                  (tool) => (
                    <span
                      key={tool}
                      className="px-4 py-2 bg-yellow-500/10 rounded-lg text-yellow-300 text-sm"
                    >
                      {tool}
                    </span>
                  )
                )}
              </div>
              <p className="text-slate-300 text-lg mb-4">
                Everyone uses their favorite AI tool. There&apos;s{" "}
                <strong className="text-white">no standardization</strong>,{" "}
                <strong className="text-white">no governance</strong>,{" "}
                <strong className="text-white">no measurement</strong>.
              </p>
              <div className="mt-6">
                <span className="inline-block px-6 py-3 bg-yellow-500/20 text-yellow-400 rounded-xl text-xl font-bold">
                  You&apos;re paying for AI but can&apos;t prove ROI
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Slide 5: Problem 4 - The Human Cost */}
        <section
          id="problem-4"
          className="h-screen snap-start flex items-center justify-center px-4 bg-gradient-to-b from-yellow-900/20 to-purple-900/20"
        >
          <div className="max-w-4xl text-center">
            <div className="w-20 h-20 bg-purple-500/20 rounded-2xl flex items-center justify-center text-5xl mb-6 mx-auto">
              💔
            </div>
            <div className="text-purple-400 text-sm font-bold mb-2">
              PROBLEM 4
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              The Human Cost
            </h2>
            <div className="bg-slate-800/50 rounded-2xl p-8 border border-purple-500/20">
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                {[
                  { icon: "🌙", text: "Weekend Deployments" },
                  { icon: "⏰", text: "Crunch Time" },
                  { icon: "😰", text: "Burnout Normalized" },
                ].map((item) => (
                  <div
                    key={item.text}
                    className="px-4 py-4 bg-purple-500/10 rounded-lg text-center"
                  >
                    <div className="text-3xl mb-2">{item.icon}</div>
                    <div className="text-purple-300 text-sm">{item.text}</div>
                  </div>
                ))}
              </div>
              <p className="text-slate-300 text-lg">
                Your best engineers leave for companies that{" "}
                <strong className="text-white">respect their time</strong>.
              </p>
              <div className="mt-6">
                <span className="inline-block px-6 py-3 bg-purple-500/20 text-purple-400 rounded-xl text-xl font-bold">
                  This isn&apos;t sustainable.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Slide 6: CTA - See the Solution */}
        <section
          id="cta"
          className="h-screen snap-start flex items-center justify-center px-4 bg-gradient-to-b from-purple-900/20 to-blue-900/20"
        >
          <div className="max-w-4xl text-center">
            <div className="inline-block px-4 py-2 bg-green-500/20 text-green-300 rounded-full text-sm mb-6">
              There Is a Better Way
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              What if features shipped in{" "}
              <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                hours, not weeks?
              </span>
            </h2>
            <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
              Not by working harder. By working{" "}
              <strong className="text-white">differently</strong>.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/customer/pitch"
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all text-lg"
              >
                See the Solution →
              </Link>
              <Link
                href="/customer/demo"
                className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl border border-slate-700 transition-all text-lg"
              >
                Skip to Demo
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
