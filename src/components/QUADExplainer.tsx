"use client";

import { useState, useEffect } from "react";

interface QUADExplainerProps {
  onComplete?: () => void;
  autoPlay?: boolean;
}

// Animation phases
type Phase = "intro" | "circles" | "agents" | "connect" | "complete";

export default function QUADExplainer({ onComplete, autoPlay = true }: QUADExplainerProps) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [isPlaying, setIsPlaying] = useState(autoPlay);

  // Phase durations in milliseconds
  const PHASE_DURATIONS: Record<Phase, number> = {
    intro: 1500,
    circles: 2500,
    agents: 2000,
    connect: 2000,
    complete: 1500,
  };

  useEffect(() => {
    if (!isPlaying) return;

    const phases: Phase[] = ["intro", "circles", "agents", "connect", "complete"];
    let currentIndex = phases.indexOf(phase);

    if (currentIndex < phases.length - 1) {
      const timer = setTimeout(() => {
        setPhase(phases[currentIndex + 1]);
      }, PHASE_DURATIONS[phase]);
      return () => clearTimeout(timer);
    } else {
      // Animation complete
      const timer = setTimeout(() => {
        onComplete?.();
      }, PHASE_DURATIONS.complete);
      return () => clearTimeout(timer);
    }
  }, [phase, isPlaying, onComplete]);

  const restart = () => {
    setPhase("intro");
    setIsPlaying(true);
  };

  // Circle data
  const circles = [
    { num: 1, name: "Management", color: "blue", icon: "📋", roles: "BA, PM, TL" },
    { num: 2, name: "Development", color: "green", icon: "💻", roles: "Devs" },
    { num: 3, name: "QA", color: "yellow", icon: "🧪", roles: "QA, SDET" },
    { num: 4, name: "Infrastructure", color: "purple", icon: "🔧", roles: "DevOps, SRE" },
  ];

  // AI Agent data
  const agents = [
    { name: "Story Agent", color: "blue", position: 0 },
    { name: "Dev Agent", color: "green", position: 1 },
    { name: "Test Agent", color: "yellow", position: 2 },
    { name: "Deploy Agent", color: "purple", position: 3 },
  ];

  return (
    <div className="relative w-full max-w-2xl mx-auto aspect-square">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>
      </div>

      {/* Center logo */}
      <div className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 ${
        phase === "intro" ? "scale-150 opacity-0" :
        phase === "complete" ? "scale-100 opacity-100" : "scale-75 opacity-50"
      }`}>
        <div className="text-center">
          <div className="text-6xl font-black gradient-text">QUAD</div>
          <div className="text-sm text-slate-500 mt-1">Circle of Functions</div>
        </div>
      </div>

      {/* The 4 Circles - orbit around center */}
      {circles.map((circle, i) => {
        const angle = (i * 90) - 45; // Position at corners
        const radius = phase === "circles" || phase === "agents" || phase === "connect" ? 35 : 50;
        const x = 50 + radius * Math.cos((angle * Math.PI) / 180);
        const y = 50 + radius * Math.sin((angle * Math.PI) / 180);

        return (
          <div
            key={circle.num}
            className={`absolute w-24 h-24 transition-all duration-1000 ${
              phase === "intro" ? "opacity-0 scale-0" : "opacity-100 scale-100"
            }`}
            style={{
              left: `${x}%`,
              top: `${y}%`,
              transform: `translate(-50%, -50%)`,
              transitionDelay: `${i * 150}ms`,
            }}
          >
            <div className={`w-full h-full rounded-2xl bg-${circle.color}-500/20 border border-${circle.color}-500/40
              flex flex-col items-center justify-center p-2 backdrop-blur-sm
              ${phase === "connect" ? "animate-pulse" : ""}`}
            >
              <div className="text-2xl mb-1">{circle.icon}</div>
              <div className={`text-xs font-bold text-${circle.color}-300`}>C{circle.num}</div>
              <div className="text-[10px] text-slate-400">{circle.name}</div>
            </div>
          </div>
        );
      })}

      {/* AI Agents - appear in agents phase */}
      {agents.map((agent, i) => {
        const angle = (i * 90) + 45; // Between circles
        const radius = 25;
        const x = 50 + radius * Math.cos((angle * Math.PI) / 180);
        const y = 50 + radius * Math.sin((angle * Math.PI) / 180);

        return (
          <div
            key={agent.name}
            className={`absolute transition-all duration-700 ${
              phase === "agents" || phase === "connect" || phase === "complete"
                ? "opacity-100 scale-100"
                : "opacity-0 scale-0"
            }`}
            style={{
              left: `${x}%`,
              top: `${y}%`,
              transform: `translate(-50%, -50%)`,
              transitionDelay: `${i * 100}ms`,
            }}
          >
            <div className={`w-12 h-12 rounded-full bg-${agent.color}-500/30 border-2 border-${agent.color}-400
              flex items-center justify-center text-lg
              ${phase === "connect" ? "animate-bounce" : ""}`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              🤖
            </div>
          </div>
        );
      })}

      {/* Connection lines - appear in connect phase */}
      <svg
        className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${
          phase === "connect" || phase === "complete" ? "opacity-100" : "opacity-0"
        }`}
        viewBox="0 0 100 100"
      >
        {/* Lines connecting circles */}
        {[0, 1, 2, 3].map((i) => {
          const angle1 = (i * 90) - 45;
          const angle2 = ((i + 1) * 90) - 45;
          const radius = 35;
          const x1 = 50 + radius * Math.cos((angle1 * Math.PI) / 180);
          const y1 = 50 + radius * Math.sin((angle1 * Math.PI) / 180);
          const x2 = 50 + radius * Math.cos((angle2 * Math.PI) / 180);
          const y2 = 50 + radius * Math.sin((angle2 * Math.PI) / 180);

          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgba(59, 130, 246, 0.3)"
              strokeWidth="0.5"
              strokeDasharray="2,2"
              className="animate-pulse"
            />
          );
        })}
        {/* Lines to center */}
        {[0, 1, 2, 3].map((i) => {
          const angle = (i * 90) - 45;
          const radius = 35;
          const x = 50 + radius * Math.cos((angle * Math.PI) / 180);
          const y = 50 + radius * Math.sin((angle * Math.PI) / 180);

          return (
            <line
              key={`center-${i}`}
              x1={x}
              y1={y}
              x2={50}
              y2={50}
              stroke="rgba(59, 130, 246, 0.2)"
              strokeWidth="0.3"
              strokeDasharray="1,1"
            />
          );
        })}
      </svg>

      {/* Phase indicator */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
        <div className="flex gap-1">
          {["intro", "circles", "agents", "connect", "complete"].map((p) => (
            <div
              key={p}
              className={`w-2 h-2 rounded-full transition-all ${
                p === phase ? "bg-blue-400 scale-125" : "bg-slate-600"
              }`}
            />
          ))}
        </div>
        <button
          onClick={restart}
          className="text-xs text-slate-500 hover:text-white transition-colors"
        >
          Replay ↻
        </button>
      </div>

      {/* Phase text */}
      <div className="absolute top-4 left-4 right-4 text-center">
        <div className={`text-sm font-medium transition-all duration-500 ${
          phase === "intro" ? "opacity-100" : "opacity-0 absolute"
        }`}>
          <span className="text-blue-300">Quick Unified Agentic Development</span>
        </div>
        <div className={`text-sm font-medium transition-all duration-500 ${
          phase === "circles" ? "opacity-100" : "opacity-0 absolute"
        }`}>
          <span className="text-slate-300">4 Functional Circles</span>
        </div>
        <div className={`text-sm font-medium transition-all duration-500 ${
          phase === "agents" ? "opacity-100" : "opacity-0 absolute"
        }`}>
          <span className="text-amber-300">AI Agents at Every Step</span>
        </div>
        <div className={`text-sm font-medium transition-all duration-500 ${
          phase === "connect" ? "opacity-100" : "opacity-0 absolute"
        }`}>
          <span className="text-green-300">Seamlessly Connected</span>
        </div>
        <div className={`text-sm font-medium transition-all duration-500 ${
          phase === "complete" ? "opacity-100" : "opacity-0 absolute"
        }`}>
          <span className="text-purple-300">Documentation-First Development</span>
        </div>
      </div>
    </div>
  );
}
