"use client";

import { useState } from "react";
import Link from "next/link";
import PageNavigation from "@/components/PageNavigation";

export default function SupportPage() {
  const [formData, setFormData] = useState({
    type: "question",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would send to an API
    const mailtoLink = `mailto:suman.addanki@gmail.com?subject=${encodeURIComponent(
      `[QUAD ${formData.type.toUpperCase()}] ${formData.subject}`
    )}&body=${encodeURIComponent(
      `From: ${formData.email}\n\nType: ${formData.type}\n\n${formData.message}`
    )}`;
    window.location.href = mailtoLink;
    setSubmitted(true);
  };

  const faqs = [
    {
      q: "What is the 4-4-4 principle?",
      a: "The 4-4-4 principle means working 4 hours/day, 4 days/week, achieving 4X efficiency through AI augmentation. It's about working smarter, not longer.",
    },
    {
      q: "How is QUAD different from Agile?",
      a: "QUAD replaces ceremonies with AI agents, reduces documentation overhead, and enables same-day feedback loops instead of 2-week sprints.",
    },
    {
      q: "Can I use QUAD for my existing projects?",
      a: "Yes! QUAD is designed to be adopted incrementally. Start with the Adoption Matrix to assess your current state and gradually introduce AI agents.",
    },
    {
      q: "Is QUAD suitable for small teams?",
      a: "Absolutely. QUAD scales from solo developers to enterprise teams. The AI agents help small teams achieve the output of larger teams.",
    },
    {
      q: "What tools does QUAD integrate with?",
      a: "QUAD integrates with 35+ tools including GitHub, Jira, Linear, Slack, VS Code, and more. Check our Tools Catalog for the full list.",
    },
    {
      q: "Is there a free tier?",
      a: "Yes! The QUAD Platform offers a free tier for individual developers and small teams. Enterprise features require a subscription.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <PageNavigation />

      <section className="py-20 px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-black mb-4 text-center">
            <span className="gradient-text">Support</span>
          </h1>
          <p className="text-xl text-slate-400 text-center mb-12 max-w-2xl mx-auto">
            Get help, report issues, or give feedback. We're here to help you succeed with QUAD.
          </p>

          {/* Quick Links */}
          <div className="grid md:grid-cols-3 gap-4 mb-12">
            <Link
              href="/docs"
              className="glass-card rounded-xl p-6 hover:bg-white/5 transition-colors text-center"
            >
              <div className="text-3xl mb-2">📚</div>
              <h3 className="font-semibold text-white mb-1">Documentation</h3>
              <p className="text-sm text-slate-400">Read the complete guides</p>
            </Link>
            <Link
              href="/cheatsheet"
              className="glass-card rounded-xl p-6 hover:bg-white/5 transition-colors text-center"
            >
              <div className="text-3xl mb-2">📄</div>
              <h3 className="font-semibold text-white mb-1">Cheat Sheet</h3>
              <p className="text-sm text-slate-400">Quick reference guide</p>
            </Link>
            <Link
              href="/quiz"
              className="glass-card rounded-xl p-6 hover:bg-white/5 transition-colors text-center"
            >
              <div className="text-3xl mb-2">🎯</div>
              <h3 className="font-semibold text-white mb-1">Take the Quiz</h3>
              <p className="text-sm text-slate-400">Test your understanding</p>
            </Link>
          </div>

          {/* Contact Form */}
          <div className="glass-card rounded-xl p-8 mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Contact Us</h2>

            {submitted ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-xl font-semibold text-green-400 mb-2">Message Sent!</h3>
                <p className="text-slate-400 mb-4">
                  Your email client should have opened with the message. If not, email us directly at:
                </p>
                <a
                  href="mailto:suman.addanki@gmail.com"
                  className="text-blue-400 hover:text-blue-300"
                >
                  suman.addanki@gmail.com
                </a>
                <button
                  onClick={() => setSubmitted(false)}
                  className="block mx-auto mt-6 px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    What can we help you with?
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { value: "question", label: "Question", icon: "❓" },
                      { value: "bug", label: "Bug Report", icon: "🐛" },
                      { value: "feature", label: "Feature Request", icon: "💡" },
                      { value: "feedback", label: "Feedback", icon: "💬" },
                    ].map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: type.value })}
                        className={`p-3 rounded-lg border transition-all ${
                          formData.type === type.value
                            ? "border-blue-500 bg-blue-500/20 text-white"
                            : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500"
                        }`}
                      >
                        <div className="text-2xl mb-1">{type.icon}</div>
                        <div className="text-sm">{type.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                    Your Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="you@company.com"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-slate-300 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Brief description of your issue"
                  />
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-slate-300 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
                    placeholder="Describe your question, issue, or feedback in detail..."
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  Send Message
                </button>
              </form>
            )}
          </div>

          {/* FAQ */}
          <div className="glass-card rounded-xl p-8 mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div key={idx} className="border-b border-slate-700 pb-4 last:border-0">
                  <h3 className="font-semibold text-white mb-2">{faq.q}</h3>
                  <p className="text-slate-400 text-sm">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Direct Contact */}
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-4">Prefer Direct Contact?</h2>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="mailto:suman.addanki@gmail.com?subject=QUAD%20Framework%20Inquiry"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span>✉️</span> suman.addanki@gmail.com
              </a>
              <a
                href="https://github.com/a2vibecreators/quadframework/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                <span>🐙</span> GitHub Issues
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
